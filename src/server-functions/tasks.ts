import type { Database } from '#/db'
import {
  comment,
  notification,
  project,
  projectMember,
  task,
  taskAssignee,
  user,
} from '#/db/schema'
import { logActivity, notifyUsers } from '#/lib/activity'
import { canManage, requireProjectRole } from '#/lib/authz'
import { authMiddleware, rateLimitMiddleware } from '#/lib/middleware'
import { escapeLikePattern } from '#/lib/sql'
import {
  commentSchema,
  deadlineSchema,
  descriptionSchema,
  idSchema,
  paginationSchema,
  searchSchema,
  sortDirSchema,
  taskPrioritySchema,
  taskStatusSchema,
  titleSchema,
  input,
} from '#/lib/validation'
import { createServerFn } from '@tanstack/react-start'
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  lt,
  lte,
  ne,
  sql,
} from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'

const creator = alias(user, 'creator')

type TaskStatus = z.infer<typeof taskStatusSchema>
type Db = Database

const assigneeIdsSchema = z.array(idSchema).max(50)

/** completedAt for a status change: set on entering COMPLETED, kept while
 * staying COMPLETED, cleared on leaving it. */
function nextCompletedAt(
  previous: TaskStatus,
  next: TaskStatus,
): Date | null | undefined {
  if (next === previous) return undefined
  return next === 'COMPLETED' ? new Date() : null
}

export interface TaskAssignee {
  id: string
  name: string
  image: string | null
}

const DAY_MS = 86_400_000
/** Newest comments shown on a task. */
const COMMENT_LIMIT = 200

/**
 * Loads the task plus the caller's project role and the task's assignees.
 * Throws "Task not found" when the task is missing or the caller is not a
 * member of its project, so existence is never leaked.
 */
async function requireTaskContext(db: Db, taskId: string, userId: string) {
  const [row] = await db
    .select({
      projectId: task.projectId,
      title: task.title,
      status: task.status,
      creatorId: task.creatorId,
      role: projectMember.role,
    })
    .from(task)
    .innerJoin(
      projectMember,
      and(
        eq(projectMember.projectId, task.projectId),
        eq(projectMember.userId, userId),
      ),
    )
    .where(eq(task.id, taskId))
    .limit(1)

  if (!row) throw new Error('Task not found')

  const assignees = await db
    .select({ userId: taskAssignee.userId })
    .from(taskAssignee)
    .where(eq(taskAssignee.taskId, taskId))
  const assigneeIds = assignees.map((a) => a.userId)

  return {
    ...row,
    assigneeIds,
    isAssignee: assigneeIds.includes(userId),
  }
}

async function loadAssignees(db: Db, taskIds: Array<string>) {
  const map = new Map<string, Array<TaskAssignee>>()
  if (taskIds.length === 0) return map
  const rows = await db
    .select({
      taskId: taskAssignee.taskId,
      id: user.id,
      name: user.name,
      image: user.image,
    })
    .from(taskAssignee)
    .innerJoin(user, eq(taskAssignee.userId, user.id))
    .where(inArray(taskAssignee.taskId, taskIds))
    .orderBy(taskAssignee.createdAt)
  for (const r of rows) {
    const list = map.get(r.taskId) ?? []
    list.push({ id: r.id, name: r.name, image: r.image })
    map.set(r.taskId, list)
  }
  return map
}

async function assertProjectMembers(
  db: Db,
  projectId: string,
  userIds: Array<string>,
) {
  if (userIds.length === 0) return
  const valid = await db
    .select({ userId: projectMember.userId })
    .from(projectMember)
    .where(
      and(
        eq(projectMember.projectId, projectId),
        inArray(projectMember.userId, userIds),
      ),
    )
  if (valid.length !== userIds.length) {
    throw new Error('All assignees must belong to the project')
  }
}

async function assertUniqueTitle(
  db: Db,
  projectId: string,
  title: string,
  excludeTaskId?: string,
) {
  const [existing] = await db
    .select({ id: task.id })
    .from(task)
    .where(and(eq(task.projectId, projectId), eq(task.title, title)))
    .limit(1)
  if (existing && existing.id !== excludeTaskId) {
    throw new Error('This task already exists in the project.')
  }
}

// The client sends local-midnight timestamps, so allow a day of slack for
// timezone differences before calling a deadline "in the past".
function assertDeadlineNotPast(deadline: number) {
  if (deadline < Date.now() - DAY_MS) {
    throw new Error('Deadline cannot be in the past')
  }
}

