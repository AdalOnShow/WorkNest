import { createFileRoute } from '@tanstack/react-router'
import { createAuth } from '#/lib/auth'
import { getCloudflareEnv } from '#/lib/request-context'

export const Route = createFileRoute('/api/ws/activities')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const env = getCloudflareEnv()

        if (request.headers.get('Upgrade') !== 'websocket') {
          return new Response('Expected WebSocket upgrade', { status: 426 })
        }

        const auth = createAuth(env)
        return auth.api.getSession({ headers: request.headers }).then((session) => {
          if (!session) {
            return new Response('Unauthorized', { status: 401 })
          }

          const url = new URL(request.url)
          const projectId = url.searchParams.get('projectId')
          if (!projectId) {
            return new Response('projectId required', { status: 400 })
          }

          const stub = env.ACTIVITY_DO.idFromName(projectId)
          const doStub = env.ACTIVITY_DO.get(stub)
          return doStub.fetch(request)
        })
      },
    },
  },
})