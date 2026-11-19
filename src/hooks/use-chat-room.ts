import { useQueryClient } from '@tanstack/react-query'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAT_PING, CHAT_PONG } from '#/chat/events'
import type {
  ChatHistoryPage,
  ChatMessageDTO,
  ChatUser,
  ClientEvent,
  ServerEvent,
} from '#/chat/events'

export type ChatConnectionStatus =
  'connecting' | 'open' | 'reconnecting' | 'offline'

/** A message the user sent that the room has not confirmed yet. */
export interface PendingMessage {
  clientId: string
  body: string
  createdAt: number
  status: 'sending' | 'failed'
  error?: string
}

type ChatHistoryData = InfiniteData<ChatHistoryPage, string | null>

export function chatMessagesQueryKey(projectId: string) {
  return ['chat', projectId, 'messages'] as const
}

// Keepalive. The ChatRoom answers "ping" via setWebSocketAutoResponse without
// waking, so this is free server-side and stops idle proxies dropping us.
const PING_INTERVAL_MS = 30_000
const TYPING_THROTTLE_MS = 3_000
// Slightly longer than the throttle so a steady typist never flickers.
const TYPING_TTL_MS = 4_500
const SEND_ACK_TIMEOUT_MS = 10_000
const BASE_RECONNECT_DELAY_MS = 1_000
const MAX_RECONNECT_DELAY_MS = 30_000
const MAX_RECONNECT_ATTEMPTS = 12
// Matches ChatRoom's CLOSE_NOT_MEMBER.
const CLOSE_NOT_MEMBER = 4003

interface UseChatRoomOptions {
  /** Signed-in user; their own typing events (from other tabs) are ignored. */
  viewerId: string
  /** Errors not tied to a specific send (e.g. a failed delete). */
  onError?: (message: string) => void
  /** The room closed the socket because the user is no longer a member. */
  onForbidden?: () => void
}

/**
 * Live connection to one project's ChatRoom.
 *
 * History lives in the TanStack infinite query `chatMessagesQueryKey(projectId)`
 * (loaded by `getMessages`). This hook only merges live events into that cache,
 * so the message list has a single source of truth.
 */
