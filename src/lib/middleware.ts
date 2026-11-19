import { createDb } from '#/db'
import { createAuth } from '#/lib/auth'
import { getCloudflareEnv } from '#/lib/request-context'
import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

// Keep this module to middleware only: the Start compiler strips `.server()`
// bodies from the client build, but not plain exported helpers, which would
// drag `cloudflare:workers` into the browser bundle.

/**
 * Resolves the Better Auth session (if any) and the per-request bindings.
 * Never throws; use `authMiddleware` when a signed-in user is required.
 */
export const sessionMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const env = getCloudflareEnv()
    const auth = createAuth(env)
    const headers = getRequest().headers
    const session = await auth.api.getSession({ headers })
    return next({
      context: { env, auth, headers, db: createDb(env.DB), session },
    })
  },
)

/**
 * Requires a signed-in user. Adds `session`, `user` and `userId` to context
 * along with `db`, `auth`, `env` and the request `headers`.
 *
 * Project-level permissions are still checked per handler with
 * `requireProjectRole` from `#/lib/authz`, since they depend on input data.
 */
export const authMiddleware = createMiddleware({ type: 'function' })
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    const { session } = context
    if (!session) throw new Error('Unauthorized')
    return next({
      context: { session, user: session.user, userId: session.user.id },
    })
  })
