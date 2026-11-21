interface CloudinaryEnv {
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
}

interface CloudinaryErrorResponse {
  error?: {
    message?: string
  }
}

const CLOUDINARY_TIMEOUT_MS = 30_000

function getCloudinaryConfig(env: CloudinaryEnv) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME
  const apiKey = env.CLOUDINARY_API_KEY
  const apiSecret = env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      '[cloudinary] Missing credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    )
  }

  return { cloudName, apiKey, apiSecret }
}

function generateSignature(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return sorted + apiSecret
}

async function sha1(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-1', buffer)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
}

/**
 * Uploads to a fixed `publicId`, overwriting any previous asset there.
 * Callers pick the id (for avatars: one per user), so it is never derived
 * from user-controlled data such as a stored image URL.
 */
export async function uploadToCloudinary(
  env: CloudinaryEnv,
  file: File,
  publicId: string,
): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig(env)

  const timestamp = Math.floor(Date.now() / 1000)
  const paramsToSign: Record<string, string | number> = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  }
  const signature = await sha1(generateSignature(paramsToSign, apiSecret))

  const formData = new FormData()
  formData.append('file', file, file.name)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('public_id', publicId)
  formData.append('overwrite', 'true')
  formData.append('invalidate', 'true')

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(CLOUDINARY_TIMEOUT_MS),
    },
  )

  if (!response.ok) {
    const error = (await response
      .json()
      .catch(() => ({}))) as CloudinaryErrorResponse
    throw new Error(
      `[cloudinary] Upload failed: ${error.error?.message || response.statusText}`,
    )
  }

  const uploadResult: CloudinaryUploadResult = await response.json()
  return uploadResult
}

export async function deleteFromCloudinary(
  env: CloudinaryEnv,
  publicId: string,
): Promise<void> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig(env)

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await sha1(
    generateSignature({ public_id: publicId, timestamp }, apiSecret),
  )

  const formData = new FormData()
  formData.append('public_id', publicId)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(CLOUDINARY_TIMEOUT_MS),
    },
  )

  if (!response.ok) {
    const error = (await response
      .json()
      .catch(() => ({}))) as CloudinaryErrorResponse
    throw new Error(
      `[cloudinary] Delete failed: ${error.error?.message || response.statusText}`,
    )
  }
}

const AVATAR_FOLDER = 'worknest/avatars'

/** The only Cloudinary public id a user's avatar may live at. */
export function avatarPublicId(userId: string) {
  return `${AVATAR_FOLDER}/${userId}`
}

/**
 * True when `imageUrl` is this app's Cloudinary avatar for `userId`.
 * Used to reject forged avatar URLs written through Better Auth's update-user.
 */
export function isOwnAvatarUrl(
  env: CloudinaryEnv,
  imageUrl: string,
  userId: string,
): boolean {
  try {
    const url = new URL(imageUrl)
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') {
      return false
    }
    const prefix = `/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`
    if (!env.CLOUDINARY_CLOUD_NAME || !url.pathname.startsWith(prefix)) {
      return false
    }
    const rest = url.pathname
      .slice(prefix.length)
      .replace(/^v\d+\//, '')
      .replace(/\.[a-z0-9]+$/i, '')
    return rest === avatarPublicId(userId)
  } catch {
    return false
  }
}
