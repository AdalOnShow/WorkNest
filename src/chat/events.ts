/**
 * Project chat wire protocol, shared by the browser client and the ChatRoom
 * Durable Object. Keep this file free of server-only imports.
 *
 * Transport: JSON text frames over one WebSocket per open chat room.
 * Keepalive: the client sends the literal text "ping" and the DO auto-replies
 * "pong" without waking (setWebSocketAutoResponse). Those frames are not JSON.
 */
import { z } from 'zod'

export const CHAT_MESSAGE_MAX_LENGTH = 2000
export const CHAT_PAGE_SIZE = 30
export const CHAT_PING = 'ping'
export const CHAT_PONG = 'pong'

// ─── Shared shapes ─────────────────────────────────────

export interface ChatUser {
  id: string
  name: string
  image: string | null
}

export interface ChatMessageDTO {
  id: string
  projectId: string
  body: string
  /** Epoch milliseconds. */
  createdAt: number
  /** Null when the sender's account was deleted. */
  sender: ChatUser | null
}

export interface ChatHistoryPage {
  items: ChatMessageDTO[]
  /** Pass back as `cursor` to load older messages; null when exhausted. */
  nextCursor: string | null
}

export const chatMessageBodySchema = z
  .string()
  .trim()
  .min(1, 'Message cannot be empty')
  .max(
    CHAT_MESSAGE_MAX_LENGTH,
    `Message cannot exceed ${CHAT_MESSAGE_MAX_LENGTH} characters`,
  )

// ─── Client → server ───────────────────────────────────

export const clientEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SEND'),
    body: chatMessageBodySchema,
    /** Client-generated id echoed back in MESSAGE_CREATED for reconciliation. */
    clientId: z.string().max(64).optional(),
  }),
  z.object({
    type: z.literal('DELETE'),
    messageId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal('TYPING'),
  }),
])

export type ClientEvent = z.infer<typeof clientEventSchema>

// ─── Server → client ───────────────────────────────────

export type ChatErrorCode =
  | 'INVALID_EVENT'
  | 'RATE_LIMITED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL'

export type ServerEvent =
  | { type: 'MESSAGE_CREATED'; message: ChatMessageDTO; clientId?: string }
  | { type: 'MESSAGE_DELETED'; messageId: string }
  | { type: 'TYPING'; user: ChatUser }
  | { type: 'PRESENCE_SNAPSHOT'; users: ChatUser[] }
  | { type: 'USER_ONLINE'; user: ChatUser }
  | { type: 'USER_OFFLINE'; userId: string }
  | { type: 'ERROR'; code: ChatErrorCode; message: string; clientId?: string }

// ─── Upgrade headers (Worker route → DO) ───────────────

/**
 * Set by the authenticated upgrade route after it validates the session and
 * project membership. The DO is only reachable through its binding, so these
 * headers cannot be supplied by a browser.
 */
export const CHAT_HEADERS = {
  userId: 'X-Chat-User-Id',
  userName: 'X-Chat-User-Name',
  userImage: 'X-Chat-User-Image',
  projectId: 'X-Chat-Project-Id',
} as const

// ─── Cursor helpers ────────────────────────────────────

/** Keyset cursor over (createdAt DESC, id DESC). */
export function encodeChatCursor(createdAt: number, id: string): string {
  return `${createdAt}_${id}`
}

export function decodeChatCursor(
  cursor: string,
): { createdAt: number; id: string } | null {
  const sep = cursor.indexOf('_')
  if (sep <= 0) return null
  const createdAt = Number(cursor.slice(0, sep))
  const id = cursor.slice(sep + 1)
  if (!Number.isSafeInteger(createdAt) || id.length === 0) return null
  return { createdAt, id }
}
