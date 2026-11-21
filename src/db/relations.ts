import { relations } from 'drizzle-orm'
import {
  user,
  session,
  account,
  userProfile,
  project,
  projectMember,
  task,
  taskAssignee,
  comment,
  notification,
  activity,
  chatMessage,
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
  createdTasks: many(task, { relationName: 'creator' }),
  taskAssignments: many(taskAssignee),
  comments: many(comment),
  notifications: many(notification),
  activities: many(activity),
  chatMessages: many(chatMessage),
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
  chatMessages: many(chatMessage),
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
  creator: one(user, {
    fields: [task.creatorId],
    references: [user.id],
    relationName: 'creator',
  }),
  assignees: many(taskAssignee),
  comments: many(comment),
}))

export const taskAssigneeRelations = relations(taskAssignee, ({ one }) => ({
  task: one(task, {
    fields: [taskAssignee.taskId],
    references: [task.id],
  }),
  user: one(user, {
    fields: [taskAssignee.userId],
    references: [user.id],
  }),
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

// ─── Chat ──────────────────────────────────────────────

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
  project: one(project, {
    fields: [chatMessage.projectId],
    references: [project.id],
  }),
  sender: one(user, {
    fields: [chatMessage.senderId],
    references: [user.id],
  }),
}))