function formatDue(deadline: Date | null) {
  return deadline
    ? new Date(deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '—'
}

export const listTasks = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(
    input(
      z.object({
        search: searchSchema,
        status: z.union([taskStatusSchema, z.literal('all')]).optional(),
        priority: z.union([taskPrioritySchema, z.literal('all')]).optional(),
        projectId: idSchema.optional().or(z.literal('')),
        /** A user id, or "me" for the caller. */
        assigneeId: idSchema.optional().or(z.literal('')),
        deadline: z.enum(['all', 'overdue', 'week', 'none']).optional(),
        sort: z.enum(['created', 'deadline', 'priority', 'updated']).optional(),
        dir: sortDirSchema.optional(),
        ...paginationSchema(10),
      }),
    ),
  )
  .handler(async ({ data, context: { db, userId } }) => {
    const search = data.search || ''
    const status = data.status || 'all'
    const priority = data.priority || 'all'
    const projectId = data.projectId || ''
    const { page, pageSize } = data
    const escapedSearch = escapeLikePattern(search)

    const conditions = [
      sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
    ]
    if (search) {
      const pattern = `%${escapedSearch}%`
      conditions.push(
        sql`(${task.title} LIKE ${pattern} ESCAPE '\\' OR ${task.description} LIKE ${pattern} ESCAPE '\\')`,
      )
    }
    if (status !== 'all') {
      conditions.push(eq(task.status, status))
    }
    if (priority !== 'all') {
      conditions.push(eq(task.priority, priority))
    }
    if (projectId) {
      conditions.push(eq(task.projectId, projectId))
    }
    if (data.assigneeId) {
      const target = data.assigneeId === 'me' ? userId : data.assigneeId
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${taskAssignee} WHERE ${taskAssignee.taskId} = ${task.id} AND ${taskAssignee.userId} = ${target})`,
      )
    }
    const now = new Date()
    if (data.deadline === 'overdue') {
      conditions.push(lt(task.deadline, now), ne(task.status, 'COMPLETED'))
    } else if (data.deadline === 'week') {
      conditions.push(
        gte(task.deadline, now),
        lte(task.deadline, new Date(now.getTime() + 7 * DAY_MS)),
      )
    } else if (data.deadline === 'none') {
      conditions.push(sql`${task.deadline} IS NULL`)
    }

    const where = and(...conditions)

    const asc = data.dir === 'asc'
    let orderBy
    switch (data.sort) {
      case 'deadline':
        // Tasks without a deadline always sort last.
        orderBy = [
          sql`${task.deadline} IS NULL`,
          asc ? task.deadline : desc(task.deadline),
        ]
        break
      case 'priority': {
        const rank = sql`CASE ${task.priority} WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END`
        orderBy = [asc ? sql`${rank} DESC` : rank, desc(task.createdAt)]
        break
      }
      case 'updated':
        orderBy = [asc ? task.updatedAt : desc(task.updatedAt)]
        break
      default:
        orderBy = [asc ? task.createdAt : desc(task.createdAt)]
    }

    const [taskRows, countResult] = await Promise.all([
      db
        .select({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline,
          projectId: task.projectId,
          projectName: project.name,
          creatorName: creator.name,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        })
        .from(task)
        .leftJoin(project, eq(task.projectId, project.id))
        .leftJoin(creator, eq(task.creatorId, creator.id))
        .where(where)
        .orderBy(...orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: count() }).from(task).where(where),
    ])

    const [assigneeMap, roleRows] = await Promise.all([
      loadAssignees(
        db,
        taskRows.map((t) => t.id),
      ),
      db
        .select({
          projectId: projectMember.projectId,
          role: projectMember.role,
        })
        .from(projectMember)
        .where(eq(projectMember.userId, userId)),
    ])
    const roleByProject = new Map(roleRows.map((r) => [r.projectId, r.role]))

    const items = taskRows.map((t) => {
      const assignees = assigneeMap.get(t.id) ?? []
      return {
        ...t,
        assignees,
        isAssignee: assignees.some((a) => a.id === userId),
        myRole: roleByProject.get(t.projectId) ?? 'TEAM_MEMBER',
        dueFormatted: formatDue(t.deadline),
      }
    })

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pageSize)

    return { items, total, totalPages, page }
  })

export const getTask = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(input(z.object({ taskId: idSchema })))
  .handler(async ({ data, context: { db, userId } }) => {
    const ctx = await requireTaskContext(db, data.taskId, userId)

    const [taskRow] = await db
      .select({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        projectId: task.projectId,
        projectName: project.name,
        creatorId: task.creatorId,
        creatorName: creator.name,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt,
      })
      .from(task)
      .leftJoin(project, eq(task.projectId, project.id))
      .leftJoin(creator, eq(task.creatorId, creator.id))
      .where(eq(task.id, data.taskId))
      .limit(1)

    if (!taskRow) {
      throw new Error('Task not found')
    }

    const assignees = (await loadAssignees(db, [data.taskId])).get(data.taskId)

    return {
      ...taskRow,
      assignees: assignees ?? [],
      myRole: ctx.role,
      isAssignee: ctx.isAssignee,
      canManage: canManage(ctx.role),
      dueFormatted: formatDue(taskRow.deadline),
    }
  })

export const createTask = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator(
    input(
      z.object({
        projectId: idSchema,
        title: titleSchema,
        description: descriptionSchema.optional(),
        status: taskStatusSchema.optional(),
        priority: taskPrioritySchema.optional(),
        assigneeIds: assigneeIdsSchema.optional(),
        deadline: deadlineSchema.optional(),
      }),
    ),
  )
  .handler(async ({ data, context: { db, userId } }) => {
    const role = await requireProjectRole(db, data.projectId, userId)
    if (!canManage(role)) {
      throw new Error('Only admins and project managers can create tasks')
    }
    const trimmedTitle = data.title
    if (data.deadline) assertDeadlineNotPast(data.deadline)

    const assigneeIds = [...new Set(data.assigneeIds ?? [])]
    await assertProjectMembers(db, data.projectId, assigneeIds)
    await assertUniqueTitle(db, data.projectId, trimmedTitle)

    const taskId = crypto.randomUUID()
    const now = new Date()
    const status = data.status ?? 'TODO'

    const insertTask = db.insert(task).values({
      id: taskId,
      projectId: data.projectId,
      title: trimmedTitle,
      description: data.description?.trim() || null,
      status,
      priority: data.priority || 'MEDIUM',
      creatorId: userId,
      deadline: data.deadline ? new Date(data.deadline) : null,
      createdAt: now,
      updatedAt: now,
      completedAt: status === 'COMPLETED' ? now : null,
    })

    // One batch = one transaction: no task without its assignees.
    if (assigneeIds.length > 0) {
      await db.batch([
        insertTask,
        db
          .insert(taskAssignee)
          .values(
            assigneeIds.map((id) => ({ taskId, userId: id, createdAt: now })),
          ),
      ])
    } else {
      await insertTask
    }

    await logActivity({
      db,
      actorId: userId,
      projectId: data.projectId,
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: taskId,
      metadata: { title: trimmedTitle, priority: data.priority || 'MEDIUM' },
    })

    await notifyUsers({
      db,
      actorId: userId,
      recipientIds: assigneeIds,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You were assigned to "${trimmedTitle}"`,
      referenceId: taskId,
    })

    return { id: taskId }
  })

