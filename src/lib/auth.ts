import { createDb } from '#/db'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
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
  if (Object.keys(socialProviders).length === 0) {
    throw new Error(
      '[auth] No supported social providers are configured. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET and/or GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET to enable sign-in.',
    )
  }

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: resolveBaseURL(env),
    database: drizzleAdapter(db, { provider: 'sqlite', schema: authSchema }),
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 2,
      },
    },
    socialProviders:
      Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
    databaseHooks: {
      user: {
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
