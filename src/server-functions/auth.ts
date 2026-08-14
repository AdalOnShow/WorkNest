import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createAuth } from '#/lib/auth'
import { getCloudflareEnv } from '#/lib/request-context'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const env = getCloudflareEnv() as { DB: D1Database }
    const auth = createAuth(env)
    return auth.api.getSession({ headers: request.headers })
  },
)

export const requireSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getSession()
    if (!session) {
      throw new Error('Unauthorized')
    }
    return session
  },
)
