import { createDb } from '#/db'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { isOwnAvatarUrl } from '#/lib/cloudinary'
import { hashPassword, verifyPassword } from '#/lib/password'
import { LIMITS } from '#/lib/validation'
import * as authSchema from '../db/schema/auth'
import { userProfile } from '../db/schema/users'

export interface AuthEnv {
  DB?: D1Database
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  /** "true" enables email/password sign-in (no sign-up; for seeded/demo accounts). */
  ENABLE_EMAIL_PASSWORD?: string
  CLOUDINARY_CLOUD_NAME?: string
}

/** Avatar hosts the OAuth providers hand us on sign-up. */
const OAUTH_AVATAR_HOSTS = new Set([
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
])

/**
 * Better Auth's public `update-user` endpoint accepts any `image` and `name`.
 * Only allow values the app itself would set, so a stored avatar URL can
 * never point at another user's Cloudinary asset or an arbitrary host.
 */
function assertAllowedUserUpdate(
  env: AuthEnv,
  userId: string | undefined,
  data: { name?: unknown; image?: unknown },
) {
  const touchesProfile = data.name !== undefined || data.image !== undefined
  if (!touchesProfile) return
  if (!userId) throw new APIError('FORBIDDEN', { message: 'Not allowed' })
  if (data.name !== undefined) {
    const name = typeof data.name === 'string' ? data.name.trim() : ''
    if (name.length < 1 || name.length > LIMITS.name) {
      throw new APIError('BAD_REQUEST', {
        message: `Name must be between 1 and ${LIMITS.name} characters`,
      })
    }
  }
  if (data.image !== undefined && data.image !== null) {
    const image = typeof data.image === 'string' ? data.image : ''
    let host = ''
    try {
      const url = new URL(image)
      if (url.protocol === 'https:') host = url.hostname
    } catch {
      // Invalid URL, rejected below.
    }
    if (!OAUTH_AVATAR_HOSTS.has(host) && !isOwnAvatarUrl(env, image, userId)) {
      throw new APIError('BAD_REQUEST', { message: 'Invalid profile image' })
    }
  }
}

export function isEmailPasswordEnabled(env: AuthEnv) {
  return env.ENABLE_EMAIL_PASSWORD === 'true'
}

interface SocialProviderCredentials {
  clientId: string
  clientSecret: string
}

function resolveSocialProviders(
  env: AuthEnv,
): Record<string, SocialProviderCredentials> {
  const providers: Record<string, SocialProviderCredentials> = {}
  const candidates = [
    {
      name: 'google',
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    {
      name: 'github',
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  ]

  for (const { name, clientId, clientSecret } of candidates) {
    if (clientId && clientSecret) {
      providers[name] = { clientId, clientSecret }
    } else if (clientId || clientSecret) {
      console.warn(
        `[auth] ${name} sign-in is disabled: only one of ${name.toUpperCase()}_CLIENT_ID / ${name.toUpperCase()}_CLIENT_SECRET is set. Set both or neither.`,
      )
    }
  }

  return providers
}

function resolveBaseURL(env: AuthEnv) {
  if (env.BETTER_AUTH_URL) {
    return env.BETTER_AUTH_URL
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3000'
  }

  throw new Error(
    '[auth] BETTER_AUTH_URL is not set. Configure it for deployed OAuth environments.',
  )
}

export function createAuth(env: AuthEnv) {
  const dbBinding = env.DB
  if (!dbBinding) {
    throw new Error(
      '[auth] D1 binding "DB" is missing. Check the d1_databases binding in wrangler.jsonc.',
    )
  }
  if (!env.BETTER_AUTH_SECRET) {
    throw new Error(
      '[auth] BETTER_AUTH_SECRET is not set. Add it to .dev.vars (local) or run `wrangler secret put BETTER_AUTH_SECRET` (production).',
    )
  }

  const db = createDb(dbBinding)
  const socialProviders = resolveSocialProviders(env)
  const emailPassword = isEmailPasswordEnabled(env)
  if (Object.keys(socialProviders).length === 0 && !emailPassword) {
    throw new Error(
      '[auth] No sign-in method is configured. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET and/or GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET, or ENABLE_EMAIL_PASSWORD=true.',
    )
  }

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: resolveBaseURL(env),
    database: drizzleAdapter(db, { provider: 'sqlite', schema: authSchema }),
    // Workers isolates don't share memory, so counters live in D1.
    rateLimit: {
      enabled: !import.meta.env.DEV,
      storage: 'database',
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 2,
      },
    },
    socialProviders:
      Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
    // Sign-in only: accounts are created by the seed script. New users still
    // register through Google/GitHub.
    emailAndPassword: emailPassword
      ? {
          enabled: true,
          disableSignUp: true,
          password: { hash: hashPassword, verify: verifyPassword },
        }
      : undefined,
    databaseHooks: {
      user: {
        update: {
          before: async (data, ctx) => {
            // Internal updates (no request context, e.g. OAuth sign-in
            // refreshes) are trusted; requests from clients are checked.
            if (!ctx?.request) return
            assertAllowedUserUpdate(env, ctx.context.session?.user.id, data)
          },
        },
        create: {
          after: async (user) => {
            await db.insert(userProfile).values({
              id: user.id,
              role: 'TEAM_MEMBER',
              createdAt: new Date(),
            })
          },
        },
      },
    },
    plugins: [tanstackStartCookies()],
  })
}
