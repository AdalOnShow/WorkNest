import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
import { LoadingState } from '#/components/ui/loading-state'
import { Pagination } from '#/components/ui/pagination-controls'
import { cn } from '#/lib/utils'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '#/server-functions/notifications'
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

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="headline-sm text-foreground">Notifications</h1>
            <p className="body-md text-muted-foreground mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notifications`
                : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="border-border text-card-foreground hover:bg-accent"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingState variant="list" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up!"
          />
        ) : (
          <>
            <div className="bg-card border border-border rounded-[14px] overflow-hidden">
              {items.map((notification) => (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'flex items-start gap-4 p-5 border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer',
                    !notification.read &&
                      'border-l-2 border-l-primary bg-accent/20',
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
                      notification.read ? 'bg-muted-foreground' : 'bg-primary',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'body-sm',
                        notification.read
                          ? 'text-card-foreground'
                          : 'text-foreground font-medium',
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timeAgo}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent shrink-0"
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