export const updateTask = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator(
    input(
      z.object({
        taskId: idSchema,
        title: titleSchema.optional(),
        description: descriptionSchema.optional(),
        status: taskStatusSchema.optional(),
        priority: taskPrioritySchema.optional(),
        assigneeIds: assigneeIdsSchema.optional(),
        deadline: deadlineSchema.nullable().optional(),
      }),
    ),
  )
  .handler(async ({ data, context: { db, userId } }) => {
    const ctx = await requireTaskContext(db, data.taskId, userId)
    if (!canManage(ctx.role)) {
      throw new Error('Only admins and project managers can edit tasks')
    }
    const { projectId } = ctx

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    let title = ctx.title
    if (data.title !== undefined) {
      title = data.title
      if (title !== ctx.title) {
        await assertUniqueTitle(db, projectId, title, data.taskId)
      }
      updates.title = title
    }
    if (data.description !== undefined) {
      updates.description = data.description.trim() || null
    }
    if (data.status !== undefined) {
      updates.status = data.status
      const completedAt = nextCompletedAt(ctx.status, data.status)
      if (completedAt !== undefined) updates.completedAt = completedAt
    }
    if (data.priority !== undefined) updates.priority = data.priority
    if (data.deadline !== undefined) {
      updates.deadline = data.deadline ? new Date(data.deadline) : null
    }

    let added: Array<string> = []
    let removed: Array<string> = []
    if (data.assigneeIds !== undefined) {
      const next = [...new Set(data.assigneeIds)]
      added = next.filter((id) => !ctx.assigneeIds.includes(id))
      removed = ctx.assigneeIds.filter((id) => !next.includes(id))
      if (added.length > 0 || removed.length > 0) {
        const resultingStatus = data.status ?? ctx.status
        if (resultingStatus === 'COMPLETED') {
          throw new Error('Completed tasks cannot be reassigned.')
        }
        await assertProjectMembers(db, projectId, added)
      }
    }

    // One batch = one transaction, so a failed assignee write can't leave
    // the task half-updated.
    const now = new Date()
    await db.batch([
      db.update(task).set(updates).where(eq(task.id, data.taskId)),
      ...(removed.length > 0
        ? [
            db
              .delete(taskAssignee)
              .where(
                and(
                  eq(taskAssignee.taskId, data.taskId),
                  inArray(taskAssignee.userId, removed),
                ),
              ),
          ]
        : []),
      ...(added.length > 0
        ? [
            db.insert(taskAssignee).values(
              added.map((id) => ({
                taskId: data.taskId,
                userId: id,
                createdAt: now,
              })),
            ),
          ]
        : []),
    ])

    const statusChanged = data.status && data.status !== ctx.status
    await logActivity({
      db,
      actorId: userId,
      projectId,
      action: statusChanged ? 'TASK_STATUS_UPDATED' : 'TASK_UPDATED',
      entityType: 'task',
      entityId: data.taskId,
      metadata: {
        title,
        ...(data.status ? { status: data.status } : {}),
      },
    })

    if (added.length > 0) {
      await notifyUsers({
        db,
        actorId: userId,
        recipientIds: added,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `You were assigned to "${title}"`,
        referenceId: data.taskId,
      })
    }

    if (statusChanged && data.status) {
      await notifyUsers({
        db,
        actorId: userId,
        recipientIds: [...ctx.assigneeIds, ctx.creatorId],
        type: 'TASK_STATUS_UPDATED',
        title: 'Task Status Updated',
        message: `"${title}" status changed to ${data.status.replace('_', ' ')}`,
        referenceId: data.taskId,
      })
    }

    return { success: true }
  })

