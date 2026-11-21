import {
  avatarPublicId,
  deleteFromCloudinary,
  isOwnAvatarUrl,
  uploadToCloudinary,
} from '#/lib/cloudinary'
import { rateLimitMiddleware, sessionMiddleware } from '#/lib/middleware'
import { nameSchema, input } from '#/lib/validation'
import { createServerFn } from '@tanstack/react-start'
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
