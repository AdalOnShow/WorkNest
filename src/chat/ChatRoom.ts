import { DurableObject } from 'cloudflare:workers'
import { createDb } from '#/db'
import type { Database } from '#/db'
import { chatMessage } from '#/db/schema'
import { getProjectRole } from '#/lib/authz'
import {
  CHAT_HEADERS,
  CHAT_PING,
  CHAT_PONG,
  clientEventSchema,
} from '#/chat/events'
import type {
  ChatErrorCode,
  ChatMessageDTO,
  ChatUser,
  ClientEvent,
  ServerEvent,
} from '#/chat/events'
import { and, eq } from 'drizzle-orm'

/** Per-socket metadata. Survives hibernation via serializeAttachment(). */
interface SocketAttachment {
  user: ChatUser
  projectId: string
}

// Best-effort limits. Counters live in memory, so they reset when the DO
// hibernates; that is acceptable for abuse damping, not a hard quota.
const SEND_WINDOW_MS = 10_000
const SEND_MAX_PER_WINDOW = 10
const TYPING_MIN_INTERVAL_MS = 2_000

// Application close codes (4000-4999 are free for app use).
const CLOSE_NOT_MEMBER = 4003

interface SocketRate {
  windowStart: number
  sends: number
  lastTyping: number
}

/**
 * ChatRoom: the live hub for one project's chat.
 *
 * One instance per project, addressed with `CHAT_ROOM.idFromName(projectId)`.
 * It never stores messages itself: SEND/DELETE write to D1 and then fan out to
 * every socket in the room. History is read from D1 by a server function.
 *
 * Uses the WebSocket Hibernation API: `ctx.acceptWebSocket()` lets the runtime
 * evict this object from memory while sockets stay open, and wake it (re-running
 * the constructor) only when a frame arrives. Keepalive "ping" frames are
 * answered by the runtime itself and never wake it.
 *
 * Only the authenticated upgrade route can reach this object. It verifies the
 * session and membership and passes the user in CHAT_HEADERS.
 */