export const deleteTask = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator(input(z.object({ taskId: idSchema })))
  .handler(async ({ data, context: { db, userId } }) => {
    const ctx = await requireTaskContext(db, data.taskId, userId)
    if (!canManage(ctx.role)) {
      throw new Error('Only admins and project managers can delete tasks')
    }

    await db.batch([
      db.delete(task).where(eq(task.id, data.taskId)),
      // Notifications point at the task by reference_id (no FK); drop them
      // so nobody is left with a link to a missing task.
      db.delete(notification).where(eq(notification.referenceId, data.taskId)),
    ])

    await logActivity({
      db,
      actorId: userId,
      projectId: ctx.projectId,
      action: 'TASK_DELETED',
      entityType: 'task',
      entityId: data.taskId,
      metadata: { title: ctx.title },
    })

    return { success: true }
  })

export const changeTaskStatus = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator(input(z.object({ taskId: idSchema, status: taskStatusSchema })))
  .handler(async ({ data, context: { db, userId } }) => {
    const ctx = await requireTaskContext(db, data.taskId, userId)
    if (!canManage(ctx.role) && !ctx.isAssignee) {
      throw new Error(
        'Only assignees, admins and project managers can change status',
      )
    }

    const completedAt = nextCompletedAt(ctx.status, data.status)
    await db
      .update(task)
      .set({
        status: data.status,
        updatedAt: new Date(),
        ...(completedAt !== undefined ? { completedAt } : {}),
      })
      .where(eq(task.id, data.taskId))

    if (data.status !== ctx.status) {
      await logActivity({
        db,
        actorId: userId,
        projectId: ctx.projectId,
        action: 'TASK_STATUS_UPDATED',
        entityType: 'task',
        entityId: data.taskId,
        metadata: { title: ctx.title, status: data.status },
      })

      await notifyUsers({
        db,
        actorId: userId,
        recipientIds: [...ctx.assigneeIds, ctx.creatorId],
        type: 'TASK_STATUS_UPDATED',
        title: 'Task Status Updated',
        message: `"${ctx.title}" status changed to ${data.status.replace('_', ' ')}`,
        referenceId: data.taskId,
      })
    }

    return { success: true }
  })

