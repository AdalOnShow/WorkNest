import { env } from 'cloudflare:workers'

export function getCloudflareEnv(): Cloudflare.Env {
  return env
}
