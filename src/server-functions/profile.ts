import {
  avatarPublicId,
  deleteFromCloudinary,
  isOwnAvatarUrl,
  uploadToCloudinary,
} from '#/lib/cloudinary'
import { disconnectChatUser } from '#/chat/room-control'
import { project, projectMember, user as userTable } from '#/db/schema'
import { rateLimitMiddleware, sessionMiddleware } from '#/lib/middleware'
import { nameSchema, input } from '#/lib/validation'
import { createServerFn } from '@tanstack/react-start'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const getProfile = createServerFn({ method: 'GET' })
  .middleware([sessionMiddleware])
  .handler(async ({ context: { session } }) => {
    if (!session) {
      return null
    }

    const { id, expiresAt, createdAt, updatedAt, userId } = session.session

    return {
      user: session.user,
      session: {
        id,
        expiresAt,
        createdAt,
        updatedAt,
        userId,
      },
    }
  })

export const updateProfile = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator(input(z.object({ name: nameSchema('Name') })))
  .handler(async ({ data, context: { auth, headers } }) => {
    const { name } = data

    // Use Better Auth's updateUser to update DB + refresh session cookie
    await auth.api.updateUser({
      body: { name },
      headers,
    })

    return { success: true }
  })

export const uploadProfilePhoto = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error('No photo provided')
    const file = data.get('photo')
    if (!(file instanceof File)) {
      throw new Error('No photo provided')
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum size is 5MB')
    }
    return { file }
  })
  .handler(async ({ data, context: { auth, env, headers, userId } }) => {
    const { file } = data

    // One fixed asset per user: the upload overwrites the previous photo, so
    // there is nothing old to clean up and no id is read from user data.
    const result = await uploadToCloudinary(env, file, avatarPublicId(userId))

    try {
      // Use Better Auth's updateUser to update DB + refresh session cookie
      await auth.api.updateUser({
        body: { image: result.secure_url },
        headers,
      })
    } catch {
      throw new Error('Failed to update profile photo')
    }

    return { success: true }
  })

export const deleteProfilePhoto = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .handler(async ({ context: { auth, env, headers, user, userId } }) => {
    // Only ever delete this user's own fixed asset. OAuth avatars (Google,
    // GitHub) are not ours to delete.
    if (user.image && isOwnAvatarUrl(env, user.image, userId)) {
      await deleteFromCloudinary(env, avatarPublicId(userId))
    }

    // Use Better Auth's updateUser to update DB + refresh session cookie
    await auth.api.updateUser({
      body: { image: null },
      headers,
    })

    return { success: true }
  })

/**
 * Permanently deletes the signed-in user's account.
 *
 * Refused while the user is the only admin of any project, so no project is
 * left without someone who can manage it. FK cascades remove sessions,
 * accounts, the profile, memberships, assignments and notifications; tasks,
 * comments and chat messages they wrote stay with a null author.
 */
export const deleteAccount = createServerFn({ method: 'POST' })
  .middleware([rateLimitMiddleware])
  .handler(async ({ context: { auth, db, env, headers, user, userId } }) => {
    const soleAdminProjects = await db
      .select({ name: project.name })
      .from(projectMember)
      .innerJoin(project, eq(project.id, projectMember.projectId))
      .where(
        and(
          eq(projectMember.userId, userId),
          eq(projectMember.role, 'ADMIN'),
          sql`(SELECT COUNT(*) FROM ${projectMember} pm2 WHERE pm2.project_id = ${projectMember.projectId} AND pm2.role = 'ADMIN') = 1`,
        ),
      )

    if (soleAdminProjects.length > 0) {
      const names = soleAdminProjects.map((p) => `"${p.name}"`).join(', ')
      throw new Error(
        `You are the only admin of ${names}. Make someone else an admin or delete ${soleAdminProjects.length === 1 ? 'that project' : 'those projects'} first.`,
      )
    }

    const memberships = await db
      .select({ projectId: projectMember.projectId })
      .from(projectMember)
      .where(eq(projectMember.userId, userId))

    if (user.image && isOwnAvatarUrl(env, user.image, userId)) {
      try {
        await deleteFromCloudinary(env, avatarPublicId(userId))
      } catch (err) {
        console.error('[deleteAccount] Failed to delete avatar:', err)
      }
    }

    // Clear the session cookies on this response. The cookie cache would
    // otherwise keep the deleted user signed in until it expires.
    try {
      await auth.api.signOut({ headers })
    } catch (err) {
      console.error('[deleteAccount] signOut failed:', err)
    }

    await db.delete(userTable).where(eq(userTable.id, userId))

    await Promise.all(
      memberships.map((m) => disconnectChatUser(m.projectId, userId)),
    )

    return { success: true }
  })
