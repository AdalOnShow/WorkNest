// Custom Worker entry. Durable Object classes must be exported from the main
// module so the runtime can find them by class_name (see wrangler.jsonc).
export { ChatRoom } from '#/chat/ChatRoom'
export { default } from '@tanstack/react-start/server-entry'
