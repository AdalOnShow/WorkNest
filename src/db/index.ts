import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'
import * as relations from './relations'

/**
 * Creates a Drizzle database instance backed by the D1 database in the environment.
 *
 * @param env - The environment containing the D1 database binding.
 * @returns A configured Drizzle database instance.
 */
export function createDb(env: { DB: D1Database }) {
  return drizzle(env.DB, { schema: { ...schema, ...relations } })
}

export type Database = ReturnType<typeof createDb>