export const getTaskComments = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(input(z.object({ taskId: idSchema })))
  .handler(async ({ data, context: { db, userId } }) => {
    const ctx = await requireTaskContext(db, data.taskId, userId)
    const comments = await db
      .select({
        id: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        authorName: user.name,
        authorImage: user.image,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })
      .from(comment)
      .leftJoin(user, eq(comment.authorId, user.id))
      .where(eq(comment.taskId, data.taskId))
      .orderBy(desc(comment.createdAt))
      .limit(COMMENT_LIMIT)

    return comments.map((c) => {
      const isAuthor = c.authorId === userId
      return {
        ...c,
        edited: c.updatedAt.getTime() > c.createdAt.getTime(),
        canEdit: isAuthor,
        canDelete: isAuthor || canManage(ctx.role),
      }
    })
  })

/**
 * Loads a comment with its task context. Throws "Comment not found" when the
 * comment is missing or the caller can't see its task.
 */
async function requireCommentContext(
  db: Db,
  commentId: string,
  userId: string,
) {
  const [row] = await db
    .select({ taskId: comment.taskId, authorId: comment.authorId })
    .from(comment)
    .where(eq(comment.id, commentId))
    .limit(1)
  if (!row) throw new Error('Comment not found')
  const ctx = await requireTaskContext(db, row.taskId, userId).catch(() => {
    throw new Error('Comment not found')
  })
  return { ...ctx, taskId: row.taskId, authorId: row.authorId }
}

export const updateTaskComment = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator(input(z.object({ commentId: idSchema, content: commentSchema })))
  .handler(async ({ data, context: { db, userId } }) => {
    const ctx = await requireCommentContext(db, data.commentId, userId)
    if (ctx.authorId !== userId) {
      throw new Error('You can only edit your own comments')
    }
    const trimmedContent = data.content

    await db
      .update(comment)
      .set({ content: trimmedContent, updatedAt: new Date() })
      .where(eq(comment.id, data.commentId))

    await logActivity({
      db,
      actorId: userId,
      projectId: ctx.projectId,
      action: 'COMMENT_UPDATED',
      entityType: 'comment',
      entityId: data.commentId,
      metadata: { taskId: ctx.taskId, taskTitle: ctx.title },
    })

    return { success: true }
  })

export const deleteTaskComment = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator(input(z.object({ commentId: idSchema })))
  .handler(async ({ data, context: { db, userId } }) => {
    const ctx = await requireCommentContext(db, data.commentId, userId)
    if (ctx.authorId !== userId && !canManage(ctx.role)) {
      throw new Error(
        'Only the author, admins and project managers can delete comments',
      )
    }

    await db.delete(comment).where(eq(comment.id, data.commentId))

    await logActivity({
      db,
      actorId: userId,
      projectId: ctx.projectId,
      action: 'COMMENT_DELETED',
      entityType: 'comment',
      entityId: data.commentId,
      metadata: { taskId: ctx.taskId, taskTitle: ctx.title },
    })

    return { success: true }
  })

export const addTaskComment = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator(input(z.object({ taskId: idSchema, content: commentSchema })))
  .handler(async ({ data, context: { db, userId } }) => {
    const ctx = await requireTaskContext(db, data.taskId, userId)
    const trimmedContent = data.content
    const commentId = crypto.randomUUID()
    const now = new Date()

    await db.insert(comment).values({
      id: commentId,
      taskId: data.taskId,
      authorId: userId,
      content: trimmedContent,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity({
      db,
      actorId: userId,
      projectId: ctx.projectId,
      action: 'COMMENT_ADDED',
      entityType: 'comment',
      entityId: commentId,
      metadata: { taskId: data.taskId, taskTitle: ctx.title },
    })

    await notifyUsers({
      db,
      actorId: userId,
      recipientIds: [...ctx.assigneeIds, ctx.creatorId],
      type: 'TASK_COMMENT_ADDED',
      title: 'New Task Comment',
      message: `New comment on "${ctx.title}"`,
      referenceId: data.taskId,
    })

    return { success: true }
  })
