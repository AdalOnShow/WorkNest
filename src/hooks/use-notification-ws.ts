import { useCallback, useEffect, useRef, useState } from 'react'

interface NotificationWSMessage {
  type: 'NOTIFICATION_CREATED' | 'NOTIFICATION_READ' | 'NOTIFICATION_READ_ALL' | 'UNREAD_COUNT_UPDATED' | 'PONG'
  payload: {
    notificationId?: string
    recipientId?: string
    title?: string
    message?: string
    unreadCount?: number
    timestamp?: number
  }
}

interface UseNotificationWSOptions {
  enabled?: boolean
  onNotification?: (notification: NotificationWSMessage) => void
  onUnreadCountChange?: (count: number) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

interface UseNotificationWSReturn {
  isConnected: boolean
  unreadCount: number
  lastMessage: NotificationWSMessage | null
  connect: () => void
  disconnect: () => void
}

export function useNotificationWS(options: UseNotificationWSOptions = {}): UseNotificationWSReturn {
  const {
    enabled = true,
    onNotification,
    onUnreadCountChange,
    onConnect,
    onDisconnect,
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastMessage, setLastMessage] = useState<NotificationWSMessage | null>(null)

  const maxReconnectAttempts = 10
  const baseReconnectDelay = 1000
  const maxReconnectDelay = 30000
  const pingInterval = 30000

  const getReconnectDelay = useCallback(() => {
    const attempt = reconnectAttemptsRef.current
    const delay = Math.min(baseReconnectDelay * Math.pow(2, attempt), maxReconnectDelay)
    return delay + Math.random() * 1000
  }, [])

  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }

    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }))
      }
    }, pingInterval)
  }, [])

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws/notifications`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[NotificationWS] Connected')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        startPingInterval()
        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as NotificationWSMessage
          setLastMessage(data)

          switch (data.type) {
            case 'NOTIFICATION_CREATED':
              onNotification?.(data)
              setUnreadCount((prev) => prev + 1)
              break
            case 'UNREAD_COUNT_UPDATED':
              if (data.payload.unreadCount !== undefined) {
                setUnreadCount(data.payload.unreadCount)
                onUnreadCountChange?.(data.payload.unreadCount)
              }
              break
            case 'PONG':
              // Heartbeat response, connection is alive
              break
          }
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onclose = (event) => {
        console.log('[NotificationWS] Disconnected', event.code, event.reason)
        setIsConnected(false)
        stopPingInterval()
        wsRef.current = null
        onDisconnect?.()

        if (event.code !== 1000 && enabled) {
          const delay = getReconnectDelay()
          reconnectAttemptsRef.current++
          console.log(`[NotificationWS] Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttemptsRef.current})`)
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        }
      }

      ws.onerror = (error) => {
        console.error('[NotificationWS] Error:', error)
      }
    } catch (error) {
      console.error('[NotificationWS] Connection failed:', error)
      if (enabled) {
        const delay = getReconnectDelay()
        reconnectAttemptsRef.current++
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }
    }
  }, [enabled, onNotification, onUnreadCountChange, onConnect, onDisconnect, getReconnectDelay, startPingInterval, stopPingInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    stopPingInterval()

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect')
      wsRef.current = null
    }

    setIsConnected(false)
    reconnectAttemptsRef.current = 0
  }, [stopPingInterval])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    unreadCount,
    lastMessage,
    connect,
    disconnect,
  }
}