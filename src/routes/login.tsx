import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { ProductMockup } from '#/components/landing/product-mockup'
import { Button } from '#/components/ui/button'
import {
  Sprout,
  Github,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import { useId, useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '#/lib/demo-accounts'
import type { DemoAccount } from '#/lib/demo-accounts'
import { cn } from '#/lib/utils'
import { getAuthConfig, getSession } from '#/server-functions/auth'

function isSafeRedirect(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.includes('\\')) return false
  try {
    const url = new URL(path, 'http://localhost')
    return url.pathname === path
  } catch {
    return false
  }
}

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const raw = (search.redirect as string) || ''
    return { redirect: isSafeRedirect(raw) ? raw : undefined }
  },
  loader: () => getAuthConfig(),
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch()
  const authConfig = Route.useLoaderData()
  const callbackURL = redirectTo ?? '/dashboard'
  const [loadingProvider, setLoadingProvider] = useState<
    'google' | 'github' | DemoAccount['id'] | null
  >(null)
  const [demoOpen, setDemoOpen] = useState(
    !(authConfig.google || authConfig.github),
  )
  const [demoError, setDemoError] = useState<string | null>(null)
  const demoPanelId = useId()
  const hasSocial = authConfig.google || authConfig.github

  const handleSocialLogin = (provider: 'google' | 'github', target: string) => {
    setLoadingProvider(provider)
    authClient.signIn.social({ provider, callbackURL: target })
  }

  const handleDemoLogin = async (account: DemoAccount) => {
    setDemoError(null)
    setLoadingProvider(account.id)
    const { error } = await authClient.signIn.email({
      email: account.email,
      password: DEMO_PASSWORD,
    })
    if (error) {
      setDemoError(
        error.status === 401
          ? 'Demo account not found. Run the seed script first.'
          : error.message || 'Sign-in failed. Please try again.',
      )
      setLoadingProvider(null)
      return
    }
    // Full navigation so the router re-runs beforeLoad with the new session.
    window.location.assign(callbackURL)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted/30 border-r border-border/60 relative overflow-hidden flex-col gap-12 p-12">
        <div>
          <Link to="/" className="flex items-center gap-2.5 mb-16">
            <div className="flex items-center justify-center w-9 h-9 chamfer bg-ink">
              <Sprout className="w-5 h-5 text-ink-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">
              WorkNest
            </span>
          </Link>

          <h1 className="text-foreground text-4xl xl:text-5xl leading-[1.08] mb-4 max-w-md">
            Your projects, tasks and team chat
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Sign in to pick up where your team left off
          </p>
        </div>
        <div className="-mr-24 mt-auto hidden 2xl:block">
          <ProductMockup />
        </div>
      </div>

      {/* Right Panel - Social Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>

          <h2 className="text-3xl text-foreground mb-2">Sign in</h2>
          <p className="text-muted-foreground mb-8">
            {hasSocial
              ? 'Choose a provider to continue'
              : 'Pick a demo account to continue'}
          </p>

          <div className="space-y-4">
            {authConfig.google && (
              <Button
                type="button"
                variant="outline"
                className="w-full bg-card hover:bg-accent h-12"
                disabled={loadingProvider !== null}
                onClick={() => handleSocialLogin('google', callbackURL)}
              >
                {loadingProvider === 'google' ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>
            )}
            {authConfig.github && (
              <Button
                type="button"
                variant="outline"
                className="w-full bg-card hover:bg-accent h-12"
                disabled={loadingProvider !== null}
                onClick={() => handleSocialLogin('github', callbackURL)}
              >
                {loadingProvider === 'github' ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Github className="w-5 h-5 mr-2" />
                )}
                Continue with GitHub
              </Button>
            )}
          </div>

          {authConfig.emailPassword && (
            <div className={cn(hasSocial && 'mt-6')}>
              {hasSocial && (
                <button
                  type="button"
                  aria-expanded={demoOpen}
                  aria-controls={demoPanelId}
                  onClick={() => setDemoOpen((open) => !open)}
                  className="flex w-full items-center gap-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="h-px flex-1 bg-border" />
                  <span className="inline-flex items-center gap-1">
                    Try a demo account
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform',
                        demoOpen && 'rotate-180',
                      )}
                    />
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </button>
              )}
              {demoOpen && (
                <div
                  id={demoPanelId}
                  className={cn('space-y-2', hasSocial && 'mt-4')}
                >
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      disabled={loadingProvider !== null}
                      onClick={() => handleDemoLogin(account)}
                      className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                    >
                      <span>
                        <span className="block text-sm font-medium text-foreground">
                          {account.roleLabel}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {account.name}
                        </span>
                      </span>
                      {loadingProvider === account.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      )}
                    </button>
                  ))}
                  {demoError && (
                    <p role="alert" className="text-sm text-destructive">
                      {demoError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
