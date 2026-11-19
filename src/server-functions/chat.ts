import { createDb } from '#/db'
import { chatMessage, project, user } from '#/db/schema'
import { getProjectRole } from '#/chat/access'
import {
  CHAT_PAGE_SIZE,
  decodeChatCursor,
  encodeChatCursor,
} from '#/chat/events'
import type { ChatHistoryPage, ChatMessageDTO } from '#/chat/events'
import { createAuth } from '#/lib/auth'
import { getCloudflareEnv } from '#/lib/request-context'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, desc, eq, lt, or } from 'drizzle-orm'
import { z } from 'zod'

const getMessagesInput = z.object({
  projectId: z.string().min(1),
  cursor: z.string().min(1).nullish(),
  limit: z.number().int().min(1).max(100).optional(),
})

/**
 * One page of a project's chat history, newest first.
 *
 * Reads D1 directly and never touches the ChatRoom Durable Object, so loading
 * or scrolling history does not wake it. Live messages arrive over the room's
 * WebSocket and are merged into the same query cache on the client.
 */
export const getMessages = createServerFn({ method: 'GET' })
  .validator(getMessagesInput)
  .handler(async ({ data }): Promise<ChatHistoryPage> => {
    const env = getCloudflareEnv()
    const session = await createAuth(env).api.getSession({
      headers: getRequest().headers,
    })
    if (!session) throw new Error('Unauthorized')

    const db = createDb(env.DB)
    const role = await getProjectRole(db, data.projectId, session.user.id)
    // Same message for "missing" and "not a member" so project ids can't be probed.
    if (!role) throw new Error('Project not found')

    const limit = data.limit ?? CHAT_PAGE_SIZE
    const cursor = data.cursor ? decodeChatCursor(data.cursor) : null
    if (data.cursor && !cursor) throw new Error('Invalid cursor')

    const where = cursor
      ? and(
          eq(chatMessage.projectId, data.projectId),
          or(
            lt(chatMessage.createdAt, new Date(cursor.createdAt)),
            and(
              eq(chatMessage.createdAt, new Date(cursor.createdAt)),
              lt(chatMessage.id, cursor.id),
            ),
          ),
        )
      : eq(chatMessage.projectId, data.projectId)

    // Fetch one extra row to know whether an older page exists.
    const rows = await db
      .select({
        id: chatMessage.id,
        projectId: chatMessage.projectId,
        body: chatMessage.body,
        createdAt: chatMessage.createdAt,
        senderId: chatMessage.senderId,
        senderName: user.name,
        senderImage: user.image,
      })
      .from(chatMessage)
      .leftJoin(user, eq(chatMessage.senderId, user.id))
      .where(where)
      .orderBy(desc(chatMessage.createdAt), desc(chatMessage.id))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows

    const items: ChatMessageDTO[] = page.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      body: row.body,
      createdAt: row.createdAt.getTime(),
      sender:
        row.senderId && row.senderName !== null
          ? { id: row.senderId, name: row.senderName, image: row.senderImage }
          : null,
    }))

    const last = items.at(-1)
    return {
      items,
      nextCursor:
        hasMore && last ? encodeChatCursor(last.createdAt, last.id) : null,
    }
  })

/**
 * Metadata for opening a project's chat room. The client calls this before
 * connecting the WebSocket: a browser cannot read why a handshake was refused,
 * so membership errors are surfaced here instead.
 */
export const getChatRoom = createServerFn({ method: 'GET' })
  .validator(z.object({ projectId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const env = getCloudflareEnv()
    const session = await createAuth(env).api.getSession({
      headers: getRequest().headers,
    })
    if (!session) throw new Error('Unauthorized')

    const db = createDb(env.DB)
    const role = await getProjectRole(db, data.projectId, session.user.id)
    if (!role) throw new Error('Project not found')

    const rows = await db
      .select({ id: project.id, name: project.name })
      .from(project)
      .where(eq(project.id, data.projectId))
      .limit(1)
    const room = rows.at(0)
    if (!room) throw new Error('Project not found')

    return {
      projectId: room.id,
      projectName: room.name,
      role,
      /** ADMINs may delete anyone's message; everyone may delete their own. */
      canModerate: role === 'ADMIN',
      viewerId: session.user.id,
    }
  })
