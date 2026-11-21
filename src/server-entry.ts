// Custom Worker entry. Durable Object classes must be exported from the main
// module so the runtime can find them by class_name (see wrangler.jsonc).
import startEntry from '@tanstack/react-start/server-entry'
import { handleChatUpgrade } from '#/chat/upgrade'

export { ChatRoom } from '#/chat/ChatRoom'

const CHAT_WS_PATH = /^\/api\/chat\/([^/]+)\/ws$/

export default {
  fetch(request: Request, env: Env) {
    // Chat WebSocket upgrades bypass TanStack Start: its response handling
    // rebuilds Responses and cannot pass through the Durable Object's 101.
    const match = CHAT_WS_PATH.exec(new URL(request.url).pathname)
    if (match?.[1]) {
      return handleChatUpgrade(request, decodeURIComponent(match[1]), env)
    }
    return startEntry.fetch(request)
  },
}
