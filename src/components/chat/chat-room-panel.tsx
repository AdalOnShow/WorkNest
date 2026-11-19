import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  MessageSquare,
  RotateCw,
  SendHorizontal,
  Trash2,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { CHAT_MESSAGE_MAX_LENGTH } from '#/chat/events'
import type { ChatMessageDTO, ChatUser } from '#/chat/events'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { ErrorState } from '#/components/ui/error-state'
import { Skeleton } from '#/components/ui/skeleton'
import { Textarea } from '#/components/ui/textarea'
import { UserAvatar } from '#/components/ui/user-avatar'
import { chatMessagesQueryKey, useChatRoom } from '#/hooks/use-chat-room'
import type {
  ChatConnectionStatus,
  PendingMessage,
} from '#/hooks/use-chat-room'
import { cn } from '#/lib/utils'
import { getChatRoom, getMessages } from '#/server-functions/chat'

// Consecutive messages from one sender within this window share a header.
const GROUP_WINDOW_MS = 5 * 60_000
const NEAR_BOTTOM_PX = 120
const COUNTER_THRESHOLD = CHAT_MESSAGE_MAX_LENGTH - 200

interface ChatRoomPanelProps {
  projectId: string
  onBack: () => void
}

/**
 * Loads room metadata (membership check) before opening the socket. A browser
 * can't see why a WebSocket handshake failed, so access errors surface here.
 */
export function ChatRoomPanel({ projectId, onBack }: ChatRoomPanelProps) {
  const room = useQuery({
    queryKey: ['chat', projectId, 'room'],
    queryFn: () => getChatRoom({ data: { projectId } }),
    retry: false,
  })

  if (room.isLoading) return <RoomSkeleton />
  if (room.isError) {
    return (
      <div className="flex flex-1 flex-col">
        <RoomBackBar onBack={onBack} />
        <div className="flex flex-1 items-center justify-center px-4">
          <ErrorState
            title="Chat unavailable"
            message="This project doesn't exist or you're not a member."
            onRetry={() => void room.refetch()}
          />
        </div>
      </div>
    )
  }
  if (!room.data) return null

  return <ConnectedRoom room={room.data} onBack={onBack} />
}

type RoomInfo = Awaited<ReturnType<typeof getChatRoom>>

