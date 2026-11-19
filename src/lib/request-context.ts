import { createDb } from '#/db'
import { env } from 'cloudflare:workers'

export function getCloudflareEnv(): Cloudflare.Env {
  return env
}

/** D1 client for the current request (for server functions without auth). */
export function getDb() {
  return createDb(env.DB)
}
