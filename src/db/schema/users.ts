import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { user } from './auth'

export const userProfile = sqliteTable('user_profile', {
  id: text('id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'] })
    .notNull()
    .default('TEAM_MEMBER'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
