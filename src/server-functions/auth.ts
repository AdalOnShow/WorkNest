import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createAuth, isEmailPasswordEnabled } from '#/lib/auth'
import { getCloudflareEnv } from '#/lib/request-context'

/** Public: which sign-in methods the login page should show. */
export const getAuthConfig = createServerFn({ method: 'GET' }).handler(() => {
  const env = getCloudflareEnv()
  return {
    emailPassword: isEmailPasswordEnabled(env),
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  }
})

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const auth = createAuth(getCloudflareEnv())
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
