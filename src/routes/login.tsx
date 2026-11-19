import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Sprout, Github, ArrowLeft, Loader2 } from 'lucide-react'
import { useId, useState } from 'react'
import { authClient } from '#/lib/auth-client'
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
    'google' | 'github' | 'email' | null
  >(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()
  const hasSocial = authConfig.google || authConfig.github

  const handleSocialLogin = (provider: 'google' | 'github', target: string) => {
    setLoadingProvider(provider)
    authClient.signIn.social({ provider, callbackURL: target })
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setLoadingProvider('email')
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    })
    if (error) {
      setEmailError(
        error.status === 401
          ? 'Invalid email or password'
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
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-24">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-ink">
              <Sprout className="w-5 h-5 text-ink-foreground" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
              WorkNest
            </span>
          </Link>

          <h1 className="font-headline text-foreground text-5xl font-bold leading-tight mb-6">
            Welcome back to
            <br />
            your workspace
          </h1>
          <p className="text-xl text-muted-foreground max-w-md">
            Sign in to continue managing your projects and collaborating with
            your team.
          </p>
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

          <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
            Sign in
          </h2>
          <p className="text-muted-foreground mb-8">
            {hasSocial
              ? 'Choose a provider to continue'
              : 'Sign in with your email to continue'}
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
            <>
              {hasSocial && (
                <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or sign in with email
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <form
                className="space-y-4"
                onSubmit={handleEmailLogin}
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor={emailId}>Email</Label>
                  <Input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? errorId : undefined}
                    className="h-11 bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={passwordId}>Password</Label>
                  <Input
                    id={passwordId}
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? errorId : undefined}
                    className="h-11 bg-card"
                  />
                </div>
                {emailError && (
                  <p
                    id={errorId}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {emailError}
                  </p>
                )}
                <Button
                  type="submit"
                  className="h-11 w-full font-semibold"
                  disabled={
                    loadingProvider !== null || !email.trim() || !password
                  }
                >
                  {loadingProvider === 'email' && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Sign in
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
