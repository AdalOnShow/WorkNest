import { DurableObject } from 'cloudflare:workers'
import { createAuth } from '#/lib/auth'
import type { AuthEnv } from '#/lib/auth'

interface NotificationEvent {
  type: 'NOTIFICATION_CREATED' | 'NOTIFICATION_READ' | 'NOTIFICATION_READ_ALL'
  payload: {
    notificationId?: string
    recipientId: string
    title?: string
    message?: string
    unreadCount?: number
  }
}

interface WebSocketAttachment {
  userId: string
  connectedAt: number
}

/**
 * NotificationDO - Durable Object for real-time notification delivery.
 *
 * Each instance serves one user. When a notification is created for a user,
 * the server calls `sendNotification()` on the user's DO stub to push it
 * via WebSocket. Uses WebSocket hibernation for zero-cost idle connections.
 *
 * ID strategy: `idFromName(userId)` — deterministic per user.
 */
export class NotificationDO extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)

    if (url.pathname === '/ws') {
      if (req.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 })
      }

      const auth = createAuth(this.env as AuthEnv)
      const session = await auth.api.getSession({ headers: req.headers })
      if (!session) {
        return new Response('Unauthorized', { status: 401 })
      }

      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      const attachment: WebSocketAttachment = {
        userId: session.user.id,
        connectedAt: Date.now(),
      }
      server.serializeAttachment(attachment)

      this.ctx.acceptWebSocket(server, ['notifications', `user:${session.user.id}`])

      return new Response(null, { status: 101, webSocket: client })
    }

    if (url.pathname === '/health') {
      const sockets = this.ctx.getWebSockets('notifications')
      return Response.json({
        status: 'ok',
        connections: sockets.length,
      })
    }

    return new Response('NotificationDO', { status: 200 })
  }

  async sendNotification(event: NotificationEvent): Promise<void> {
    const data = JSON.stringify(event)
    const sockets = this.ctx.getWebSockets('notifications')

    for (const ws of sockets) {
      try {
        const attachment = ws.deserializeAttachment() as WebSocketAttachment | null
        if (attachment && attachment.userId === event.payload.recipientId) {
          ws.send(data)
        }
      } catch {
        // Connection may have been closed, ignore
      }
    }
  }

  async sendUnreadCount(recipientId: string, count: number): Promise<void> {
    const data = JSON.stringify({
      type: 'UNREAD_COUNT_UPDATED',
      payload: { recipientId, unreadCount: count },
    })
    const sockets = this.ctx.getWebSockets('notifications')

    for (const ws of sockets) {
      try {
        const attachment = ws.deserializeAttachment() as WebSocketAttachment | null
        if (attachment && attachment.userId === recipientId) {
          ws.send(data)
        }
      } catch {
        // Connection may have been closed, ignore
      }
    }
  }

  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    try {
      const data = JSON.parse(
        typeof message === 'string'
          ? message
          : new TextDecoder().decode(message),
      )

      const attachment = ws.deserializeAttachment() as WebSocketAttachment | null
      if (!attachment) {
        ws.close(1008, 'Invalid connection')
        return
      }

      switch (data.type) {
        case 'MARK_READ': {
          if (data.payload?.notificationId) {
            this.ctx.getTags(ws)
          }
          break
        }
        case 'PING': {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }))
          break
        }
      }
    } catch {
      // Ignore malformed messages
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ): Promise<void> {
    // Cleanup is automatic with hibernation API
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('[NotificationDO] WebSocket error:', error)
  }
}
