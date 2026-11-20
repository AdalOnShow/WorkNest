import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Bell,
  Settings,
  Sprout,
  MessageSquare,
} from 'lucide-react'
import { cn } from '#/lib/utils'
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '#/components/ui/sidebar'
import { UserAvatar } from '#/components/ui/user-avatar'

interface AppSidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

const BOTTOM_NAV_ITEMS = [
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar({ user }: AppSidebarProps) {
  const location = useLocation()

  return (
    <SidebarComponent collapsible="icon" className="bg-sidebar">
      <SidebarHeader className="p-4 h-16 flex items-center border-b border-sidebar-border group-data-[collapsible=icon]:px-1.5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-ink">
            <Sprout className="w-5 h-5 text-ink-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
            WorkNest
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={
                      location.pathname === item.to ||
                      location.pathname.startsWith(item.to + '/')
                    }
                    className={cn(
                      'h-9 font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent',
                      'data-[active=true]:bg-accent data-[active=true]:text-foreground data-[active=true]:font-semibold',
                    )}
                  >
                    <Link to={item.to}>
                      <item.icon className="size-[18px]" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          {BOTTOM_NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                asChild
                tooltip={item.label}
                isActive={location.pathname === item.to}
                className="h-9 font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent data-[active=true]:bg-accent data-[active=true]:text-foreground data-[active=true]:font-semibold"
              >
                <Link to={item.to}>
                  <item.icon className="size-[18px]" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="mt-2 flex items-center gap-3 border-t border-sidebar-border px-2 pt-4 pb-2 group-data-[collapsible=icon]:hidden">
          <UserAvatar
            name={user?.name ?? 'U'}
            image={user?.image ?? undefined}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {user?.name ?? 'Account'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email ?? ''}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </SidebarComponent>
  )
}
