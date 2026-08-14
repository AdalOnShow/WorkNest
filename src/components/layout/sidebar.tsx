import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Bell,
  Settings,
  Sprout,
} from 'lucide-react'
import { cn } from '#/lib/utils'
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '#/components/ui/sidebar'
import { UserAvatar } from '#/components/ui/user-avatar'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

const BOTTOM_NAV_ITEMS = [
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <SidebarComponent collapsible="icon" className="bg-sidebar">
      <SidebarHeader className="p-4 h-16 flex items-center border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
            <Sprout className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
            WorkNest
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground uppercase tracking-wider text-[11px]">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to || location.pathname.startsWith(item.to + '/')}
                    className={cn(
                      'text-muted-foreground hover:text-foreground hover:bg-accent',
                      'data-[active=true]:bg-accent data-[active=true]:text-primary'
                    )}
                  >
                    <Link to={item.to}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="border-t border-sidebar-border" />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          {BOTTOM_NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.to}
                className="text-muted-foreground hover:text-foreground hover:bg-accent data-[active=true]:bg-accent data-[active=true]:text-primary"
              >
                <Link to={item.to}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="flex items-center gap-3 px-3 py-2 group-data-[collapsible=icon]:hidden">
          <UserAvatar name="John Doe" size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">john@example.com</p>
          </div>
        </div>
      </SidebarFooter>
    </SidebarComponent>
  )
}
