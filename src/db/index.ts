import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'
import * as relations from './relations'

export function createDb(env: { DB: D1Database }) {
  return drizzle(env.DB, { schema: { ...schema, ...relations } })
}

export type Database = ReturnType<typeof createDb>
