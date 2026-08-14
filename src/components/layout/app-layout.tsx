import { SidebarProvider, SidebarInset } from '#/components/ui/sidebar'
import { AppSidebar } from '#/components/layout/sidebar'
import { Header } from '#/components/layout/header'
import { MobileNav } from '#/components/layout/mobile-nav'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <Header />
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 overflow-auto pb-16 md:pb-0 pt-16">
          {children}
        </main>
      </SidebarInset>
      <MobileNav />
    </SidebarProvider>
  )
}