export class ChatRoom extends DurableObject<Env> {
  private dbInstance: Database | null = null
  private rates = new WeakMap<WebSocket, SocketRate>()

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    // Runs on every wake, so keep it cheap. Auto-response is handled by the
    // runtime without waking the object.
    ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair(CHAT_PING, CHAT_PONG),
    )
  }

  private get db(): Database {
    this.dbInstance ??= createDb(this.env.DB)
    return this.dbInstance
  }

  // ─── Connection ──────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }

    const userId = request.headers.get(CHAT_HEADERS.userId)
    const projectId = request.headers.get(CHAT_HEADERS.projectId)
    if (!userId || !projectId) {
      return new Response('Missing verified user', { status: 400 })
    }
    const encodedImage = request.headers.get(CHAT_HEADERS.userImage)
    const user: ChatUser = {
      id: userId,
      name: decodeURIComponent(
        request.headers.get(CHAT_HEADERS.userName) ?? '',
      ),
      image: encodedImage ? decodeURIComponent(encodedImage) : null,
    }

    const wasOnline = this.openSockets(user.id).length > 0

    const { 0: client, 1: server } = new WebSocketPair()
    // The tag (user id) lets us find all of a user's tabs for presence dedupe.
    this.ctx.acceptWebSocket(server, [user.id])
    server.serializeAttachment({ user, projectId } satisfies SocketAttachment)

    this.send(server, { type: 'PRESENCE_SNAPSHOT', users: this.onlineUsers() })
    if (!wasOnline) {
      this.broadcast({ type: 'USER_ONLINE', user }, server)
    }

    return new Response(null, { status: 101, webSocket: client })
  }

  // ─── Hibernation handlers ────────────────────────────

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== 'string') {
      this.sendError(ws, 'INVALID_EVENT', 'Binary frames are not supported')
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      this.sendError(ws, 'INVALID_EVENT', 'Malformed JSON')
      return
    }

    const result = clientEventSchema.safeParse(parsed)
    if (!result.success) {
      const clientId =
        typeof parsed === 'object' && parsed !== null && 'clientId' in parsed
          ? String(parsed.clientId)
          : undefined
      this.sendError(
        ws,
        'INVALID_EVENT',
        result.error.issues[0]?.message ?? 'Invalid event',
        clientId,
      )
      return
    }

    const attachment = this.attachment(ws)
    try {
      await this.handleEvent(ws, attachment, result.data)
    } catch (err) {
      console.error('[ChatRoom] event failed:', err)
      this.sendError(
        ws,
        'INTERNAL',
        'Something went wrong',
        result.data.type === 'SEND' ? result.data.clientId : undefined,
      )
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    this.handleDisconnect(ws)
    try {
      // 1005/1006 are reserved and cannot be sent back; answer with 1000.
      ws.close(code === 1005 || code === 1006 ? 1000 : code, reason)
    } catch {
      // Already closed.
    }
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    console.error('[ChatRoom] socket error:', error)
    this.handleDisconnect(ws)
  }

  // ─── Events ──────────────────────────────────────────

  private async handleEvent(
    ws: WebSocket,
    { user, projectId }: SocketAttachment,
    event: ClientEvent,
  ) {
    switch (event.type) {
      case 'SEND': {
        if (!this.allowSend(ws)) {
          this.sendError(
            ws,
            'RATE_LIMITED',
            'Slow down a little',
            event.clientId,
          )
          return
        }
        // Membership is re-checked so a removed member's open tab can't keep posting.
        if (!(await this.requireMember(ws, projectId, user.id))) return

        const message: ChatMessageDTO = {
          id: crypto.randomUUID(),
          projectId,
          body: event.body,
          createdAt: Date.now(),
          sender: user,
        }
        await this.db.insert(chatMessage).values({
          id: message.id,
          projectId,
          senderId: user.id,
          body: message.body,
          createdAt: new Date(message.createdAt),
        })
        this.broadcast({
          type: 'MESSAGE_CREATED',
          message,
          clientId: event.clientId,
        })
        return
      }

      case 'DELETE': {
        const role = await this.requireMember(ws, projectId, user.id)
        if (!role) return

        const existing = (
          await this.db
            .select({ senderId: chatMessage.senderId })
            .from(chatMessage)
            .where(
              and(
                eq(chatMessage.id, event.messageId),
                eq(chatMessage.projectId, projectId),
              ),
            )
            .limit(1)
        ).at(0)

        if (!existing) {
          this.sendError(ws, 'NOT_FOUND', 'Message not found')
          return
        }
        if (existing.senderId !== user.id && role !== 'ADMIN') {
          this.sendError(
            ws,
            'FORBIDDEN',
            'Only the author or a project admin can delete this message',
          )
          return
        }

        await this.db
          .delete(chatMessage)
          .where(
            and(
              eq(chatMessage.id, event.messageId),
              eq(chatMessage.projectId, projectId),
            ),
          )
        this.broadcast({ type: 'MESSAGE_DELETED', messageId: event.messageId })
        return
      }

      case 'TYPING': {
        const rate = this.rate(ws)
        const now = Date.now()
        if (now - rate.lastTyping < TYPING_MIN_INTERVAL_MS) return
        rate.lastTyping = now
        this.broadcast({ type: 'TYPING', user }, ws)
        return
      }
    }
  }

  /** Returns the member's role, or closes the socket and returns null. */
  private async requireMember(
    ws: WebSocket,
    projectId: string,
    userId: string,
  ) {
    const role = await getProjectRole(this.db, projectId, userId)
    if (!role) {
      this.sendError(
        ws,
        'FORBIDDEN',
        'You are no longer a member of this project',
      )
      ws.close(CLOSE_NOT_MEMBER, 'Not a project member')
      this.handleDisconnect(ws)
    }
    return role
  }

  // ─── Presence ────────────────────────────────────────

  private handleDisconnect(ws: WebSocket) {
    const { user } = this.attachment(ws)
    const stillOnline = this.openSockets(user.id).some((s) => s !== ws)
    if (!stillOnline) {
      this.broadcast({ type: 'USER_OFFLINE', userId: user.id }, ws)
    }
  }

  private onlineUsers(): ChatUser[] {
    const users = new Map<string, ChatUser>()
    for (const ws of this.openSockets()) {
      const { user } = this.attachment(ws)
      users.set(user.id, user)
    }
    return [...users.values()]
  }

  private openSockets(tag?: string): WebSocket[] {
    return this.ctx
      .getWebSockets(tag)
      .filter((ws) => ws.readyState === WebSocket.OPEN)
  }

  // ─── Helpers ─────────────────────────────────────────

  private attachment(ws: WebSocket): SocketAttachment {
    return ws.deserializeAttachment() as SocketAttachment
  }

  private rate(ws: WebSocket): SocketRate {
    let rate = this.rates.get(ws)
    if (!rate) {
      rate = { windowStart: Date.now(), sends: 0, lastTyping: 0 }
      this.rates.set(ws, rate)
    }
    return rate
  }

  private allowSend(ws: WebSocket): boolean {
    const rate = this.rate(ws)
    const now = Date.now()
    if (now - rate.windowStart >= SEND_WINDOW_MS) {
      rate.windowStart = now
      rate.sends = 0
    }
    rate.sends += 1
    return rate.sends <= SEND_MAX_PER_WINDOW
  }

  private send(ws: WebSocket, event: ServerEvent) {
    try {
      ws.send(JSON.stringify(event))
    } catch {
      // Socket closed between lookup and send; presence handles cleanup.
    }
  }

  private sendError(
    ws: WebSocket,
    code: ChatErrorCode,
    message: string,
    clientId?: string,
  ) {
    this.send(ws, { type: 'ERROR', code, message, clientId })
  }

  private broadcast(event: ServerEvent, except?: WebSocket) {
    const data = JSON.stringify(event)
    for (const ws of this.openSockets()) {
      if (ws === except) continue
      try {
        ws.send(data)
      } catch {
        // Ignore sockets that closed mid-broadcast.
      }
    }
  }
}
