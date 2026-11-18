import { Bell, Check } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface Notification {
  id: string
  title: string
  description: string
  read: boolean
  createdAt: string
}

export interface NotificationBellProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  className?: string
}

export function NotificationBell({
  notifications,
  onMarkRead,
  onMarkAllRead,
  className,
}: NotificationBellProps) {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unreadCount > 0
              ? `Open notifications, ${unreadCount} unread`
              : 'Open notifications'
          }
          className={cn(
            'relative text-muted-foreground hover:text-foreground hover:bg-accent',
            className,
          )}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-popover border-border text-popover-foreground"
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllRead}
              className="text-xs text-primary hover:text-primary/80 hover:bg-accent h-auto px-2 py-1"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors',
                    !notification.read &&
                      'border-l-2 border-l-primary bg-accent/20',
                  )}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium leading-none',
                          !notification.read && 'text-foreground',
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {notification.createdAt}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Mark ${notification.title} as read`}
                        onClick={() => onMarkRead(notification.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
