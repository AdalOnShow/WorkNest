import { DurableObject } from 'cloudflare:workers'

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
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      this.ctx.acceptWebSocket(server, ['notifications'])
      return new Response(null, { status: 101, webSocket: client })
    }

    return new Response('NotificationDO', { status: 200 })
  }


  async sendNotification(event: NotificationEvent): Promise<void> {
    const data = JSON.stringify(event)
    const sockets = this.ctx.getWebSockets('notifications')
    for (const ws of sockets) {
      try {
        ws.send(data)
      } catch {
      }
    }
  }


  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message))

      if (data.type === 'MARK_READ') {
      }
    } catch {
    }
  }


  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ): Promise<void> {
  }


  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('[NotificationDO] WebSocket error:', error)
  }
}
