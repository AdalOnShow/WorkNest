import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import { Pagination } from '#/components/ui/pagination-controls'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage,
  head: () => ({
    meta: [{ title: 'Notifications — WorkNest' }],
  }),
})

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Task assigned to you',
    description: 'Fix login bug has been assigned to you',
    read: false,
    time: '2 hours ago',
  },
  {
    id: '2',
    title: 'Task status updated',
    description: 'Add tests — Completed',
    read: true,
    time: '5 hours ago',
  },
  {
    id: '3',
    title: 'Task due soon',
    description: 'Design UI — Due tomorrow',
    read: false,
    time: '1 day ago',
  },
  {
    id: '4',
    title: 'New comment',
    description: 'John D. commented on "Fix login bug"',
    read: true,
    time: '2 days ago',
  },
]

function NotificationsPage() {
  const [page, setPage] = useState(1)
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length

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
              className="border-border text-card-foreground hover:bg-accent"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="bg-card border border-border rounded-[14px] overflow-hidden">
          {MOCK_NOTIFICATIONS.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'flex items-start gap-4 p-5 border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer',
                !notification.read &&
                  'border-l-2 border-l-primary bg-accent/20',
              )}
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
                  {notification.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.time}
                </p>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent shrink-0"
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
            totalPages={2}
            onPageChange={setPage}
          />
        </div>
      </div>
    </PageContainer>
  )
}
