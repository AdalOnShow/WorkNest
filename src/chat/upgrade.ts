import { createDb } from '#/db'
import { getProjectRole } from '#/lib/authz'
import { CHAT_HEADERS } from '#/chat/events'
import { createAuth } from '#/lib/auth'

/**
 * Authenticates a chat WebSocket upgrade and hands it to the project's
 * ChatRoom Durable Object.
 *
 * This is the only path into a ChatRoom, so everything the DO trusts is
 * established here:
 *   1. it must be a WebSocket upgrade,
 *   2. a browser Origin must match this site (cookies are sent on cross-site
 *      WebSocket handshakes and CORS does not apply, so without this any site
 *      could open a socket as the logged-in user),
 *   3. the Better Auth session must be valid,
 *   4. the user must be a member of the project.
 * The verified user then travels to the DO in CHAT_HEADERS. Any client-supplied
 * copies of those headers are stripped first.
 */
export async function handleChatUpgrade(
  request: Request,
  projectId: string,
  env: Env,
): Promise<Response> {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 })
  }

  // Non-browser clients may omit Origin; they still need a valid session cookie.
  const origin = request.headers.get('Origin')
  if (origin !== null && origin !== new URL(request.url).origin) {
    return new Response('Forbidden origin', { status: 403 })
  }

  const session = await createAuth(env).api.getSession({
    headers: request.headers,
  })
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const role = await getProjectRole(
    createDb(env.DB),
    projectId,
    session.user.id,
  )
  if (!role) {
    // Same response for "no such project" and "not a member".
    return new Response('Project not found', { status: 404 })
  }

  const headers = new Headers(request.headers)
  for (const name of Object.values(CHAT_HEADERS)) headers.delete(name)
  headers.set(CHAT_HEADERS.userId, session.user.id)
  headers.set(CHAT_HEADERS.userName, encodeURIComponent(session.user.name))
  if (session.user.image) {
    headers.set(CHAT_HEADERS.userImage, encodeURIComponent(session.user.image))
  }
  headers.set(CHAT_HEADERS.projectId, projectId)

  const room = env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName(projectId))
  return room.fetch(new Request(request, { headers }))
}
