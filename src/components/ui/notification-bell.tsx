import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Button } from '#/components/ui/button'
import { InvitationRow } from '#/components/ui/invitation-row'
import { cn } from '#/lib/utils'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '#/server-functions/notifications'
import { listMyPendingInvitations } from '#/server-functions/invitations'

/** No WebSocket push for notifications: poll, and refetch on window focus. */
const POLL_MS = 60_000

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: invites = [] } = useQuery({
    queryKey: ['invitations', 'mine'],
    queryFn: () => listMyPendingInvitations(),
    refetchInterval: POLL_MS,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: () => listNotifications({ data: { page: 1, pageSize: 8 } }),
    refetchInterval: POLL_MS,
  })

  const markRead = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead({ data: { notificationId } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const items = notifications?.items ?? []
  const unread = notifications?.unreadCount ?? 0
  const badgeCount = unread + invites.length

  function openNotification(n: (typeof items)[number]) {
    if (!n.read) markRead.mutate(n.id)
    setOpen(false)
    // Every notification type today is about a task.
    if (n.referenceId) {
      void navigate({ to: '/tasks/$taskId', params: { taskId: n.referenceId } })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            badgeCount > 0
              ? `Open notifications, ${badgeCount} new`
              : 'Open notifications'
          }
          className={cn(
            'relative text-muted-foreground hover:text-foreground hover:bg-accent',
            className,
          )}
        >
          <Bell className="w-5 h-5" />
          {badgeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold tabular-nums text-primary-foreground">
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(22rem,calc(100vw-2rem))] p-0 bg-popover border-border text-popover-foreground"
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-semibold">Notifications</h4>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs text-primary hover:text-primary/80 hover:bg-accent h-auto px-2 py-1"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {invites.length === 0 && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 h-32 text-muted-foreground">
              <Bell className="w-5 h-5" />
              <p className="text-sm">You’re all caught up</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Pending invitations: click to review and confirm */}
              {invites.map((inv) => (
                <InvitationRow
                  key={inv.id}
                  invitation={inv}
                  onNavigate={() => setOpen(false)}
                />
              ))}

              {items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 p-4 border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors',
                    !n.read && 'border-l-2 border-l-primary bg-accent/20',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className="min-w-0 flex-1 space-y-1 text-left"
                  >
                    <p
                      className={cn(
                        'text-sm leading-none',
                        n.read
                          ? 'text-muted-foreground'
                          : 'font-semibold text-foreground',
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground mt-1.5">
                      {n.timeAgo}
                    </p>
                  </button>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Mark ${n.title} as read`}
                      onClick={() => markRead.mutate(n.id)}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="block border-t border-border p-3 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all notifications
        </Link>
      </PopoverContent>
    </Popover>
  )
}
