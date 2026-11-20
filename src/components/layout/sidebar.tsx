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
  SidebarGroupLabel,
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
    <SidebarComponent
      collapsible="icon"
      className="border-r border-sidebar-border/60 bg-sidebar"
    >
      <SidebarHeader className="flex h-16 justify-center border-b border-sidebar-border/60 px-4 group-data-[collapsible=icon]:px-2">
        <Link to="/" className="flex items-center gap-2">
          <span className="chamfer flex size-7 shrink-0 items-center justify-center bg-foreground [--cut:6px]">
            <Sprout className="size-4 text-background" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            WorkNest
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-3">
          <SidebarGroupLabel className="eyebrow h-7 px-2.5">
            Workspace
          </SidebarGroupLabel>
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
                      'h-8 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
                      'data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-foreground',
                    )}
                  >
                    <Link to={item.to}>
                      <item.icon className="size-4" />
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
                className="h-8 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-foreground"
              >
                <Link to={item.to}>
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="mt-2 flex items-center gap-3 border-t border-sidebar-border/60 px-2 pt-3 pb-1 group-data-[collapsible=icon]:hidden">
          <UserAvatar
            name={user?.name ?? 'U'}
            image={user?.image ?? undefined}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
              {user?.name ?? 'Account'}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user?.email ?? ''}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </SidebarComponent>
  )
}
