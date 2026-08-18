import { DurableObject } from 'cloudflare:workers'

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
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      this.ctx.acceptWebSocket(server, ['activities'])
      return new Response(null, { status: 101, webSocket: client })
    }

    return new Response('ActivityDO', { status: 200 })
  }


  async broadcastActivity(event: ActivityEvent): Promise<void> {
    const data = JSON.stringify(event)
    const sockets = this.ctx.getWebSockets('activities')
    for (const ws of sockets) {
      try {
        ws.send(data)
      } catch {
      }
    }
  }


  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {

  }


  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ): Promise<void> {
  }


  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('[ActivityDO] WebSocket error:', error)
  }
}
