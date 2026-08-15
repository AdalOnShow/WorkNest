import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Sprout, Github, ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'

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
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const raw = (search.redirect as string) || ''
    return { redirect: isSafeRedirect(raw) ? raw : undefined }
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  const callbackURL = redirect ?? '/dashboard'
  const [loadingProvider, setLoadingProvider] = useState<
    'google' | 'github' | null
  >(null)

  const handleSocialLogin = (
    provider: 'google' | 'github',
    callbackURL: string,
  ) => {
    setLoadingProvider(provider)
    authClient.signIn.social({ provider, callbackURL })
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-24">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
              <Sprout className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
              WorkNest
            </span>
          </Link>

          <h1 className="font-heading text-5xl font-bold text-foreground leading-tight mb-6">
            Welcome back to
            <br />
            your workspace
          </h1>
          <p className="text-xl text-muted-foreground max-w-md">
            Sign in to continue managing your projects and collaborating with
            your team.
          </p>
        </div>

        {/* Abstract geometric shapes */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/5" />
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary/10" />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 rounded-full bg-primary/40" />
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 rounded-full bg-primary/60" />
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

          <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
            Sign in
          </h2>
          <p className="text-muted-foreground mb-8">
            Choose a provider to continue
          </p>

          <div className="space-y-4">
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
          </div>
        </div>
      </div>
    </div>
  )
}
