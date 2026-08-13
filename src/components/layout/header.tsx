import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { NotificationBell } from '#/components/ui/notification-bell'
import { UserAvatar } from '#/components/ui/user-avatar'
import { ThemeToggle } from '#/components/ui/theme-toggle'
import { useSidebar } from '#/components/ui/sidebar'

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Task assigned to you',
    description: 'Fix login bug has been assigned to you',
    read: false,
    createdAt: '2 hours ago',
  },
  {
    id: '2',
    title: 'Task status updated',
    description: 'Add tests — Completed',
    read: true,
    createdAt: '5 hours ago',
  },
]

export function Header() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground hover:text-foreground hover:bg-accent"
        onClick={toggleSidebar}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <NotificationBell
          notifications={MOCK_NOTIFICATIONS}
          onMarkRead={() => { }}
          onMarkAllRead={() => { }}
        />
        <ThemeToggle />
        <Link to="/settings">
          <UserAvatar name="John Doe" size="sm" />
        </Link>
      </div>
    </header>
  )
}
