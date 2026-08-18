import { createDb } from '#/db'
import { comment, project, projectMember, task, user } from '#/db/schema'
import { logActivity } from '#/lib/activity-logger'
import { createAuth } from '#/lib/auth'
import { createNotification } from '#/lib/notification-service'
import { getCloudflareEnv } from '#/lib/request-context'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'

const creator = alias(user, 'creator')

function escapeLikePattern(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_')
}

function getDb() {
  const env = getCloudflareEnv()
  return createDb(env.DB)
}

function getAuth() {
  const env = getCloudflareEnv()
  return createAuth(env)
}

async function requireUserId() {
  const request = getRequest()
  const auth = getAuth()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')
  return session.user.id
}

async function requireTaskAccess(taskId: string, userId: string) {
  const db = getDb()
  const [taskAccess] = await db
    .select({ count: count() })
    .from(task)
    .innerJoin(
      projectMember,
      and(
        eq(projectMember.projectId, task.projectId),
        eq(projectMember.userId, userId),
      ),
    )
    .where(eq(task.id, taskId))

  if (taskAccess.count === 0) {
    throw new Error('Task not found')
  }

  const [projectRow] = await db
    .select({ projectId: task.projectId })
    .from(task)
    .where(eq(task.id, taskId))
    .limit(1)

  return projectRow.projectId
}

export const listTasks = createServerFn({ method: 'GET' })
  .validator(
    (data: {
      search?: string
      status?: string
      priority?: string
      projectId?: string
      page?: number
      pageSize?: number
    }) => data,
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()
    const search = data.search || ''
    const status = data.status || 'all'
    const priority = data.priority || 'all'
    const projectId = data.projectId || ''
    const page = data.page || 1
    const pageSize = data.pageSize || 10
    const escapedSearch = escapeLikePattern(search)

    const conditions = [
      sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
    ]
    if (search) {
      conditions.push(
        sql`${task.title} LIKE ${`%${escapedSearch}%`} ESCAPE '\\'`,
      )
    }
    if (status && status !== 'all') {
      conditions.push(
        eq(task.status, status as 'TODO' | 'IN_PROGRESS' | 'COMPLETED'),
      )
    }
    if (priority && priority !== 'all') {
      conditions.push(eq(task.priority, priority as 'HIGH' | 'MEDIUM' | 'LOW'))
    }
    if (projectId) {
      conditions.push(eq(task.projectId, projectId))
    }

    const where = and(...conditions)

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
          assigneeId: task.assigneeId,
          assigneeName: user.name,
          creatorName: creator.name,
          createdAt: task.createdAt,
        })
        .from(task)
        .leftJoin(project, eq(task.projectId, project.id))
        .leftJoin(user, eq(task.assigneeId, user.id))
        .leftJoin(creator, eq(task.creatorId, creator.id))
        .where(where)
        .orderBy(desc(task.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: count() }).from(task).where(where),
    ])

    const items = taskRows.map((t) => ({
      ...t,
      assigneeShort: t.assigneeName
        ? t.assigneeName
            .split(' ')
            .map((n) => n[0])
            .join('') + '.'
        : '—',
      dueFormatted: t.deadline
        ? new Date(t.deadline).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : '—',
    }))

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pageSize)

    return { items, total, totalPages, page }
  })

export const getTask = createServerFn({ method: 'GET' })
  .validator((data: { taskId: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()
    await requireTaskAccess(data.taskId, userId)

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
        assigneeId: task.assigneeId,
        assigneeName: user.name,
        creatorId: task.creatorId,
        creatorName: creator.name,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt,
      })
      .from(task)
      .leftJoin(project, eq(task.projectId, project.id))
      .leftJoin(user, eq(task.assigneeId, user.id))
      .leftJoin(creator, eq(task.creatorId, creator.id))
      .where(
        and(
          eq(task.id, data.taskId),
          sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
        ),
      )
      .limit(1)

    if (!taskRow) {
      throw new Error('Task not found')
    }

    return {
      ...taskRow,
      dueFormatted: taskRow.deadline
        ? new Date(taskRow.deadline).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : '—',
    }
  })