export function useChatRoom(
  projectId: string | null,
  { viewerId, onError, onForbidden }: UseChatRoomOptions,
) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ChatConnectionStatus>('connecting')
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([])
  const [typingUsers, setTypingUsers] = useState<ChatUser[]>([])
  const [pending, setPending] = useState<PendingMessage[]>([])
  // Bumped by reconnect() to tear down and re-run the connection effect.
  const [connectionNonce, setConnectionNonce] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const lastTypingSentRef = useRef(0)
  const callbacksRef = useRef({ onError, onForbidden, viewerId })
  callbacksRef.current = { onError, onForbidden, viewerId }

  useEffect(() => {
    if (!projectId) return

    const key = chatMessagesQueryKey(projectId)
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()
    let disposed = false
    let attempt = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let pingTimer: ReturnType<typeof setInterval> | undefined

    const stopTyping = (userId: string) => {
      clearTimeout(typingTimers.get(userId))
      typingTimers.delete(userId)
      setTypingUsers((users) => users.filter((u) => u.id !== userId))
    }

    const startTyping = (user: ChatUser) => {
      clearTimeout(typingTimers.get(user.id))
      typingTimers.set(
        user.id,
        setTimeout(() => stopTyping(user.id), TYPING_TTL_MS),
      )
      setTypingUsers((users) =>
        users.some((u) => u.id === user.id) ? users : [...users, user],
      )
    }

    const handleEvent = (event: ServerEvent) => {
      switch (event.type) {
        case 'MESSAGE_CREATED': {
          insertMessage(queryClient, key, event.message)
          if (event.clientId) {
            const { clientId } = event
            setPending((list) => list.filter((m) => m.clientId !== clientId))
          }
          if (event.message.sender) stopTyping(event.message.sender.id)
          return
        }
        case 'MESSAGE_DELETED':
          removeMessage(queryClient, key, event.messageId)
          return
        case 'TYPING':
          if (event.user.id !== callbacksRef.current.viewerId) {
            startTyping(event.user)
          }
          return
        case 'PRESENCE_SNAPSHOT':
          setOnlineUsers(event.users)
          return
        case 'USER_ONLINE':
          setOnlineUsers((users) =>
            users.some((u) => u.id === event.user.id)
              ? users
              : [...users, event.user],
          )
          return
        case 'USER_OFFLINE':
          setOnlineUsers((users) => users.filter((u) => u.id !== event.userId))
          stopTyping(event.userId)
          return
        case 'ERROR': {
          if (event.clientId) {
            const { clientId } = event
            setPending((list) =>
              list.map((m) =>
                m.clientId === clientId
                  ? { ...m, status: 'failed', error: event.message }
                  : m,
              ),
            )
          } else {
            callbacksRef.current.onError?.(event.message)
          }
          return
        }
      }
    }

    const connect = () => {
      if (disposed) return
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting')

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/api/chat/${encodeURIComponent(projectId)}/ws`,
      )
      wsRef.current = ws

      ws.onopen = () => {
        attempt = 0
        setStatus('open')
        // Catch up on anything sent while we were connecting or disconnected.
        // Reading history never wakes the Durable Object.
        void queryClient.invalidateQueries({ queryKey: key })
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(CHAT_PING)
        }, PING_INTERVAL_MS)
      }

      ws.onmessage = (message: MessageEvent) => {
        if (typeof message.data !== 'string' || message.data === CHAT_PONG) {
          return
        }
        try {
          handleEvent(JSON.parse(message.data) as ServerEvent)
        } catch (err) {
          console.error('[chat] bad event', err)
        }
      }

      ws.onclose = (close) => {
        clearInterval(pingTimer)
        if (wsRef.current === ws) wsRef.current = null
        if (disposed) return

        setOnlineUsers([])
        for (const userId of [...typingTimers.keys()]) stopTyping(userId)
        setPending((list) =>
          list.map((m) =>
            m.status === 'sending'
              ? { ...m, status: 'failed', error: 'Connection lost' }
              : m,
          ),
        )

        if (close.code === CLOSE_NOT_MEMBER) {
          setStatus('offline')
          callbacksRef.current.onForbidden?.()
          return
        }
        if (attempt >= MAX_RECONNECT_ATTEMPTS) {
          setStatus('offline')
          return
        }
        // Exponential backoff with jitter so a server blip doesn't cause a
        // thundering herd of simultaneous reconnects.
        const delay =
          Math.min(
            MAX_RECONNECT_DELAY_MS,
            BASE_RECONNECT_DELAY_MS * 2 ** attempt,
          ) *
          (0.5 + Math.random() / 2)
        attempt += 1
        setStatus('reconnecting')
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    // Retry right away when the network comes back instead of waiting out the backoff.
    const handleOnline = () => {
      if (disposed || wsRef.current) return
      clearTimeout(reconnectTimer)
      attempt = 0
      connect()
    }

    connect()
    window.addEventListener('online', handleOnline)

    return () => {
      disposed = true
      window.removeEventListener('online', handleOnline)
      clearTimeout(reconnectTimer)
      clearInterval(pingTimer)
      for (const timer of typingTimers.values()) clearTimeout(timer)
      wsRef.current?.close(1000, 'Leaving room')
      wsRef.current = null
      setOnlineUsers([])
      setTypingUsers([])
      setPending([])
      setStatus('connecting')
    }
  }, [projectId, queryClient, connectionNonce])

  const sendEvent = useCallback((event: ClientEvent): boolean => {
    const ws = wsRef.current
    if (ws?.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(event))
    return true
  }, [])

  const dispatchPending = useCallback(
    (clientId: string, body: string) => {
      setTimeout(() => {
        setPending((list) =>
          list.map((m) =>
            m.clientId === clientId && m.status === 'sending'
              ? { ...m, status: 'failed', error: 'No response from server' }
              : m,
          ),
        )
      }, SEND_ACK_TIMEOUT_MS)

      if (!sendEvent({ type: 'SEND', body, clientId })) {
        setPending((list) =>
          list.map((m) =>
            m.clientId === clientId
              ? { ...m, status: 'failed', error: 'Not connected' }
              : m,
          ),
        )
      }
    },
    [sendEvent],
  )

  /** Sends a message; it shows as pending until the room confirms it. */
  const sendMessage = useCallback(
    (rawBody: string) => {
      const body = rawBody.trim()
      if (!body) return
      const clientId = crypto.randomUUID()
      setPending((list) => [
        ...list,
        { clientId, body, createdAt: Date.now(), status: 'sending' },
      ])
      lastTypingSentRef.current = 0
      dispatchPending(clientId, body)
    },
    [dispatchPending],
  )

  const retryMessage = useCallback(
    (clientId: string) => {
      const message = pending.find((m) => m.clientId === clientId)
      if (!message) return
      setPending((list) =>
        list.map((m) =>
          m.clientId === clientId
            ? { ...m, status: 'sending', error: undefined }
            : m,
        ),
      )
      dispatchPending(clientId, message.body)
    },
    [pending, dispatchPending],
  )

  const discardMessage = useCallback((clientId: string) => {
    setPending((list) => list.filter((m) => m.clientId !== clientId))
  }, [])

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!sendEvent({ type: 'DELETE', messageId })) {
        callbacksRef.current.onError?.('Not connected. Try again in a moment.')
      }
    },
    [sendEvent],
  )

  /** Call on every keystroke; actually sends at most once per ~3s. */
  const notifyTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return
    if (sendEvent({ type: 'TYPING' })) lastTypingSentRef.current = now
  }, [sendEvent])

  const reconnect = useCallback(() => setConnectionNonce((n) => n + 1), [])

  return {
    status,
    onlineUsers,
    typingUsers,
    pending,
    sendMessage,
    retryMessage,
    discardMessage,
    deleteMessage,
    notifyTyping,
    reconnect,
  }
}

// ─── Cache helpers ─────────────────────────────────────

function insertMessage(
  queryClient: QueryClient,
  key: ReturnType<typeof chatMessagesQueryKey>,
  message: ChatMessageDTO,
) {
  const data = queryClient.getQueryData<ChatHistoryData>(key)
  if (!data || data.pages.length === 0) {
    // History hasn't loaded yet; refetch so this message isn't lost.
    void queryClient.invalidateQueries({ queryKey: key })
    return
  }
  const exists = data.pages.some((page) =>
    page.items.some((item) => item.id === message.id),
  )
  if (exists) return

  // Pages are newest-first, so live messages go to the front of page 0.
  const [first, ...rest] = data.pages
  if (!first) return
  queryClient.setQueryData<ChatHistoryData>(key, {
    ...data,
    pages: [{ ...first, items: [message, ...first.items] }, ...rest],
  })
}

function removeMessage(
  queryClient: QueryClient,
  key: ReturnType<typeof chatMessagesQueryKey>,
  messageId: string,
) {
  queryClient.setQueryData<ChatHistoryData>(key, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== messageId),
          })),
        }
      : data,
  )
}
