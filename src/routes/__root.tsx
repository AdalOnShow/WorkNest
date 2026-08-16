import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Sprout } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'

import { Button } from '#/components/ui/button'
import { Toaster } from '#/components/ui/sonner'
import { ThemeProvider } from '../components/theme-provider'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'WorkNest',
      },
      {
        name: 'description',
        content:
          'WorkNest is a serverless team collaboration platform for projects, tasks, messages, and team operations.',
      },
      {
        property: 'og:title',
        content: 'WorkNest',
      },
      {
        property: 'og:description',
        content:
          'A serverless team collaboration workspace for managing projects, tasks, messages, and members.',
      },
      {
        property: 'og:image',
        content: '/og-image.svg',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:image',
        content: '/og-image.svg',
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  errorComponent: AppErrorBoundary,
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
})

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()
  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !event.metaKey ||
        !event.shiftKey ||
        event.key.toLowerCase() !== 'd' ||
        isEditableElement(event.target)
      ) {
        return
      }

      event.preventDefault()
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resolvedTheme, setTheme])

  return null
}

function AppErrorBoundary({ error: _error }: { error: Error }) {
  return (
    <main className="min-h-screen bg-background px-6 py-24 text-foreground">
      <div className="mx-auto max-w-xl space-y-5 text-center">
        <p className="label-sm text-primary">Something went wrong</p>
        <h1 className="headline-sm">WorkNest hit an unexpected error.</h1>
        <p className="body-md text-muted-foreground">
          Refresh the page or return to your dashboard. If this keeps happening,
          share this message with your workspace admin.
        </p>
        <p className="rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground">
          We could not complete that request. Please try again or go back to the
          dashboard.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-24 text-foreground">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/5" />
        <div className="absolute -bottom-40 -right-40 h-112 w-md rounded-full bg-primary/10" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="animate-pulse-dot absolute right-1/4 top-1/4 h-3 w-3 rounded-full bg-primary/40" />
        <div className="animate-pulse-dot animation-delay-200 absolute bottom-1/3 left-1/3 h-2 w-2 rounded-full bg-primary/60" />
        <div className="animate-pulse-dot animation-delay-400 absolute right-1/3 top-2/3 h-2 w-2 rounded-full bg-primary/40" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        {/* Brand */}
        <Link to="/" className="mb-12 inline-flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">WorkNest</span>
        </Link>

        {/* 404 */}
        <div className="relative mb-8">
          <p className="select-none bg-linear-to-b from-primary to-primary/20 bg-clip-text text-[9rem] font-black leading-none tracking-tighter text-transparent sm:text-[12rem]">
            404
          </p>
          <div className="absolute left-1/2 top-1/2 -z-10 h-28 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Page not found
        </p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
          Lost in the forest?
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back to your nest.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="w-full rounded-full px-8 sm:w-auto"
          >
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full rounded-full px-8 sm:w-auto"
          >
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" enableSystem>
          <ThemeHotkey />
          <div
            id="app-status-region"
            role="status"
            aria-live="polite"
            className="sr-only"
          />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
