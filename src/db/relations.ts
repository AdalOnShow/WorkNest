import { relations } from 'drizzle-orm'
import {
  user,
  session,
  account,
  userProfile,
  project,
  projectMember,
  task,
  comment,
  attachment,
  notification,
  activity,
} from './schema'

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
  attachments: many(attachment),
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
  attachments: many(attachment),
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

// ─── Attachments ───────────────────────────────────────

export const attachmentRelations = relations(attachment, ({ one }) => ({
  task: one(task, {
    fields: [attachment.taskId],
    references: [task.id],
  }),
  uploader: one(user, {
    fields: [attachment.uploaderId],
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
