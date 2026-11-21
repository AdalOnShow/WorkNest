import { getCloudflareEnv } from '#/lib/request-context'

/**
 * Best-effort control of a project's live ChatRoom from server functions.
 * Failures are logged and swallowed: the D1 change already happened, and the
 * room re-checks membership on every send anyway.
 */
function room(projectId: string) {
  const env = getCloudflareEnv()
  return env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName(projectId))
}

export async function disconnectChatUser(projectId: string, userId: string) {
  try {
    await room(projectId).disconnectUser(userId)
  } catch (err) {
    console.error('[chat] disconnectUser failed:', err)
  }
}

export async function closeChatRoom(projectId: string) {
  try {
    await room(projectId).closeRoom()
  } catch (err) {
    console.error('[chat] closeRoom failed:', err)
  }
}
