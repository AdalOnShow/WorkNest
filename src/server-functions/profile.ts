import {
  deleteFromCloudinary,
  getCloudinaryPublicId,
  uploadToCloudinary,
} from '#/lib/cloudinary'
import { authMiddleware, sessionMiddleware } from '#/lib/middleware'
import { createServerFn } from '@tanstack/react-start'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const CLOUDINARY_FOLDER = 'worknest/avatars'

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
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    if (
      typeof data !== 'object' ||
      data === null ||
      typeof (data as { name?: unknown }).name !== 'string'
    ) {
      throw new Error('Name is required')
    }

    return data as { name: string }
  })
  .handler(async ({ data, context: { auth, headers } }) => {
    const name = data.name.trim()
    if (name.length < 1 || name.length > 100) {
      throw new Error('Name must be between 1 and 100 characters')
    }

    // Use Better Auth's updateUser to update DB + refresh session cookie
    await auth.api.updateUser({
      body: { name },
      headers,
    })

    return { success: true }
  })

export const uploadProfilePhoto = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: FormData) => {
    const file = data.get('photo') as File | null
    if (!file) {
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
  .handler(async ({ data, context: { auth, env, headers, user } }) => {
    const { file } = data

    const oldPublicId = user.image ? getCloudinaryPublicId(user.image) : null

    // Upload new photo to Cloudinary
    const result = await uploadToCloudinary(env, file, CLOUDINARY_FOLDER)

    try {
      // Use Better Auth's updateUser to update DB + refresh session cookie
      await auth.api.updateUser({
        body: { image: result.secure_url },
        headers,
      })
    } catch {
      // Cleanup uploaded asset if DB update fails
      try {
        await deleteFromCloudinary(env, result.public_id)
      } catch {
        // Ignore cleanup errors
      }
      throw new Error('Failed to update profile photo')
    }

    if (oldPublicId) {
      try {
        await deleteFromCloudinary(env, oldPublicId)
      } catch {
        // Ignore delete errors
      }
    }

    return { success: true }
  })

export const deleteProfilePhoto = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context: { auth, env, headers, user } }) => {
    // Delete from Cloudinary
    if (user.image) {
      const publicId = getCloudinaryPublicId(user.image)
      if (publicId) {
        await deleteFromCloudinary(env, publicId)
      }
    }

    // Use Better Auth's updateUser to update DB + refresh session cookie
    await auth.api.updateUser({
      body: { image: null },
      headers,
    })

    return { success: true }
  })