function ConnectedRoom({
  room,
  onBack,
}: {
  room: RoomInfo
  onBack: () => void
}) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ChatMessageDTO | null>(
    null,
  )

  const history = useInfiniteQuery({
    queryKey: chatMessagesQueryKey(room.projectId),
    queryFn: ({ pageParam }) =>
      getMessages({ data: { projectId: room.projectId, cursor: pageParam } }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // The socket keeps this fresh; it refetches itself after reconnecting.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  const chat = useChatRoom(room.projectId, {
    viewerId: room.viewerId,
    onError: (message) => toast.error(message),
    onForbidden: () => {
      toast.error('You no longer have access to this project chat.')
      void queryClient.invalidateQueries({
        queryKey: ['chat', room.projectId, 'room'],
      })
    },
  })

  // Pages are newest-first; render oldest-first.
  const messages = useMemo(
    () => history.data?.pages.flatMap((page) => page.items).reverse() ?? [],
    [history.data],
  )

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!draft.trim() || chat.status !== 'open') return
    chat.sendMessage(draft)
    setDraft('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds a newline; ignore Enter while an IME is composing.
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <section
      aria-label={`${room.projectName} chat`}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Back to project list"
          className=" md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-foreground">
            {room.projectName}
          </h2>
          <ConnectionStatus status={chat.status} onReconnect={chat.reconnect} />
        </div>
        <OnlineStack users={chat.onlineUsers} />
      </header>

      <div className="flex min-h-0 flex-1">
        <MessageList
          messages={messages}
          pending={chat.pending}
          viewerId={room.viewerId}
          canModerate={room.canModerate}
          isLoading={history.isLoading}
          isError={history.isError}
          onRetryHistory={() => void history.refetch()}
          hasOlder={history.hasNextPage}
          isLoadingOlder={history.isFetchingNextPage}
          onLoadOlder={() => void history.fetchNextPage()}
          onDelete={setPendingDelete}
          onRetrySend={chat.retryMessage}
          onDiscard={chat.discardMessage}
        />
        <OnlinePanel users={chat.onlineUsers} viewerId={room.viewerId} />
      </div>

      <TypingIndicator users={chat.typingUsers} />

      <form
        onSubmit={submit}
        className="flex items-end gap-2 border-t border-border px-4 py-3 md:px-6"
      >
        <div className="relative min-w-0 flex-1">
          <Textarea
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value)
              if (event.target.value.trim()) chat.notifyTyping()
            }}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            placeholder={`Message #${room.projectName}`}
            aria-label={`Message ${room.projectName}`}
            className="max-h-40 min-h-11 resize-none rounded-3xl px-4 py-2.5"
          />
          {draft.length > COUNTER_THRESHOLD && (
            <span
              className={cn(
                'absolute -top-5 right-3 text-xs tabular-nums',
                draft.length >= CHAT_MESSAGE_MAX_LENGTH
                  ? 'text-destructive'
                  : 'text-muted-foreground',
              )}
            >
              {draft.length}/{CHAT_MESSAGE_MAX_LENGTH}
            </span>
          )}
        </div>
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!draft.trim() || chat.status !== 'open'}
          className="h-11 w-11 shrink-0"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </form>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="Delete message?"
        description="This permanently removes the message for everyone in the project."
        onConfirm={() => {
          if (pendingDelete) chat.deleteMessage(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </section>
  )
}

// ─── Message list ──────────────────────────────────────

interface MessageListProps {
  messages: ChatMessageDTO[]
  pending: PendingMessage[]
  viewerId: string
  canModerate: boolean
  isLoading: boolean
  isError: boolean
  onRetryHistory: () => void
  hasOlder: boolean
  isLoadingOlder: boolean
  onLoadOlder: () => void
  onDelete: (message: ChatMessageDTO) => void
  onRetrySend: (clientId: string) => void
  onDiscard: (clientId: string) => void
}

function MessageList({
  messages,
  pending,
  viewerId,
  canModerate,
  isLoading,
  isError,
  onRetryHistory,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  onDelete,
  onRetrySend,
  onDiscard,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const snapshotRef = useRef<{
    firstId?: string
    lastKey?: string
    scrollHeight: number
  }>({ scrollHeight: 0 })

  const lastPending = pending.at(-1)
  const lastMessage = messages.at(-1)
  const lastKey = lastPending?.clientId ?? lastMessage?.id
  const lastIsMine =
    lastPending !== undefined || lastMessage?.sender?.id === viewerId

  // Keep the view anchored: jump to the bottom on first load and for new
  // messages (when already near the bottom, or when the viewer sent them), and
  // preserve position when older messages are prepended above.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const previous = snapshotRef.current
    const firstId = messages.at(0)?.id

    if (previous.lastKey === undefined && lastKey !== undefined) {
      el.scrollTop = el.scrollHeight
    } else if (firstId !== previous.firstId && lastKey === previous.lastKey) {
      el.scrollTop += el.scrollHeight - previous.scrollHeight
    } else if (
      lastKey !== previous.lastKey &&
      (nearBottomRef.current || lastIsMine)
    ) {
      el.scrollTop = el.scrollHeight
    }

    snapshotRef.current = { firstId, lastKey, scrollHeight: el.scrollHeight }
  }, [messages, lastKey, lastIsMine])

  // Infinite scroll upward: load the next older page when the top is visible.
  useEffect(() => {
    const root = scrollRef.current
    const sentinel = topSentinelRef.current
    if (!root || !sentinel || !hasOlder) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isLoadingOlder) {
          onLoadOlder()
        }
      },
      { root, rootMargin: '200px 0px 0px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasOlder, isLoadingOlder, onLoadOlder])

  const rows = useMemo(() => buildRows(messages), [messages])

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        const el = event.currentTarget
        nearBottomRef.current =
          el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
      }}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-4 md:px-6"
    >
      <div ref={topSentinelRef} aria-hidden className="h-px" />

      {isLoadingOlder && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {!hasOlder && messages.length > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          This is the beginning of the conversation.
        </p>
      )}

      {isLoading ? (
        <MessagesSkeleton />
      ) : isError ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn't load messages.
          </p>
          <Button variant="outline" size="sm" onClick={onRetryHistory}>
            Try again
          </Button>
        </div>
      ) : messages.length === 0 && pending.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <MessageSquare className="h-6 w-6 text-accent-foreground" />
          </div>
          <p className="font-semibold text-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground">
            Say hello to your team.
          </p>
        </div>
      ) : (
        <ol className="space-y-0.5">
          {rows.map((row) =>
            row.kind === 'day' ? (
              <li
                key={row.key}
                className="flex items-center gap-3 py-3"
                role="separator"
              >
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground">
                  {row.label}
                </span>
                <span className="h-px flex-1 bg-border" />
              </li>
            ) : (
              <MessageRow
                key={row.message.id}
                message={row.message}
                showHeader={row.showHeader}
                canDelete={canModerate || row.message.sender?.id === viewerId}
                onDelete={onDelete}
              />
            ),
          )}
          {pending.map((message) => (
            <PendingRow
              key={message.clientId}
              message={message}
              onRetry={onRetrySend}
              onDiscard={onDiscard}
            />
          ))}
        </ol>
      )}
    </div>
  )
}

