import { drizzle } from 'drizzle-orm/d1'

import * as relations from './relations'
import * as schema from './schema'

const dbSchema = {
  ...schema,
  ...relations,
}

export function createDb(database: D1Database) {
  return drizzle(database, { schema: dbSchema })
}

export type Database = ReturnType<typeof createDb>
