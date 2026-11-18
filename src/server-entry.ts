// Custom Worker entry. Durable Object classes must be exported from the main
// module, so new DO classes (e.g. ChatRoom) get re-exported here.
export { default } from '@tanstack/react-start/server-entry'
