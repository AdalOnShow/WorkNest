import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { drizzle } from 'drizzle-orm/d1'
import * as authSchema from '../db/schema/auth'

/**
 * Creates a Better Auth instance backed by the provided D1 database.
 *
 * @param env - The environment containing the D1 database used for authentication data.
 * @returns A configured Better Auth instance with email-and-password authentication and TanStack Start cookie support.
 */
export function createAuth(env: { DB: D1Database }) {
  const db = drizzle(env.DB, { schema: authSchema })
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite', schema: authSchema }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [tanstackStartCookies()],
  })
}
