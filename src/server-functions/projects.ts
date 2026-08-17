import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq, and, sql, desc, like, count } from 'drizzle-orm'
import { createAuth } from '#/lib/auth'
import { createDb } from '#/db'
import { getCloudflareEnv } from '#/lib/request-context'
import { project, projectMember, task } from '#/db/schema'

function getDb() {
  const env = getCloudflareEnv()
  const db = createDb(env.DB)
  return { db, env }
}

function getAuth() {
  const env = getCloudflareEnv()
  return { auth: createAuth(env), env }
}

async function requireUserId() {
  const request = getRequest()
  const { auth } = getAuth()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')
  return session.user.id
}

export const listProjects = createServerFn({ method: 'GET' })
  .validator(
    (data: {
      search?: string
      status?: string
      page?: number
      pageSize?: number
    }) => data,
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { db } = getDb()
    const search = data.search || ''
    const status = data.status || 'all'
    const page = data.page || 1
    const pageSize = data.pageSize || 10

    const conditions = [
      sql`${project.id} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
    ]
    if (search) {
      conditions.push(like(project.name, `%${search}%`))
    }
    if (status && status !== 'all') {
      conditions.push(
        eq(project.status, status as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'),
      )
    }

    const where = and(...conditions)

    const [projectRows, countResult] = await Promise.all([
      db
        .select({
          id: project.id,
          name: project.name,
          status: project.status,
          deadline: project.deadline,
          createdAt: project.createdAt,
        })
        .from(project)
        .where(where)
        .orderBy(desc(project.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: count() }).from(project).where(where),
    ])

    const projectIds = projectRows.map((p) => p.id)

    let taskCounts: { projectId: string; taskCount: number }[] = []
    if (projectIds.length > 0) {
      taskCounts = await db
        .select({
          projectId: task.projectId,
          taskCount: count(),
        })
        .from(task)
        .where(sql`${task.projectId} IN ${projectIds}`)
        .groupBy(task.projectId)
    }

    const taskCountMap = new Map(
      taskCounts.map((tc) => [tc.projectId, tc.taskCount]),
    )

    const items = projectRows.map((p) => ({
      ...p,
      taskCount: taskCountMap.get(p.id) || 0,
      deadlineFormatted: p.deadline
        ? new Date(p.deadline).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : '—',
    }))

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pageSize)

    return { items, total, totalPages, page }
  })

export const getProject = createServerFn({ method: 'GET' })
  .validator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { db } = getDb()

    const membership = await db
      .select()
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

    const [projectRow] = await db
      .select()
      .from(project)
      .where(eq(project.id, data.projectId))
      .limit(1)

    if (!projectRow) {
      throw new Error('Project not found')
    }

    const [taskCountResult] = await db
      .select({ count: count() })
      .from(task)
      .where(eq(task.projectId, data.projectId))

    return {
      ...projectRow,
      taskCount: taskCountResult?.count || 0,
      deadlineFormatted: projectRow.deadline
        ? new Date(projectRow.deadline).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '—',
    }
  })

export const createProject = createServerFn({ method: 'POST' })
  .validator(
    (data: { name: string; description?: string; deadline?: number }) => data,
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { db } = getDb()
    const projectId = crypto.randomUUID()
    const now = new Date()

    await db.insert(project).values({
      id: projectId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      status: 'ACTIVE',
      deadline: data.deadline ? new Date(data.deadline) : null,
      creatorId: userId,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(projectMember).values({
      id: crypto.randomUUID(),
      projectId,
      userId,
      role: 'ADMIN',
      createdAt: now,
    })

    return { id: projectId }
  })

export const updateProject = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      projectId: string
      name?: string
      description?: string
      status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
      deadline?: number | null
    }) => data,
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { db } = getDb()

    const membership = await db
      .select()
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

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name !== undefined) updates.name = data.name.trim()
    if (data.description !== undefined)
      updates.description = data.description?.trim() || null
    if (data.status !== undefined) updates.status = data.status
    if (data.deadline !== undefined)
      updates.deadline = data.deadline ? new Date(data.deadline) : null

    await db.update(project).set(updates).where(eq(project.id, data.projectId))

    return { success: true }
  })

export const deleteProject = createServerFn({ method: 'POST' })
  .validator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { db } = getDb()

    const membership = await db
      .select()
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, data.projectId),
          eq(projectMember.userId, userId),
          eq(projectMember.role, 'ADMIN'),
        ),
      )
      .limit(1)

    if (membership.length === 0) {
      throw new Error('Only project admins can delete a project')
    }

    await db.delete(project).where(eq(project.id, data.projectId))
    return { success: true }
  })

export const addProjectMember = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      projectId: string
      userId: string
      role?: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'
    }) => data,
  )
  .handler(async ({ data }) => {
    const requesterId = await requireUserId()
    const { db } = getDb()

    const membership = await db
      .select()
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, data.projectId),
          eq(projectMember.userId, requesterId),
        ),
      )
      .limit(1)

    if (membership.length === 0) {
      throw new Error('Project not found or access denied')
    }

    await db.insert(projectMember).values({
      id: crypto.randomUUID(),
      projectId: data.projectId,
      userId: data.userId,
      role: data.role || 'TEAM_MEMBER',
      createdAt: new Date(),
    })

    return { success: true }
  })

export const removeProjectMember = createServerFn({ method: 'POST' })
  .validator((data: { projectId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const requesterId = await requireUserId()
    const { db } = getDb()

    const membership = await db
      .select()
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, data.projectId),
          eq(projectMember.userId, requesterId),
        ),
      )
      .limit(1)

    if (membership.length === 0) {
      throw new Error('Project not found or access denied')
    }

    await db
      .delete(projectMember)
      .where(
        and(
          eq(projectMember.projectId, data.projectId),
          eq(projectMember.userId, data.userId),
        ),
      )

    return { success: true }
  })
