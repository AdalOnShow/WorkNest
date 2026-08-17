import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createAuth } from '#/lib/auth'
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryPublicId,
} from '#/lib/cloudinary'
import { getCloudflareEnv } from '#/lib/request-context'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const CLOUDINARY_FOLDER = 'worknest/avatars'

export const getProfile = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const env = getCloudflareEnv()
    const auth = createAuth(env)
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return null
    }

    return {
      user: session.user,
      session: session.session,
    }
  },
)

export const updateProfile = createServerFn({ method: 'POST' })
  .validator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const env = getCloudflareEnv()
    const auth = createAuth(env)
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const name = data.name.trim()
    if (name.length < 1 || name.length > 100) {
      throw new Error('Name must be between 1 and 100 characters')
    }

    // Use Better Auth's updateUser to update DB + refresh session cookie
    await auth.api.updateUser({
      body: { name },
      headers: request.headers,
    })

    return { success: true }
  })

export const uploadProfilePhoto = createServerFn({ method: 'POST' })
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
  .handler(async ({ data }) => {
    const request = getRequest()
    const env = getCloudflareEnv()
    const auth = createAuth(env)
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const { file } = data
    const userId = session.user.id

    // Delete old photo from Cloudinary if exists
    if (session.user.image) {
      const oldPublicId = getCloudinaryPublicId(session.user.image)
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(env, oldPublicId)
        } catch {
          // Ignore delete errors
        }
      }
    }

    // Upload new photo to Cloudinary
    const result = await uploadToCloudinary(env, file, CLOUDINARY_FOLDER)

    // Use Better Auth's updateUser to update DB + refresh session cookie
    await auth.api.updateUser({
      body: { image: result.secure_url },
      headers: request.headers,
    })

    return { success: true }
  })

export const deleteProfilePhoto = createServerFn({ method: 'POST' }).handler(
  async () => {
    const request = getRequest()
    const env = getCloudflareEnv()
    const auth = createAuth(env)
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    // Delete from Cloudinary
    if (session.user.image) {
      const publicId = getCloudinaryPublicId(session.user.image)
      if (publicId) {
        try {
          await deleteFromCloudinary(env, publicId)
        } catch {
          // Ignore delete errors
        }
      }
    }

    // Use Better Auth's updateUser to update DB + refresh session cookie
    await auth.api.updateUser({
      body: { image: null },
      headers: request.headers,
    })

    return { success: true }
  },
)
