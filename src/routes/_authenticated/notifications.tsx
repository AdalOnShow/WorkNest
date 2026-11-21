import { PageContainer } from '#/components/layout/page-container'
import { PageHeader } from '#/components/layout/page-header'
import { Button } from '#/components/ui/button'
import { InvitationRow } from '#/components/ui/invitation-row'
import { EmptyState } from '#/components/ui/empty-state'
import { LoadingState } from '#/components/ui/loading-state'
import { Pagination } from '#/components/ui/pagination-controls'
import { cn } from '#/lib/utils'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '#/server-functions/notifications'
import { listMyPendingInvitations } from '#/server-functions/invitations'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Bell, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage,
  head: () => ({
    meta: [{ title: 'Notifications — WorkNest' }],
  }),
})

function NotificationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => listNotifications({ data: { page, pageSize: 20 } }),
  })

  // Same key as the bell, so both share one cache entry.
  const { data: invites = [], isLoading: invitesLoading } = useQuery({
    queryKey: ['invitations', 'mine'],
    queryFn: () => listMyPendingInvitations(),
  })

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead({ data: { notificationId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark notification as read')
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark all notifications as read')
    },
  })

  const items = data?.items || []
  const unreadCount = data?.unreadCount || 0
  const totalPages = data?.totalPages || 1
  const inviteCount = invites.length

  const summary = [
    inviteCount > 0 &&
      `${inviteCount} pending ${inviteCount === 1 ? 'invitation' : 'invitations'}`,
    unreadCount > 0 &&
      `${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}`,
  ].filter(Boolean)

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          description={
            summary.length > 0 ? summary.join(' · ') : 'All caught up'
          }
          actions={
            unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <Check className="size-4" />
                Mark all read
              </Button>
            )
          }
        />

        {inviteCount > 0 && (
          <section className="space-y-2">
            <h2 className="label-sm text-muted-foreground">
              Pending invitations
            </h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {invites.map((inv) => (
                <InvitationRow
                  key={inv.id}
                  invitation={inv}
                  className="last:border-b-0"
                />
              ))}
            </div>
          </section>
        )}

        {isLoading || invitesLoading ? (
          <LoadingState variant="list" />
        ) : items.length === 0 && inviteCount === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up"
          />
        ) : items.length === 0 ? null : (
          <>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {items.map((notification) => (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'flex items-start gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-accent/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-accent',
                    !notification.read && 'bg-accent/30',
                  )}
                  onClick={() => {
                    if (!notification.read) {
                      markReadMutation.mutate(notification.id)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      (e.key === 'Enter' || e.key === ' ') &&
                      !notification.read
                    ) {
                      e.preventDefault()
                      markReadMutation.mutate(notification.id)
                    }
                  }}
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-2 shrink-0',
                      notification.read ? 'bg-transparent' : 'bg-primary',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'body-sm',
                        notification.read
                          ? 'text-card-foreground'
                          : 'text-foreground font-semibold',
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      {notification.timeAgo}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Mark "${notification.title}" as read`}
                      className="size-8 text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        markReadMutation.mutate(notification.id)
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </PageContainer>
  )
}
