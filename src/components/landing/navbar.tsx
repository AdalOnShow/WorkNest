import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NotificationBell } from '@/components/ui/notification-bell'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, Sprout, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '#/lib/auth-client'

// Mock data - replace with real data from context/auth
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
      <Button variant="outline" disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    )
  }

  return (
    <Button asChild className={className}>
      <Link to={isLoggedIn ? '/dashboard' : '/login'}>
        {isLoggedIn ? 'Dashboard' : 'Login'}
      </Link>
    </Button>
  )
}

export function Navbar({
  isAuthenticated = false,
  userName = 'John Doe',
  userImage,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouterState()
  const navigate = useNavigate()
  const isLandingPage = router.location.pathname === '/'

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await authClient.signOut()
    if (error) {
      toast.error(error.message)
      return
    }
    await navigate({ to: '/' })
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div
        className={
          isAuthenticated
            ? 'px-4 sm:px-6 lg:px-8'
            : 'container mx-auto px-4 sm:px-6 lg:px-8'
        }
      >
        <div className="flex items-center justify-between h-16">
          {/* Logo - Only show on landing page */}
          {!isAuthenticated && (
            <div className="shrink-0">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
                  <Sprout className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
                  WorkNest
                </span>
              </Link>
            </div>
          )}

          {/* Desktop Navigation - Landing Page Only */}
          {isLandingPage && !isAuthenticated && (
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                How it Works
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Testimonials
              </button>
            </div>
          )}

          {/* Spacer - Only for authenticated pages */}
          {isAuthenticated && <div className="flex-1" />}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <NotificationBell
                  notifications={MOCK_NOTIFICATIONS}
                  onMarkRead={() => { }}
                  onMarkAllRead={() => { }}
                />
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
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
                      Logout
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
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="block w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Testimonials
            </button>

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
