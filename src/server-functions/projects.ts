import { project, projectMember, task, user } from '#/db/schema'
import { logActivity } from '#/lib/activity'
import { MANAGER_ROLES, requireProjectRole } from '#/lib/authz'
import { authMiddleware } from '#/lib/middleware'
import { escapeLikePattern } from '#/lib/sql'
import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'

export const listProjects = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(
    (data: {
      search?: string
      status?: string
      sort?: 'created' | 'deadline' | 'name' | 'updated'
      dir?: 'asc' | 'desc'
      page?: number
      pageSize?: number
    }) => data,
  )
  .handler(async ({ data, context: { db, userId } }) => {
    const search = data.search || ''
    const status = data.status || 'all'
    const page = Math.max(1, Math.floor(data.page || 1))
    const pageSize = Math.min(100, Math.max(1, Math.floor(data.pageSize || 10)))
    const escapedSearch = escapeLikePattern(search)

    const conditions = [
      sql`${project.id} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
    ]
    if (search) {
      conditions.push(
        sql`${project.name} LIKE ${`%${escapedSearch}%`} ESCAPE '\\'`,
      )
    }
    if (status && status !== 'all') {
      conditions.push(
        eq(project.status, status as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'),
      )
    }

    const where = and(...conditions)

    const asc = data.dir === 'asc'
    let orderBy
    switch (data.sort) {
      case 'deadline':
        // Projects without a deadline always sort last.
        orderBy = [
          sql`${project.deadline} IS NULL`,
          asc ? project.deadline : desc(project.deadline),
        ]
        break
      case 'name': {
        const name = sql`${project.name} COLLATE NOCASE`
        orderBy = [asc ? name : sql`${name} DESC`]
        break
      }
      case 'updated':
        orderBy = [asc ? project.updatedAt : desc(project.updatedAt)]
        break
      default:
        orderBy = [asc ? project.createdAt : desc(project.createdAt)]
    }
    // Stable pagination when sort keys tie.
    orderBy.push(desc(project.id))

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
        .orderBy(...orderBy)
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
        .where(inArray(task.projectId, projectIds))
        .groupBy(task.projectId)
    }

    const taskCountMap = new Map(
      taskCounts.map((tc) => [tc.projectId, tc.taskCount]),
    )

    const items = projectRows.map((p) => ({
      ...p,
      taskCount: taskCountMap.get(p.id) || 0,
    }))

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pageSize)

    return { items, total, totalPages, page }
  })

export const getProject = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { projectId: string }) => data)
  .handler(async ({ data, context: { db, userId } }) => {
    await requireProjectRole(db, data.projectId, userId)

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
      taskCount: taskCountResult?.count ?? 0,
    }
  })

export const createProject = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    (data: { name: string; description?: string; deadline?: number }) => data,
  )
  .handler(async ({ data, context: { db, userId } }) => {
    const trimmedName = data.name.trim()
    if (trimmedName.length === 0) {
      throw new Error('Project name cannot be empty')
    }
    const projectId = crypto.randomUUID()
    const now = new Date()

    await db.batch([
      db.insert(project).values({
        id: projectId,
        name: trimmedName,
        description: data.description?.trim() || null,
        status: 'ACTIVE',
        deadline: data.deadline ? new Date(data.deadline) : null,
        creatorId: userId,
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(projectMember).values({
        id: crypto.randomUUID(),
        projectId,
        userId,
        role: 'ADMIN',
        createdAt: now,
      }),
    ])

    await logActivity({
      db,
      actorId: userId,
      projectId,
      action: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: projectId,
      metadata: { name: trimmedName },
    })

    return { id: projectId }
  })

export const updateProject = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    (data: {
      projectId: string
      name?: string
      description?: string
      status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
      deadline?: number | null
    }) => data,
  )
  .handler(async ({ data, context: { db, userId } }) => {
    await requireProjectRole(db, data.projectId, userId, { roles: ['ADMIN'] })

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name !== undefined) updates.name = data.name.trim()
    if (data.description !== undefined)
      updates.description = data.description.trim() || null
    if (data.status !== undefined) updates.status = data.status
    if (data.deadline !== undefined)
      updates.deadline = data.deadline ? new Date(data.deadline) : null

    await db.update(project).set(updates).where(eq(project.id, data.projectId))

    await logActivity({
      db,
      actorId: userId,
      projectId: data.projectId,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: data.projectId,
      metadata: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    })

    return { success: true }
  })

export const deleteProject = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { projectId: string }) => data)
  .handler(async ({ data, context: { db, userId } }) => {
    await requireProjectRole(db, data.projectId, userId, {
      roles: ['ADMIN'],
      message: 'Only project admins can delete a project',
    })

    await db.delete(project).where(eq(project.id, data.projectId))
    return { success: true }
  })

export const addProjectMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    (data: {
      projectId: string
      userId: string
      role?: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'
    }) => data,
  )
  .handler(async ({ data, context: { db, userId: requesterId } }) => {
    const requesterRole = await requireProjectRole(
      db,
      data.projectId,
      requesterId,
      { roles: MANAGER_ROLES },
    )

    const existingMembership = await db
      .select()
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, data.projectId),
          eq(projectMember.userId, data.userId),
        ),
      )
      .limit(1)

    if (existingMembership.length > 0) {
      throw new Error('Member already exists')
    }

    const requestedRole = data.role || 'TEAM_MEMBER'
    if (requesterRole === 'PROJECT_MANAGER' && requestedRole === 'ADMIN') {
      throw new Error('Only project admins can assign ADMIN role')
    }

    const memberId = crypto.randomUUID()
    await db.insert(projectMember).values({
      id: memberId,
      projectId: data.projectId,
      userId: data.userId,
      role: requestedRole,
      createdAt: new Date(),
    })

    await logActivity({
      db,
      actorId: requesterId,
      projectId: data.projectId,
      action: 'PROJECT_MEMBER_ADDED',
      entityType: 'member',
      entityId: memberId,
      metadata: { userId: data.userId, role: requestedRole },
    })

    return { success: true }
  })

export const removeProjectMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { projectId: string; userId: string }) => data)
  .handler(async ({ data, context: { db, userId: requesterId } }) => {
    const requesterRole = await requireProjectRole(
      db,
      data.projectId,
      requesterId,
    )

    const [targetMember] = await db
      .select({ id: projectMember.id, role: projectMember.role })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, data.projectId),
          eq(projectMember.userId, data.userId),
        ),
      )
      .limit(1)

    if (!targetMember) {
      throw new Error('Member not found')
    }

    if (data.userId !== requesterId && requesterRole !== 'ADMIN') {
      throw new Error('Only project admins can remove other members')
    }

    if (targetMember.role === 'ADMIN') {
      const [adminCount] = await db
        .select({ count: count() })
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, data.projectId),
            eq(projectMember.role, 'ADMIN'),
          ),
        )
      if ((adminCount?.count || 0) <= 1) {
        throw new Error('Cannot remove the last project admin')
      }
    }

    await db
      .delete(projectMember)
      .where(
        and(
          eq(projectMember.projectId, data.projectId),
          eq(projectMember.userId, data.userId),
        ),
      )

    await logActivity({
      db,
      actorId: requesterId,
      projectId: data.projectId,
      action: 'PROJECT_MEMBER_REMOVED',
      entityType: 'member',
      entityId: targetMember.id,
      metadata: { userId: data.userId },
    })

    return { success: true }
  })

export const listProjectMembers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { projectId: string }) => data)
  .handler(async ({ data, context: { db, userId } }) => {
    const myRole = await requireProjectRole(db, data.projectId, userId)

    const items = await db
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: projectMember.role,
        joinedAt: projectMember.createdAt,
      })
      .from(projectMember)
      .innerJoin(user, eq(projectMember.userId, user.id))
      .where(eq(projectMember.projectId, data.projectId))
      .orderBy(projectMember.createdAt)

    return {
      items: items.map((m) => ({ ...m, isMe: m.userId === userId })),
      myRole,
    }
  })
