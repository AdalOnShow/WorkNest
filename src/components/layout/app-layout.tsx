import { SidebarProvider, SidebarInset } from '#/components/ui/sidebar'
import { AppSidebar } from '#/components/layout/sidebar'
import { Header } from '#/components/layout/header'
import { MobileNav } from '#/components/layout/mobile-nav'

interface AppLayoutProps {
  children: React.ReactNode
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <Header user={user} />
      <AppSidebar user={user} />
      <SidebarInset>
        <main className="flex-1 overflow-auto pb-16 md:pb-0 pt-16">
          {children}
        </main>
      </SidebarInset>
      <MobileNav />
    </SidebarProvider>
  )
}
