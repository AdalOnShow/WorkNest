import { createFileRoute } from '@tanstack/react-router'
import { createAuth } from '#/lib/auth'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request, context }) => {
        const auth = createAuth(context)
        return auth.handler(request)
      },
      POST: ({ request, context }) => {
        const auth = createAuth(context)
        return auth.handler(request)
      },
    },
  },
})
