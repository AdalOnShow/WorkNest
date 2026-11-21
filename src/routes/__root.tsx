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
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@400..600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&display=swap',
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

function AppErrorBoundary() {
  return (
    <main className="flex min-h-screen items-center bg-background px-6 py-24 text-foreground">
      <div className="mx-auto w-full max-w-xl">
        <p className="mb-3 font-mono text-xs text-muted-foreground">
          WorkNest / Error
        </p>
        <h1 className="headline-sm">Something went wrong</h1>
        <p className="body-md mt-3 text-muted-foreground">
          We could not complete that request. Refresh the page or go back to
          your dashboard. If it keeps happening, tell your project admin.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background px-6 py-8 text-foreground">
      <Link to="/" className="inline-flex items-center gap-2.5 self-start">
        <span className="flex size-9 items-center justify-center chamfer bg-ink">
          <Sprout className="size-5 text-ink-foreground" />
        </span>
        <span className="text-lg font-semibold tracking-tight">WorkNest</span>
      </Link>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-16">
        <p className="mb-3 font-mono text-xs text-muted-foreground">
          WorkNest / 404
        </p>
        <h1 className="headline-md">Page not found</h1>
        <p className="body-md mt-3 max-w-md text-muted-foreground">
          This page does not exist or has moved.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Home</Link>
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
        <ThemeProvider defaultTheme="system">
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
