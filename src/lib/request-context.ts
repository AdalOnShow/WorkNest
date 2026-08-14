import type { H3Event } from 'h3'

const GLOBAL_EVENT_STORAGE_KEY = Symbol.for('tanstack-start:event-storage')

interface StartEvent {
  h3Event: H3Event
}

interface EventStorage {
  getStore: () => StartEvent | undefined
}

function getH3Event(): H3Event {
  const globalObj = globalThis as Record<symbol, unknown>
  const storage = globalObj[GLOBAL_EVENT_STORAGE_KEY] as EventStorage | undefined
  const event = storage?.getStore()
  if (!event) {
    throw new Error(
      'No request event found. Make sure this is called within a server function or route handler.',
    )
  }
  return event.h3Event
}

export function getRequestEvent() {
  return getH3Event()
}

export function getCloudflareEnv(): Record<string, unknown> {
  const event = getH3Event()
  const ctx = (event as any).context
  return ctx?.cloudflare?.env || ctx?.env || ctx?.cloudflare || {}
}
