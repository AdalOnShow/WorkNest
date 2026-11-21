import { authClient } from '#/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell } from '@/components/ui/notification-bell'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Loader2, Menu, Sprout, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '#/lib/utils'
import { toast } from 'sonner'

interface NavbarProps {
  isAuthenticated?: boolean
  userName?: string
  userImage?: string
}

function AuthAwareAction({ className }: { className?: string }) {
  const { data: session, isPending } = authClient.useSession()
  const isLoggedIn = Boolean(session?.user)

  if (isPending) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    )
  }

  if (isLoggedIn) {
    return (
      <Button asChild size="sm" className={className}>
        <Link to="/dashboard">Dashboard</Link>
      </Button>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button asChild size="sm" variant="outline" className="flex-1">
        <Link to="/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" className="flex-1">
        <Link to="/login">Get started</Link>
      </Button>
    </div>
  )
}

const LANDING_LINKS = [
  { id: 'platform', label: 'Platform' },
  { id: 'features', label: 'Features' },
  { id: 'access', label: 'Roles' },
  { id: 'faq', label: 'FAQ' },
]

export function Navbar({
  isAuthenticated = false,
  userName = 'John Doe',
  userImage,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouterState()
  const navigate = useNavigate()
  const isLandingPage = router.location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (isAuthenticated) return
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isAuthenticated])

  // Landing: transparent at the top, solid once the page scrolls or the menu opens.
  const solid = isAuthenticated || scrolled || isMobileMenuOpen

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await authClient.signOut()
      if (error) {
        toast.error(error.message || 'Failed to sign out')
        return
      }
      await navigate({ to: '/' })
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : 'Failed to sign out',
      )
    }
  }

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed top-0 left-0 right-0 z-40 border-b transition-colors duration-300',
        solid
          ? 'border-border/60 bg-background/85 backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <div
        className={
          isAuthenticated
            ? 'px-4 sm:px-6 lg:px-8'
            : 'mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10'
        }
      >
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Only show on landing page */}
          {!isAuthenticated && (
            <div className="shrink-0">
              <Link to="/" className="flex items-center gap-2">
                <span className="chamfer flex size-6 items-center justify-center bg-foreground [--cut:5px]">
                  <Sprout className="size-3.5 text-background" />
                </span>
                <span className="text-[15px] font-semibold tracking-tight text-foreground">
                  WorkNest
                </span>
              </Link>
            </div>
          )}

          {/* Desktop Navigation - Landing Page Only */}
          {isLandingPage && !isAuthenticated && (
            <div className="hidden items-center gap-1 md:flex">
              {LANDING_LINKS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => scrollToSection(l.id)}
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}

          {/* Spacer - Only for authenticated pages */}
          {isAuthenticated && <div className="flex-1" />}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Open account menu"
                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                    >
                      <UserAvatar name={userName} image={userImage} size="sm" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/notifications">Notifications</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive"
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {isLandingPage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={
                      isMobileMenuOpen
                        ? 'Close navigation menu'
                        : 'Open navigation menu'
                    }
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-navigation"
                    onClick={() => setIsMobileMenuOpen((open) => !open)}
                    className="md:hidden"
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </Button>
                )}
                <div className="hidden md:flex items-center space-x-2">
                  <AuthAwareAction />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu - Landing Page Only */}
        {!isAuthenticated && (
          <div
            id="mobile-navigation"
            hidden={!isMobileMenuOpen}
            className="md:hidden py-4 space-y-4"
          >
            {LANDING_LINKS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => scrollToSection(l.id)}
                className="block w-full rounded-md px-4 py-2 text-left text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </button>
            ))}

            <div className="flex flex-col space-y-2 px-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <AuthAwareAction className="w-full" />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
