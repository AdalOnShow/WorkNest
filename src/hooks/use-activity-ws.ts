import { useCallback, useEffect, useRef, useState } from 'react'

interface ActivityWSMessage {
  type: 'ACTIVITY_CREATED' | 'ACTIVITY_UPDATED' | 'PONG'
  payload: {
    activityId: string
    projectId: string
    actorId: string
    action: string
    entityType: string
    entityId: string
    metadata?: string
    timestamp?: number
  }
}

interface UseActivityWSOptions {
  projectId: string
  enabled?: boolean
  onActivity?: (activity: ActivityWSMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

interface UseActivityWSReturn {
  isConnected: boolean
  lastActivity: ActivityWSMessage | null
  connect: () => void
  disconnect: () => void
}

export function useActivityWS(options: UseActivityWSOptions): UseActivityWSReturn {
  const {
    projectId,
    enabled = true,
    onActivity,
    onConnect,
    onDisconnect,
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [lastActivity, setLastActivity] = useState<ActivityWSMessage | null>(null)

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

    if (!projectId) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws/activities?projectId=${encodeURIComponent(projectId)}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log(`[ActivityWS] Connected to project ${projectId}`)
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        startPingInterval()
        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ActivityWSMessage
          setLastActivity(data)

          switch (data.type) {
            case 'ACTIVITY_CREATED':
            case 'ACTIVITY_UPDATED':
              onActivity?.(data)
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
        console.log(`[ActivityWS] Disconnected from project ${projectId}`, event.code, event.reason)
        setIsConnected(false)
        stopPingInterval()
        wsRef.current = null
        onDisconnect?.()

        if (event.code !== 1000 && enabled) {
          const delay = getReconnectDelay()
          reconnectAttemptsRef.current++
          console.log(`[ActivityWS] Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttemptsRef.current})`)
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        }
      }

      ws.onerror = (error) => {
        console.error(`[ActivityWS] Error for project ${projectId}:`, error)
      }
    } catch (error) {
      console.error(`[ActivityWS] Connection failed for project ${projectId}:`, error)
      if (enabled) {
        const delay = getReconnectDelay()
        reconnectAttemptsRef.current++
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }
    }
  }, [projectId, enabled, onActivity, onConnect, onDisconnect, getReconnectDelay, startPingInterval, stopPingInterval])

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
    if (enabled && projectId) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, projectId, connect, disconnect])

  return {
    isConnected,
    lastActivity,
    connect,
    disconnect,
  }
}