import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { user } from './auth'

export const userProfile = sqliteTable('user_profile', {
  id: text('id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  /**
   * Deprecated: always TEAM_MEMBER and read nowhere. Permissions are per
   * project (`project_member.role`). Kept to avoid a table rebuild.
   */
  role: text('role', { enum: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'] })
    .notNull()
    .default('TEAM_MEMBER'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  onboardingCompletedAt: integer('onboarding_completed_at', {
    mode: 'timestamp_ms',
  }),
})
