import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
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

/** Full sidebar from `lg` up; icon rail on tablets (md–lg). */
const WIDE_QUERY = '(min-width: 1024px)'

export function AppLayout({ children, user }: AppLayoutProps) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY)
    const sync = () => setOpen(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      style={{ '--sidebar-width': '212px' } as CSSProperties}
    >
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