function MessageRow({
  message,
  showHeader,
  canDelete,
  onDelete,
}: {
  message: ChatMessageDTO
  showHeader: boolean
  canDelete: boolean
  onDelete: (message: ChatMessageDTO) => void
}) {
  const name = message.sender?.name ?? 'Deleted user'
  const time = formatTime(message.createdAt)

  return (
    <li
      className={cn(
        'group relative flex gap-3 rounded-xl px-2 py-1 hover:bg-accent/40',
        showHeader && 'mt-3',
      )}
    >
      <div className="w-8 shrink-0">
        {showHeader ? (
          <UserAvatar
            name={name}
            image={message.sender?.image ?? undefined}
            size="sm"
          />
        ) : (
          <time
            dateTime={new Date(message.createdAt).toISOString()}
            className="block pt-0.5 text-right text-[10px] leading-5 text-muted-foreground opacity-0 group-hover:opacity-100"
          >
            {time}
          </time>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-sm font-bold',
                message.sender
                  ? 'text-foreground'
                  : 'italic text-muted-foreground',
              )}
            >
              {name}
            </span>
            <time
              dateTime={new Date(message.createdAt).toISOString()}
              className="text-xs text-muted-foreground"
            >
              {time}
            </time>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {message.body}
        </p>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete message from ${name}`}
          onClick={() => onDelete(message)}
          className={cn(
            'absolute right-2 top-1 h-7 w-7 bg-background text-muted-foreground shadow-none',
            'hover:bg-destructive/10 hover:text-destructive',
            // Hidden until hover/focus on pointer devices; always visible on touch.
            'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </li>
  )
}

function PendingRow({
  message,
  onRetry,
  onDiscard,
}: {
  message: PendingMessage
  onRetry: (clientId: string) => void
  onDiscard: (clientId: string) => void
}) {
  const failed = message.status === 'failed'
  return (
    <li className="flex gap-3 px-2 py-1">
      <div className="w-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'whitespace-pre-wrap break-words text-sm leading-relaxed',
            failed ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {message.body}
        </p>
        {failed ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs">
            <span className="inline-flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {message.error ?? 'Not sent'}
            </span>
            <button
              type="button"
              onClick={() => onRetry(message.clientId)}
              className="font-semibold text-foreground hover:underline"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => onDiscard(message.clientId)}
              className="text-muted-foreground hover:underline"
            >
              Discard
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sending…</span>
        )}
      </div>
    </li>
  )
}

// ─── Presence & typing ─────────────────────────────────

function ConnectionStatus({
  status,
  onReconnect,
}: {
  status: ChatConnectionStatus
  onReconnect: () => void
}) {
  if (status === 'offline') {
    return (
      <p className="flex items-center gap-2 text-xs text-destructive">
        Disconnected
        <button
          type="button"
          onClick={onReconnect}
          className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline"
        >
          <RotateCw className="h-3 w-3" /> Reconnect
        </button>
      </p>
    )
  }
  const label =
    status === 'open'
      ? 'Live'
      : status === 'connecting'
        ? 'Connecting…'
        : 'Reconnecting…'
  return (
    <p
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      role="status"
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'open'
            ? 'bg-primary'
            : 'animate-pulse bg-muted-foreground',
        )}
      />
      {label}
    </p>
  )
}

function OnlineStack({ users }: { users: ChatUser[] }) {
  if (users.length === 0) return null
  const shown = users.slice(0, 4)
  const names = users.map((u) => u.name).join(', ')
  return (
    <div
      className="flex items-center gap-2 xl:hidden"
      title={`Online: ${names}`}
    >
      <div className="flex -space-x-2">
        {shown.map((user) => (
          <UserAvatar
            key={user.id}
            name={user.name}
            image={user.image ?? undefined}
            size="sm"
            className="rounded-full ring-2 ring-background"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        <span className="sr-only">{names} </span>
        {users.length} online
      </span>
    </div>
  )
}

function OnlinePanel({
  users,
  viewerId,
}: {
  users: ChatUser[]
  viewerId: string
}) {
  return (
    <aside
      aria-label="Online now"
      className="hidden w-60 shrink-0 flex-col border-l border-border xl:flex"
    >
      <h3 className="px-5 pt-5 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Online — {users.length}
      </h3>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center gap-3 rounded-full px-2 py-1.5"
          >
            <UserAvatar
              name={user.name}
              image={user.image ?? undefined}
              size="sm"
              showOnlineStatus
              isOnline
            />
            <span className="truncate text-sm text-foreground">
              {user.name}
              {user.id === viewerId && (
                <span className="text-muted-foreground"> (you)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function TypingIndicator({ users }: { users: ChatUser[] }) {
  const text =
    users.length === 0
      ? ''
      : users.length === 1
        ? `${users[0].name} is typing…`
        : users.length === 2
          ? `${users[0].name} and ${users[1].name} are typing…`
          : 'Several people are typing…'
  return (
    <div
      aria-live="polite"
      className="h-5 truncate px-6 text-xs text-muted-foreground"
    >
      {text}
    </div>
  )
}

// ─── Loading states ────────────────────────────────────

function RoomBackBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="border-b border-border px-4 py-3 md:hidden">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Projects
      </Button>
    </div>
  )
}

function RoomSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="space-y-2 border-b border-border px-6 py-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex-1 px-6 py-4">
        <MessagesSkeleton />
      </div>
    </div>
  )
}

function MessagesSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading messages">
      {[60, 40, 75, 30].map((width, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3" style={{ width: `${width}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Formatting ────────────────────────────────────────

type Row =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; message: ChatMessageDTO; showHeader: boolean }

function buildRows(messages: ChatMessageDTO[]): Row[] {
  const rows: Row[] = []
  let previous: ChatMessageDTO | undefined
  for (const message of messages) {
    const day = new Date(message.createdAt).toDateString()
    const newDay =
      !previous || new Date(previous.createdAt).toDateString() !== day
    if (newDay) {
      rows.push({
        kind: 'day',
        key: `day-${day}`,
        label: formatDay(message.createdAt),
      })
    }
    const sameSender =
      !!previous &&
      (previous.sender?.id ?? null) === (message.sender?.id ?? null) &&
      message.createdAt - previous.createdAt < GROUP_WINDOW_MS
    rows.push({ kind: 'message', message, showHeader: newDay || !sameSender })
    previous = message
  }
  return rows
}

function formatTime(epochMs: number) {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDay(epochMs: number) {
  const date = new Date(epochMs)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  })
}
