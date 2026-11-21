# WorkNest Database Schema

Cloudflare D1 (SQLite) schema using Drizzle ORM with Better Auth integration.

---

## Overview

- **Database:** Cloudflare D1 (SQLite)
- **ORM:** Drizzle ORM (`drizzle-orm/d1`)
- **Auth:** Better Auth with Drizzle adapter
- **Provider:** `"sqlite"` for Better Auth adapter

### File Structure

```
src/
├── db/
│   ├── index.ts              # D1 client initialization
│   ├── schema/
│   │   ├── auth.ts           # Better Auth tables (generated)
│   │   ├── users.ts          # User profile extensions
│   │   ├── projects.ts       # Projects + memberships
│   │   ├── tasks.ts          # Tasks
│   │   ├── comments.ts       # Task comments
│   │   ├── notifications.ts  # User notifications
│   │   └── activities.ts     # Activity log
│   └── relations.ts          # All relation definitions
drizzle.config.ts
```

---

## Better Auth Tables

Generated via `npx @better-auth/cli@latest generate --output src/db/schema/auth.ts`.

These tables are managed by Better Auth. **Do not modify manually.**

```typescript
// src/db/schema/auth.ts (generated, do not edit)

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// ─── user ──────────────────────────────────────────────
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' })
    .notNull()
    .default(false),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

// ─── session ───────────────────────────────────────────
export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

// ─── account ───────────────────────────────────────────
export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  password: text('password'),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', {
    mode: 'timestamp',
  }),
  scope: text('scope'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

// ─── verification ──────────────────────────────────────
export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  identifier: text('identifier').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})
```

---

## Application Tables

### Users (Profile Extension)

Extends the Better Auth `user` table with application-specific fields.

```typescript
// src/db/schema/users.ts

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
```

> **Note:** Core user fields (name, email, image) live in Better Auth's `user` table. `userProfile` stores app-specific role.

---

### Projects

```typescript
// src/db/schema/projects.ts

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const project = sqliteTable('project', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', { enum: ['ACTIVE', 'COMPLETED', 'ON_HOLD'] })
    .notNull()
    .default('ACTIVE'),
  deadline: integer('deadline', { mode: 'timestamp' }),
  creatorId: text('creator_id').notNull(), // references user.id
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
```

#### Indexes

```sql
CREATE INDEX idx_project_status ON project(status);
CREATE INDEX idx_project_creator ON project(creator_id);
CREATE INDEX idx_project_deadline ON project(deadline);
```

---

### Project Members (Many-to-Many)

```typescript
// src/db/schema/projects.ts (continued)

export const projectMember = sqliteTable(
  'project_member',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull(), // references project.id
    userId: text('user_id').notNull(), // references user.id
    role: text('role', { enum: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'] })
      .notNull()
      .default('TEAM_MEMBER'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    // Unique constraint: one membership per user per project
    uniqueProjectUser: {
      uniqueOn: [table.projectId, table.userId],
    },
  }),
)
```

#### Indexes

```sql
CREATE INDEX idx_project_member_project ON project_member(project_id);
CREATE INDEX idx_project_member_user ON project_member(user_id);
```

---

### Tasks

```typescript
// src/db/schema/tasks.ts

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const task = sqliteTable(
  'task',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull(), // references project.id
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'] })
      .notNull()
      .default('TODO'),
    priority: text('priority', { enum: ['HIGH', 'MEDIUM', 'LOW'] })
      .notNull()
      .default('MEDIUM'),
    assigneeId: text('assignee_id'), // references user.id (nullable)
    creatorId: text('creator_id').notNull(), // references user.id
    deadline: integer('deadline', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
  },
  (table) => ({
    // Unique constraint: task title unique per project
    uniqueProjectTitle: {
      uniqueOn: [table.projectId, table.title],
    },
  }),
)
```

#### Indexes

```sql
CREATE INDEX idx_task_project ON task(project_id);
CREATE INDEX idx_task_assignee ON task(assignee_id);
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_priority ON task(priority);
CREATE INDEX idx_task_deadline ON task(deadline);
```

---

### Comments

```typescript
// src/db/schema/comments.ts

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const comment = sqliteTable('comment', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(), // references task.id
  authorId: text('author_id').notNull(), // references user.id
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
```

#### Indexes

```sql
CREATE INDEX idx_comment_task ON comment(task_id);
CREATE INDEX idx_comment_author ON comment(author_id);
```

