import { DurableObject } from 'cloudflare:workers'
import { createAuth } from '#/lib/auth'
import type { AuthEnv } from '#/lib/auth'

interface ActivityEvent {
  type: 'ACTIVITY_CREATED' | 'ACTIVITY_UPDATED'
  payload: {
    activityId: string
    projectId: string
    actorId: string
    action: string
    entityType: string
    entityId: string
    metadata?: string
  }
}

interface WebSocketAttachment {
  userId: string
  projectId: string
  connectedAt: number
}

/**
 * ActivityDO - Durable Object for broadcasting activities to project members.
 *
 * Each instance serves one project. When an activity occurs in a project,
 * the server calls `broadcastActivity()` on the project's DO stub to push
 * it to all connected project members via WebSocket. Uses hibernation for
 * zero-cost idle connections.
 *
 * ID strategy: `idFromName(projectId)` — deterministic per project.
 */
export class ActivityDO extends DurableObject<Env> {
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

      const projectId = url.searchParams.get('projectId')
      if (!projectId) {
        return new Response('projectId required', { status: 400 })
      }

      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      const attachment: WebSocketAttachment = {
        userId: session.user.id,
        projectId,
        connectedAt: Date.now(),
      }
      server.serializeAttachment(attachment)

      this.ctx.acceptWebSocket(server, ['activities', `project:${projectId}`])

      return new Response(null, { status: 101, webSocket: client })
    }

    if (url.pathname === '/health') {
      const sockets = this.ctx.getWebSockets('activities')
      return Response.json({
        status: 'ok',
        connections: sockets.length,
      })
    }

    return new Response('ActivityDO', { status: 200 })
  }

  async broadcastActivity(event: ActivityEvent): Promise<void> {
    const data = JSON.stringify(event)
    const sockets = this.ctx.getWebSockets('activities')

    for (const ws of sockets) {
      try {
        const attachment = ws.deserializeAttachment() as WebSocketAttachment | null
        if (attachment && attachment.projectId === event.payload.projectId) {
          ws.send(data)
        }
      } catch {
        // Connection may have been closed, ignore
      }
    }
  }

  async getConnectedUsers(projectId: string): Promise<string[]> {
    const sockets = this.ctx.getWebSockets('activities')
    const userIds: string[] = []

    for (const ws of sockets) {
      try {
        const attachment = ws.deserializeAttachment() as WebSocketAttachment | null
        if (attachment && attachment.projectId === projectId) {
          userIds.push(attachment.userId)
        }
      } catch {
        // Ignore
      }
    }

    return [...new Set(userIds)]
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
    console.error('[ActivityDO] WebSocket error:', error)
  }
}
