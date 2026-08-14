import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { drizzle } from 'drizzle-orm/d1'

export function createAuth(env: { DB: D1Database }) {
  const db = drizzle(env.DB)
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite' }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [tanstackStartCookies()],
  })
}
