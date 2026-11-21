import { closeChatRoom, disconnectChatUser } from '#/chat/room-control'
import { notification, project, projectMember, task, user } from '#/db/schema'
import { logActivity } from '#/lib/activity'
import { requireProjectRole } from '#/lib/authz'
import { authMiddleware, rateLimitMiddleware } from '#/lib/middleware'
import { escapeLikePattern } from '#/lib/sql'
import {
  deadlineSchema,
  descriptionSchema,
  idSchema,
  paginationSchema,
  projectStatusSchema,
  searchSchema,
  sortDirSchema,
  titleSchema,
  input,
} from '#/lib/validation'
import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'

const projectNameSchema = titleSchema

export const listProjects = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(
    input(
      z.object({
        search: searchSchema,
        status: z.union([projectStatusSchema, z.literal('all')]).optional(),
        sort: z.enum(['created', 'deadline', 'name', 'updated']).optional(),
        dir: sortDirSchema.optional(),
        ...paginationSchema(10),
      }),
    ),
  )
  .handler(async ({ data, context: { db, userId } }) => {
    const search = data.search || ''
    const status = data.status || 'all'
    const { page, pageSize } = data
    const escapedSearch = escapeLikePattern(search)

    const conditions = [
      sql`${project.id} IN (SELECT ${projectMember.projectId} FROM ${projectMember} WHERE ${projectMember.userId} = ${userId})`,
    ]
    if (search) {
      conditions.push(
        sql`${project.name} LIKE ${`%${escapedSearch}%`} ESCAPE '\\'`,
      )
    }
    if (status !== 'all') {
      conditions.push(eq(project.status, status))
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
  .validator(input(z.object({ projectId: idSchema })))
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
  .middleware([rateLimitMiddleware])
  .validator(
    input(
      z.object({
        name: projectNameSchema,
        description: descriptionSchema.optional(),
        deadline: deadlineSchema.optional(),
      }),
    ),
  )
  .handler(async ({ data, context: { db, userId } }) => {
    const trimmedName = data.name
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
  .middleware([rateLimitMiddleware])
  .validator(
    input(
      z.object({
        projectId: idSchema,
        name: projectNameSchema.optional(),
        description: descriptionSchema.optional(),
        status: projectStatusSchema.optional(),
        deadline: deadlineSchema.nullable().optional(),
      }),
    ),
  )
  .handler(async ({ data, context: { db, userId } }) => {
    await requireProjectRole(db, data.projectId, userId, {
      roles: ['ADMIN'],
      message: 'Only project admins can edit a project',
    })

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name !== undefined) updates.name = data.name
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
  .middleware([rateLimitMiddleware])
  .validator(input(z.object({ projectId: idSchema })))
  .handler(async ({ data, context: { db, userId } }) => {
    await requireProjectRole(db, data.projectId, userId, {
      roles: ['ADMIN'],
      message: 'Only project admins can delete a project',
    })

    // Tasks, members, invitations, comments, chat and activity cascade from
    // the project row. Notifications only hold a task id in reference_id
    // (no FK), so remove them explicitly in the same transaction.
    const projectTaskIds = db
      .select({ id: task.id })
      .from(task)
      .where(eq(task.projectId, data.projectId))
    await db.batch([
      db
        .delete(notification)
        .where(inArray(notification.referenceId, projectTaskIds)),
      db.delete(project).where(eq(project.id, data.projectId)),
    ])
    await closeChatRoom(data.projectId)
    return { success: true }
  })

export const removeProjectMember = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator(input(z.object({ projectId: idSchema, userId: idSchema })))
  .handler(async ({ data, context: { db, userId: requesterId } }) => {
    const requesterRole = await requireProjectRole(
      db,
      data.projectId,
      requesterId,
    )

    const [targetMember] = await db
      .select({
        id: projectMember.id,
        role: projectMember.role,
        name: user.name,
        email: user.email,
      })
      .from(projectMember)
      .innerJoin(user, eq(user.id, projectMember.userId))
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

    // One statement, so two admins removing each other concurrently can't
    // leave the project with no admin.
    const deleted = await db
      .delete(projectMember)
      .where(
        and(
          eq(projectMember.id, targetMember.id),
          sql`NOT (${projectMember.role} = 'ADMIN' AND (SELECT COUNT(*) FROM ${projectMember} WHERE ${projectMember.projectId} = ${data.projectId} AND ${projectMember.role} = 'ADMIN') <= 1)`,
        ),
      )
      .returning({ id: projectMember.id })

    if (deleted.length === 0) {
      throw new Error('Cannot remove the last project admin')
    }

    await disconnectChatUser(data.projectId, data.userId)

    await logActivity({
      db,
      actorId: requesterId,
      projectId: data.projectId,
      action: 'PROJECT_MEMBER_REMOVED',
      entityType: 'member',
      entityId: targetMember.id,
      metadata: {
        userId: data.userId,
        name: targetMember.name,
        email: targetMember.email,
      },
    })

    return { success: true }
  })

export const listProjectMembers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(input(z.object({ projectId: idSchema })))
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
