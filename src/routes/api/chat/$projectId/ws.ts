import { createFileRoute } from '@tanstack/react-router'
import { handleChatUpgrade } from '#/chat/upgrade'
import { getCloudflareEnv } from '#/lib/request-context'

/**
 * WebSocket endpoint for a project's chat room.
 * Connect with: new WebSocket(`${wsOrigin}/api/chat/${projectId}/ws`)
 */
export const Route = createFileRoute('/api/chat/$projectId/ws')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleChatUpgrade(request, params.projectId, getCloudflareEnv()),
    },
  },
})
