import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { drizzle } from 'drizzle-orm/d1'
import * as authSchema from '../db/schema/auth'
import { userProfile } from '../db/schema/users'

interface AuthEnv {
  DB: D1Database
  BETTER_AUTH_URL?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
}

export function createAuth(env: AuthEnv) {
  const db = drizzle(env.DB, { schema: authSchema })

  const socialProviders: Record<
    string,
    { clientId: string; clientSecret: string }
  > = {}
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }
  }
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    socialProviders.github = {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }
  }

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL || 'http://localhost:3000',
    database: drizzleAdapter(db, { provider: 'sqlite', schema: authSchema }),
    emailAndPassword: {
      enabled: true,
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
