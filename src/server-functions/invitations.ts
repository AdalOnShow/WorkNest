import { createDb } from '#/db'
import { project, projectInvitation, projectMember, user } from '#/db/schema'
import { logActivity } from '#/lib/activity'
import { createAuth } from '#/lib/auth'
import { getCloudflareEnv } from '#/lib/request-context'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, count, desc, eq, gt, inArray } from 'drizzle-orm'

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

function buildInvitationLink(token: string) {
  const baseUrl = getCloudflareEnv().BETTER_AUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/invitations/${token}`
}

function generateInvitationToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36)
}

export const createProjectInvitation = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      projectId: string
      email: string
      role?: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'
    }) => {
      const role = data.role ?? 'TEAM_MEMBER'
      if (!['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'].includes(role)) {
        throw new Error('Invalid role')
      }
      return { ...data, email: data.email.trim(), role }
    },
  )
  .handler(async ({ data }) => {
    const requesterId = await requireUserId()
    const db = getDb()

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

    if (
      membership.length === 0 ||
      !['ADMIN', 'PROJECT_MANAGER'].includes(membership[0].role)
    ) {
      throw new Error('Project not found or access denied')
    }

    const requestedRole = data.role
    if (membership[0].role === 'PROJECT_MANAGER' && requestedRole === 'ADMIN') {
      throw new Error('Only project admins can assign ADMIN role')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email address')
    }

    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email.toLowerCase()))
      .limit(1)

    if (existingUser.length > 0) {
      const alreadyMember = await db
        .select({ id: projectMember.id })
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, data.projectId),
            eq(projectMember.userId, existingUser[0].id),
          ),
        )
        .limit(1)

      if (alreadyMember.length > 0) {
        throw new Error('User is already a member of this project')
      }
    }

    const pendingInvitation = await db
      .select({ id: projectInvitation.id })
      .from(projectInvitation)
      .where(
        and(
          eq(projectInvitation.projectId, data.projectId),
          eq(projectInvitation.email, data.email.toLowerCase()),
          eq(projectInvitation.status, 'PENDING'),
          gt(projectInvitation.expiresAt, new Date()),
        ),
      )
      .limit(1)

    if (pendingInvitation.length > 0) {
      throw new Error('An active invitation already exists for this email')
    }

    const invitationId = crypto.randomUUID()
    const token = generateInvitationToken()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.insert(projectInvitation).values({
      id: invitationId,
      projectId: data.projectId,
      email: data.email.toLowerCase(),
      token,
      role: requestedRole,
      invitedBy: requesterId,
      status: 'PENDING',
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })

    const [projectRow] = await db
      .select({ name: project.name })
      .from(project)
      .where(eq(project.id, data.projectId))
      .limit(1)

    const [inviter] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, requesterId))
      .limit(1)

    await logActivity({
      db,
      actorId: requesterId,
      projectId: data.projectId,
      action: 'PROJECT_MEMBER_INVITED',
      entityType: 'member',
      entityId: invitationId,
      metadata: {
        email: data.email,
        role: requestedRole,
        projectName: projectRow?.name,
      },
    })

    const invitationLink = buildInvitationLink(token)

    return {
      id: invitationId,
      invitationLink,
      expiresAt: expiresAt.getTime(),
      projectName: projectRow?.name,
      inviterName: inviter?.name,
    }
  })

export const getProjectInvitation = createServerFn({ method: 'GET' })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb()

    const [invitation] = await db
      .select({
        id: projectInvitation.id,
        projectId: projectInvitation.projectId,
        email: projectInvitation.email,
        role: projectInvitation.role,
        status: projectInvitation.status,
        expiresAt: projectInvitation.expiresAt,
        createdAt: projectInvitation.createdAt,
        projectName: project.name,
        projectDescription: project.description,
        inviterName: user.name,
        inviterEmail: user.email,
      })
      .from(projectInvitation)
      .innerJoin(project, eq(projectInvitation.projectId, project.id))
      .leftJoin(user, eq(projectInvitation.invitedBy, user.id))
      .where(eq(projectInvitation.token, data.token))
      .limit(1)

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    const isExpired = new Date(invitation.expiresAt) < new Date()
    const isAccepted = invitation.status === 'ACCEPTED'
    const isRejected = invitation.status === 'REJECTED'

    return {
      ...invitation,
      expiresAt: invitation.expiresAt.getTime(),
      createdAt: invitation.createdAt.getTime(),
      isExpired,
      isAccepted,
      isRejected,
      isValid:
        invitation.status === 'PENDING' &&
        !isExpired &&
        !isAccepted &&
        !isRejected,
    }
  })

export const acceptProjectInvitation = createServerFn({ method: 'POST' })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()
    const auth = getAuth()

    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })
    if (!session) throw new Error('Unauthorized')

    const [invitation] = await db
      .select()
      .from(projectInvitation)
      .where(eq(projectInvitation.token, data.token))
      .limit(1)

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation has already been processed')
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      await db
        .update(projectInvitation)
        .set({ status: 'EXPIRED', updatedAt: new Date() })
        .where(eq(projectInvitation.id, invitation.id))
      throw new Error('Invitation has expired')
    }

    if (session.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error('This invitation was sent to a different email address')
    }

    const existingMember = await db
      .select({ id: projectMember.id })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, invitation.projectId),
          eq(projectMember.userId, userId),
        ),
      )
      .limit(1)

    if (existingMember.length > 0) {
      await db
        .update(projectInvitation)
        .set({ status: 'ACCEPTED', updatedAt: new Date() })
        .where(eq(projectInvitation.id, invitation.id))
      return {
        success: true,
        message: 'You are already a member of this project',
      }
    }

    const now = new Date()
    await db.batch([
      db.insert(projectMember).values({
        id: crypto.randomUUID(),
        projectId: invitation.projectId,
        userId,
        role: invitation.role,
        createdAt: now,
      }),
      db
        .update(projectInvitation)
        .set({ status: 'ACCEPTED', updatedAt: now })
        .where(eq(projectInvitation.id, invitation.id)),
    ])

    await logActivity({
      db,
      actorId: userId,
      projectId: invitation.projectId,
      action: 'PROJECT_MEMBER_ADDED',
      entityType: 'member',
      entityId: userId,
      metadata: { email: invitation.email, role: invitation.role },
    })

    return { success: true, projectId: invitation.projectId }
  })

export const rejectProjectInvitation = createServerFn({ method: 'POST' })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb()

    const [invitation] = await db
      .select()
      .from(projectInvitation)
      .where(eq(projectInvitation.token, data.token))
      .limit(1)

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation has already been processed')
    }

    await db
      .update(projectInvitation)
      .set({ status: 'REJECTED', updatedAt: new Date() })
      .where(eq(projectInvitation.id, invitation.id))

    return { success: true }
  })

export const listProjectInvitations = createServerFn({ method: 'GET' })
  .validator(
    (data: { projectId: string; page?: number; pageSize?: number }) => data,
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()

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

    const page = Math.max(1, Math.floor(data.page || 1))
    const pageSize = Math.min(100, Math.max(1, Math.floor(data.pageSize || 20)))

    // Accepted invitations show up as project members instead.
    const where = and(
      eq(projectInvitation.projectId, data.projectId),
      eq(projectInvitation.status, 'PENDING'),
    )
    const canManage = ['ADMIN', 'PROJECT_MANAGER'].includes(membership[0].role)

    const [invitations, countResult] = await Promise.all([
      db
        .select({
          id: projectInvitation.id,
          email: projectInvitation.email,
          role: projectInvitation.role,
          status: projectInvitation.status,
          token: projectInvitation.token,
          expiresAt: projectInvitation.expiresAt,
          createdAt: projectInvitation.createdAt,
          inviterName: user.name,
        })
        .from(projectInvitation)
        .leftJoin(user, eq(projectInvitation.invitedBy, user.id))
        .where(where)
        .orderBy(desc(projectInvitation.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: count() }).from(projectInvitation).where(where),
    ])

    const items = invitations.map(({ token, ...inv }) => ({
      ...inv,
      // Only people who can invite may see (and copy) the invite links.
      invitationLink: canManage ? buildInvitationLink(token) : null,
      expiresAt: inv.expiresAt.getTime(),
      createdAt: inv.createdAt.getTime(),
      isExpired: new Date(inv.expiresAt) < new Date(),
    }))

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / pageSize)

    return { items, total, totalPages, page, canManage }
  })

export const revokeProjectInvitation = createServerFn({ method: 'POST' })
  .validator((data: { invitationId: string }) => data)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const db = getDb()

    const [invitation] = await db
      .select()
      .from(projectInvitation)
      .where(eq(projectInvitation.id, data.invitationId))
      .limit(1)

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    const membership = await db
      .select()
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, invitation.projectId),
          eq(projectMember.userId, userId),
        ),
      )
      .limit(1)

    if (
      membership.length === 0 ||
      !['ADMIN', 'PROJECT_MANAGER'].includes(membership[0].role)
    ) {
      throw new Error('Project not found or access denied')
    }

    await db
      .update(projectInvitation)
      .set({ status: 'REJECTED', updatedAt: new Date() })
      .where(eq(projectInvitation.id, data.invitationId))

    return { success: true }
  })

/**
 * Pending, unexpired invitations addressed to the signed-in user's email.
 * Matching on email (not user id) means people who sign up after being
 * invited still see their invitations.
 */
export const listMyPendingInvitations = createServerFn({
  method: 'GET',
}).handler(async () => {
  const auth = getAuth()
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw new Error('Unauthorized')

  const items = await getDb()
    .select({
      id: projectInvitation.id,
      token: projectInvitation.token,
      role: projectInvitation.role,
      createdAt: projectInvitation.createdAt,
      projectName: project.name,
      inviterName: user.name,
    })
    .from(projectInvitation)
    .innerJoin(project, eq(projectInvitation.projectId, project.id))
    .leftJoin(user, eq(projectInvitation.invitedBy, user.id))
    .where(
      and(
        eq(projectInvitation.email, session.user.email.toLowerCase()),
        eq(projectInvitation.status, 'PENDING'),
        gt(projectInvitation.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(projectInvitation.createdAt))
    .limit(20)

  return items.map((inv) => ({ ...inv, createdAt: inv.createdAt.getTime() }))
})

/** Projects where the signed-in user is allowed to invite people. */
export const listInvitableProjects = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireUserId()

    return getDb()
      .select({
        id: project.id,
        name: project.name,
        role: projectMember.role,
      })
      .from(projectMember)
      .innerJoin(project, eq(projectMember.projectId, project.id))
      .where(
        and(
          eq(projectMember.userId, userId),
          inArray(projectMember.role, ['ADMIN', 'PROJECT_MANAGER']),
        ),
      )
      .orderBy(project.name)
  },
)
