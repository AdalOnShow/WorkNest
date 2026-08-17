import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq, and, sql, desc, like, count } from 'drizzle-orm'
import { createAuth } from '#/lib/auth'
import { createDb } from '#/db'
import { getCloudflareEnv } from '#/lib/request-context'
import { task, project, projectMember, user } from '#/db/schema'

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

    const conditions = [
      sql`${task.projectId} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
    ]
    if (search) {
      conditions.push(like(task.title, `%${search}%`))
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
          createdAt: task.createdAt,
        })
        .from(task)
        .leftJoin(project, eq(task.projectId, project.id))
        .leftJoin(user, eq(task.assigneeId, user.id))
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
    await requireUserId()
    const db = getDb()

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
        creatorName: user.name,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt,
      })
      .from(task)
      .leftJoin(project, eq(task.projectId, project.id))
      .leftJoin(user, eq(task.assigneeId, user.id))
      .where(eq(task.id, data.taskId))
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
    const taskId = crypto.randomUUID()
    const now = new Date()

    await db.insert(task).values({
      id: taskId,
      projectId: data.projectId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      status: 'TODO',
      priority: data.priority || 'MEDIUM',
      assigneeId: data.assigneeId || null,
      creatorId: userId,
      deadline: data.deadline ? new Date(data.deadline) : null,
      createdAt: now,
      updatedAt: now,
    })

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
    await requireUserId()
    const db = getDb()

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

    await db.update(task).set(updates).where(eq(task.id, data.taskId))

    return { success: true }
  })

export const deleteTask = createServerFn({ method: 'POST' })
  .validator((data: { taskId: string }) => data)
  .handler(async ({ data }) => {
    await requireUserId()
    const db = getDb()

    await db.delete(task).where(eq(task.id, data.taskId))
    return { success: true }
  })

export const assignTask = createServerFn({ method: 'POST' })
  .validator((data: { taskId: string; assigneeId: string | null }) => data)
  .handler(async ({ data }) => {
    await requireUserId()
    const db = getDb()

    await db
      .update(task)
      .set({ assigneeId: data.assigneeId, updatedAt: new Date() })
      .where(eq(task.id, data.taskId))

    return { success: true }
  })

export const changeTaskStatus = createServerFn({ method: 'POST' })
  .validator(
    (data: { taskId: string; status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' }) =>
      data,
  )
  .handler(async ({ data }) => {
    await requireUserId()
    const db = getDb()

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
    return { success: true }
  })

export const getTaskComments = createServerFn({ method: 'GET' })
  .validator((data: { taskId: string }) => data)
  .handler(async ({ data }) => {
    await requireUserId()
    const db = getDb()

    const { comment } = await import('#/db/schema')
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

    const { comment } = await import('#/db/schema')
    const now = new Date()

    await db.insert(comment).values({
      id: crypto.randomUUID(),
      taskId: data.taskId,
      authorId: userId,
      content: data.content.trim(),
      createdAt: now,
      updatedAt: now,
    })

    return { success: true }
  })