export const createTask = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      projectId: string
      title: string
      description?: string
      priority?: 'HIGH' | 'MEDIUM' | 'LOW'
      assigneeId?: string
      deadline?: number
    }) => data,
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()
    const membership = await db
      .select({ id: projectMember.id })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, data.projectId),
          eq(projectMember.userId, userId),
        ),
      )
      .limit(1)

    if (membership.length === 0) {
      throw new Error('Project not found or access denied')
    }
    const trimmedTitle = data.title.trim()
    if (trimmedTitle.length === 0) {
      throw new Error('Task title cannot be empty')
    }

    if (data.assigneeId) {
      const assigneeMembership = await db
        .select({ id: projectMember.id })
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, data.projectId),
            eq(projectMember.userId, data.assigneeId),
          ),
        )
        .limit(1)

      if (assigneeMembership.length === 0) {
        throw new Error('Assignee must belong to the project')
      }
    }

    const taskId = crypto.randomUUID()
    const now = new Date()

    await db.insert(task).values({
      id: taskId,
      projectId: data.projectId,
      title: trimmedTitle,
      description: data.description?.trim() || null,
      status: 'TODO',
      priority: data.priority || 'MEDIUM',
      assigneeId: data.assigneeId || null,
      creatorId: userId,
      deadline: data.deadline ? new Date(data.deadline) : null,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity({
      db,
      actorId: userId,
      projectId: data.projectId,
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: taskId,
      metadata: { title: trimmedTitle, priority: data.priority || 'MEDIUM' },
    })

    if (data.assigneeId && data.assigneeId !== userId) {
      await createNotification({
        db,
        recipientId: data.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You were assigned to "${trimmedTitle}"`,
        referenceId: taskId,
      })
    }

    return { id: taskId }
  })

export const updateTask = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      taskId: string
      title?: string
      description?: string
      status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
      priority?: 'HIGH' | 'MEDIUM' | 'LOW'
      assigneeId?: string | null
      deadline?: number | null
    }) => data,
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()
    const projectId = await requireTaskAccess(data.taskId, userId)

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (data.title !== undefined) updates.title = data.title.trim()
    if (data.description !== undefined)
      updates.description = data.description?.trim() || null
    if (data.status !== undefined) {
      updates.status = data.status
      if (data.status === 'COMPLETED') {
        updates.completedAt = new Date()
      } else {
        updates.completedAt = null
      }
    }
    if (data.priority !== undefined) updates.priority = data.priority
    if (data.assigneeId !== undefined) updates.assigneeId = data.assigneeId
    if (data.deadline !== undefined)
      updates.deadline = data.deadline ? new Date(data.deadline) : null

    if (data.assigneeId !== undefined && data.assigneeId !== null) {
      const assigneeMembership = await db
        .select({ id: projectMember.id })
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, projectId),
            eq(projectMember.userId, data.assigneeId),
          ),
        )
        .limit(1)

      if (assigneeMembership.length === 0) {
        throw new Error('Assignee must belong to the task project')
      }
    }

    const [existingTask] = await db
      .select({
        title: task.title,
        status: task.status,
        assigneeId: task.assigneeId,
        creatorId: task.creatorId,
      })
      .from(task)
      .where(eq(task.id, data.taskId))
      .limit(1)

    await db.update(task).set(updates).where(eq(task.id, data.taskId))

    await logActivity({
      db,
      actorId: userId,
      projectId,
      action:
        data.status && data.status !== existingTask?.status
          ? 'TASK_STATUS_UPDATED'
          : 'TASK_UPDATED',
      entityType: 'task',
      entityId: data.taskId,
      metadata: {
        title: data.title || existingTask?.title,
        ...(data.status ? { status: data.status } : {}),
      },
    })

    if (
      data.assigneeId &&
      data.assigneeId !== existingTask?.assigneeId &&
      data.assigneeId !== userId
    ) {
      await createNotification({
        db,
        recipientId: data.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `You were assigned to "${data.title || existingTask?.title || 'a task'}"`,
        referenceId: data.taskId,
      })
    }

    if (data.status && existingTask && data.status !== existingTask.status) {
      const notifyUsers = new Set<string>()
      if (existingTask.assigneeId && existingTask.assigneeId !== userId) {
        notifyUsers.add(existingTask.assigneeId)
      }
      if (existingTask.creatorId && existingTask.creatorId !== userId) {
        notifyUsers.add(existingTask.creatorId)
      }

      for (const recipientId of notifyUsers) {
        await createNotification({
          db,
          recipientId,
          type: 'TASK_STATUS_UPDATED',
          title: 'Task Status Updated',
          message: `"${data.title || existingTask.title}" status changed to ${data.status.replace('_', ' ')}`,
          referenceId: data.taskId,
        })
      }
    }

    return { success: true }
  })

export const deleteTask = createServerFn({ method: 'POST' })
  .validator((data: { taskId: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()
    const projectId = await requireTaskAccess(data.taskId, userId)

    const [taskToDelete] = await db
      .select({
        title: task.title,
        creatorId: task.creatorId,
        assigneeId: task.assigneeId,
      })
      .from(task)
      .where(eq(task.id, data.taskId))
      .limit(1)

    if (!taskToDelete) {
      throw new Error('Task not found')
    }

    const isOwner =
      taskToDelete.creatorId === userId || taskToDelete.assigneeId === userId

    if (!isOwner) {
      const [membership] = await db
        .select({ role: projectMember.role })
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, projectId),
            eq(projectMember.userId, userId),
          ),
        )
        .limit(1)

      if (
        !membership ||
        !['ADMIN', 'PROJECT_MANAGER'].includes(membership.role)
      ) {
        throw new Error(
          'Only the task creator, assignee, or project admins can delete this task',
        )
      }
    }

    await db.delete(task).where(eq(task.id, data.taskId))

    await logActivity({
      db,
      actorId: userId,
      projectId,
      action: 'TASK_DELETED',
      entityType: 'task',
      entityId: data.taskId,
      metadata: { title: taskToDelete.title },
    })

    return { success: true }
  })

export const assignTask = createServerFn({ method: 'POST' })
  .validator((data: { taskId: string; assigneeId: string | null }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()

    const projectId = await requireTaskAccess(data.taskId, userId)

    const [taskRow] = await db
      .select({
        title: task.title,
        assigneeId: task.assigneeId,
      })
      .from(task)
      .where(eq(task.id, data.taskId))
      .limit(1)

    if (data.assigneeId !== null) {
      const assigneeMembership = await db
        .select({ id: projectMember.id })
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, projectId),
            eq(projectMember.userId, data.assigneeId),
          ),
        )
        .limit(1)

      if (assigneeMembership.length === 0) {
        throw new Error('Assignee must belong to the task project')
      }
    }

    await db
      .update(task)
      .set({ assigneeId: data.assigneeId, updatedAt: new Date() })
      .where(eq(task.id, data.taskId))

    await logActivity({
      db,
      actorId: userId,
      projectId,
      action: 'TASK_ASSIGNED',
      entityType: 'task',
      entityId: data.taskId,
      metadata: {
        title: taskRow?.title,
        assigneeId: data.assigneeId,
      },
    })

    if (
      data.assigneeId &&
      data.assigneeId !== taskRow?.assigneeId &&
      data.assigneeId !== userId
    ) {
      await createNotification({
        db,
        recipientId: data.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `You were assigned to "${taskRow?.title || 'a task'}"`,
        referenceId: data.taskId,
      })
    }

    return { success: true }
  })

export const changeTaskStatus = createServerFn({ method: 'POST' })
  .validator(
    (data: { taskId: string; status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' }) =>
      data,
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()
    const projectId = await requireTaskAccess(data.taskId, userId)

    const [taskRow] = await db
      .select({
        title: task.title,
        status: task.status,
        assigneeId: task.assigneeId,
        creatorId: task.creatorId,
      })
      .from(task)
      .where(eq(task.id, data.taskId))
      .limit(1)

    const updates: Record<string, unknown> = {
      status: data.status,
      updatedAt: new Date(),
    }
    if (data.status === 'COMPLETED') {
      updates.completedAt = new Date()
    } else {
      updates.completedAt = null
    }

    await db.update(task).set(updates).where(eq(task.id, data.taskId))

    if (taskRow && data.status !== taskRow.status) {
      await logActivity({
        db,
        actorId: userId,
        projectId,
        action: 'TASK_STATUS_UPDATED',
        entityType: 'task',
        entityId: data.taskId,
        metadata: {
          title: taskRow.title,
          status: data.status,
        },
      })
    }

    if (taskRow && data.status !== taskRow.status) {
      const notifyUsers = new Set<string>()
      if (taskRow.assigneeId && taskRow.assigneeId !== userId) {
        notifyUsers.add(taskRow.assigneeId)
      }
      if (taskRow.creatorId && taskRow.creatorId !== userId) {
        notifyUsers.add(taskRow.creatorId)
      }

      for (const recipientId of notifyUsers) {
        await createNotification({
          db,
          recipientId,
          type: 'TASK_STATUS_UPDATED',
          title: 'Task Status Updated',
          message: `"${taskRow.title}" status changed to ${data.status.replace('_', ' ')}`,
          referenceId: data.taskId,
        })
      }
    }

    return { success: true }
  })

export const getTaskComments = createServerFn({ method: 'GET' })
  .validator((data: { taskId: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()
    await requireTaskAccess(data.taskId, userId)
    const comments = await db
      .select({
        id: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        authorName: user.name,
        authorImage: user.image,
        createdAt: comment.createdAt,
      })
      .from(comment)
      .leftJoin(user, eq(comment.authorId, user.id))
      .where(eq(comment.taskId, data.taskId))
      .orderBy(desc(comment.createdAt))

    return comments
  })

export const addTaskComment = createServerFn({ method: 'POST' })
  .validator((data: { taskId: string; content: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()
    const projectId = await requireTaskAccess(data.taskId, userId)
    const trimmedContent = data.content.trim()
    if (trimmedContent.length === 0) {
      throw new Error('Comment content cannot be empty')
    }
    const commentId = crypto.randomUUID()
    const now = new Date()

    const [taskRow] = await db
      .select({
        title: task.title,
        assigneeId: task.assigneeId,
        creatorId: task.creatorId,
      })
      .from(task)
      .where(eq(task.id, data.taskId))
      .limit(1)

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
      projectId,
      action: 'COMMENT_ADDED',
      entityType: 'comment',
      entityId: commentId,
      metadata: {
        taskId: data.taskId,
        taskTitle: taskRow?.title,
      },
    })

    if (taskRow) {
      const notifyUsers = new Set<string>()
      if (taskRow.assigneeId && taskRow.assigneeId !== userId) {
        notifyUsers.add(taskRow.assigneeId)
      }
      if (taskRow.creatorId && taskRow.creatorId !== userId) {
        notifyUsers.add(taskRow.creatorId)
      }

      for (const recipientId of notifyUsers) {
        await createNotification({
          db,
          recipientId,
          type: 'TASK_COMMENT_ADDED',
          title: 'New Task Comment',
          message: `New comment on "${taskRow.title}"`,
          referenceId: data.taskId,
        })
      }
    }

    return { success: true }
  })
