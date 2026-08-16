import {
  sqliteTable,
  text,
  integer,
  index,
  unique,
} from 'drizzle-orm/sqlite-core'
import { user } from './auth'

export const project = sqliteTable(
  'project',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status', { enum: ['ACTIVE', 'COMPLETED', 'ON_HOLD'] })
      .notNull()
      .default('ACTIVE'),
    deadline: integer('deadline', { mode: 'timestamp' }),
    creatorId: text('creator_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    idxCreator: index('idx_project_creator').on(table.creatorId),
  }),
)

export const projectMember = sqliteTable(
  'project_member',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    role: text('role', { enum: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'] })
      .notNull()
      .default('TEAM_MEMBER'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    uniqueProjectUser: unique('unique_project_user').on(
      table.projectId,
      table.userId,
    ),
    idxProject: index('idx_project_member_project').on(table.projectId),
    idxUser: index('idx_project_member_user').on(table.userId),
  }),
)