---

### Notifications

```typescript
// src/db/schema/notifications.ts

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const notification = sqliteTable('notification', {
  id: text('id').primaryKey(),
  recipientId: text('recipient_id').notNull(), // references user.id
  type: text('type', {
    enum: ['TASK_ASSIGNED', 'TASK_STATUS_UPDATED', 'TASK_DUE_SOON'],
  }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  referenceId: text('reference_id'), // ID of related entity (task, etc.)
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

#### Indexes

```sql
CREATE INDEX idx_notification_recipient ON notification(recipient_id);
CREATE INDEX idx_notification_read ON notification(read);
```

---

### Activities

```typescript
// src/db/schema/activities.ts

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const activity = sqliteTable('activity', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(), // references user.id
  projectId: text('project_id').notNull(), // references project.id
  action: text('action').notNull(), // e.g., "PROJECT_CREATED", "TASK_ASSIGNED"
  entityType: text('entity_type').notNull(), // e.g., "task", "project", "member"
  entityId: text('entity_id').notNull(),
  metadata: text('metadata'), // JSON string for optional extra data
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

#### Indexes

```sql
CREATE INDEX idx_activity_project ON activity(project_id);
CREATE INDEX idx_activity_created ON activity(created_at);
```

---

## Relations

```typescript
// src/db/relations.ts

import { relations } from 'drizzle-orm'
import { user, session, account } from './schema/auth'
import { userProfile } from './schema/users'
import { project, projectMember } from './schema/projects'
import { task } from './schema/tasks'
import { comment } from './schema/comments'
import { notification } from './schema/notifications'
import { activity } from './schema/activities'

// ─── Auth relations ────────────────────────────────────

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(userProfile, {
    fields: [user.id],
    references: [userProfile.id],
  }),
  sessions: many(session),
  accounts: many(account),
  memberships: many(projectMember),
  assignedTasks: many(task, { relationName: 'assignee' }),
  createdTasks: many(task, { relationName: 'creator' }),
  comments: many(comment),
  notifications: many(notification),
  activities: many(activity),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

// ─── User Profile ──────────────────────────────────────

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, {
    fields: [userProfile.id],
    references: [user.id],
  }),
}))

// ─── Projects ──────────────────────────────────────────

export const projectRelations = relations(project, ({ one, many }) => ({
  creator: one(user, {
    fields: [project.creatorId],
    references: [user.id],
  }),
  members: many(projectMember),
  tasks: many(task),
  activities: many(activity),
}))

export const projectMemberRelations = relations(projectMember, ({ one }) => ({
  project: one(project, {
    fields: [projectMember.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectMember.userId],
    references: [user.id],
  }),
}))

// ─── Tasks ─────────────────────────────────────────────

export const taskRelations = relations(task, ({ one, many }) => ({
  project: one(project, {
    fields: [task.projectId],
    references: [project.id],
  }),
  assignee: one(user, {
    fields: [task.assigneeId],
    references: [user.id],
    relationName: 'assignee',
  }),
  creator: one(user, {
    fields: [task.creatorId],
    references: [user.id],
    relationName: 'creator',
  }),
  comments: many(comment),
}))

// ─── Comments ──────────────────────────────────────────

export const commentRelations = relations(comment, ({ one }) => ({
  task: one(task, {
    fields: [comment.taskId],
    references: [task.id],
  }),
  author: one(user, {
    fields: [comment.authorId],
    references: [user.id],
  }),
}))

// ─── Notifications ─────────────────────────────────────

export const notificationRelations = relations(notification, ({ one }) => ({
  recipient: one(user, {
    fields: [notification.recipientId],
    references: [user.id],
  }),
}))

// ─── Activities ────────────────────────────────────────

export const activityRelations = relations(activity, ({ one }) => ({
  actor: one(user, {
    fields: [activity.actorId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [activity.projectId],
    references: [project.id],
  }),
}))
```

---

## Database Client

```typescript
// src/db/index.ts

import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export function createDb(env: { DB: D1Database }) {
  return drizzle(env.DB, { schema })
}

export type Database = ReturnType<typeof createDb>
```

---

## Drizzle Config

```typescript
// drizzle.config.ts

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema/**/*',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.D1_DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
})
```

---

## Migration Commands

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply locally (dev)
pnpm drizzle-kit push

# Apply to production
pnpm drizzle-kit migrate

# Open Drizzle Studio (visual DB viewer)
pnpm drizzle-kit studio
```

---

## Schema Summary

| Table                | Purpose                                  | Key Relationships                      |
| -------------------- | ---------------------------------------- | -------------------------------------- |
| `user`               | Better Auth user (name, email, image)    | → profile, sessions, accounts          |
| `session`            | Better Auth sessions                     | → user                                 |
| `account`            | OAuth provider accounts                  | → user                                 |
| `verification`       | Email verification tokens                | → user                                 |
| `user_profile`       | App role (ADMIN, PM, MEMBER)             | → user                                 |
| `project`            | Projects                                 | → creator, members, tasks, activities  |
| `project_member`     | Project membership                       | → project, user                        |
| `task`               | Tasks                                    | → project, assignee, creator, comments |
| `comment`            | Task comments                            | → task, author                         |
| `project_invitation` | Pending email invitations to a project   | → project, invitedBy                   |
| `chat_message`       | Project chat messages (Phase 3, planned) | → project, sender                      |
| `notification`       | User notifications                       | → recipient                            |
| `activity`           | Activity log                             | → actor, project                       |

> **Attachments removed.** The `attachment` table is dropped by migration `0003_drop_attachment`. There are no file attachments; Cloudinary stores profile photos only.

---

## Current state after `0001_hardening` (authoritative)

This section is the source of truth where the sections above disagree with it.
The code in `src/db/schema/*` is authoritative over both.

### Integrity rules

| Table            | Column         | On parent delete | Notes                                                                                      |
| ---------------- | -------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `project_member` | `user_id`      | **CASCADE**      | `NOT NULL` since 0001. Was `SET NULL`, which left ghost memberships.                       |
| `project_member` | `project_id`   | CASCADE          | Unique `(project_id, user_id)`.                                                            |
| `task`           | `project_id`   | CASCADE          | Unique `(project_id, title)`.                                                              |
| `task`           | `creator_id`   | SET NULL         |                                                                                            |
| `task`           | `assignee_id`  | SET NULL         | **Deprecated, unused.** Assignees live in `task_assignee`. Not dropped, see below.         |
| `task_assignee`  | both           | CASCADE          | PK `(task_id, user_id)`.                                                                   |
| `comment`        | `task_id`      | CASCADE          | `author_id` SET NULL (comment kept, shown as deleted user).                                |
| `chat_message`   | `project_id`   | CASCADE          | `sender_id` SET NULL.                                                                      |
| `notification`   | `recipient_id` | CASCADE          | `reference_id` has no FK; `deleteTask` deletes matching notifications in the same batch.   |
| `user_profile`   | `role`         | n/a              | **Deprecated.** Always `TEAM_MEMBER`, read nowhere. Permissions are `project_member.role`. |

Enum columns (`status`, `priority`, `role`) have no SQL CHECK constraint. They
are enforced by zod in every server function (`src/lib/validation.ts`).

### Indexes that back real queries

| Index                                     | Serves                                          |
| ----------------------------------------- | ----------------------------------------------- |
| `idx_task_project_deadline`               | overdue / this-week filters, upcoming deadlines |
| `idx_task_project_status_completed`       | dashboard KPIs, completed-per-day chart         |
| `idx_task_assignee_user`                  | "my tasks", workload                            |
| `idx_notification_recipient_read_created` | bell unread count, notifications list           |
| `idx_activity_project_created`            | activity feeds                                  |
| `idx_comment_task_created`                | task comments, newest first                     |
| `idx_chat_message_project_created`        | chat history keyset pagination                  |
| `rate_limit_key_unique`                   | Better Auth rate limiter (`rate_limit` table)   |

### Migration rules (D1)

- Never edit an applied migration. `0000_version_1.sql` and `0001_hardening.sql` are applied.
- D1 keeps foreign keys enforced during migrations, and `PRAGMA foreign_keys=OFF` has no effect. Dropping a table during a drizzle "table rebuild" runs an implicit `DELETE`, which **fires ON DELETE CASCADE on child tables**. Before accepting a generated migration that rebuilds a table (`__new_<table>`), check whether any table references it. If one does, don't rebuild it. That is why `task.assignee_id` is kept: rebuilding `task` would delete every comment and assignee.
- When tightening a column to `NOT NULL`, add a hand-written cleanup `DELETE` / `UPDATE` before the copy.
