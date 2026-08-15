import { createFileRoute } from '@tanstack/react-router'
import { createAuth } from '#/lib/auth'
import { getCloudflareEnv } from '#/lib/request-context'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const auth = createAuth(getCloudflareEnv())
        return auth.handler(request)
      },
      POST: ({ request }) => {
        const auth = createAuth(getCloudflareEnv())
        return auth.handler(request)
      },
    },
  },
})
