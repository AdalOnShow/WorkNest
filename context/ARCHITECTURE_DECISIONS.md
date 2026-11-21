# Architecture Decisions

Short records of decisions that are not obvious from the code.

## ADR-1: One Cloudflare Worker, TanStack Start

Everything (SSR, server functions, Better Auth, chat upgrade) runs in one Worker (`src/server-entry.ts`). Bindings are read per request through `getCloudflareEnv()`; nothing is a module-level singleton.

## ADR-2: Authorization is per project

`project_member.role` (`ADMIN | PROJECT_MANAGER | TEAM_MEMBER`) is the only permission source. Every server function checks it with `requireProjectRole` / `canManage` (`src/lib/authz.ts`), and every list query is scoped by a `project_member` join. A non-member gets the same error as a missing resource, so ids can't be probed. People join projects only by accepting an invitation sent to their (verified) email; there is no direct "add member" endpoint.

## ADR-3: Runtime validation on every server function

TypeScript validator types are compile-time only. All inputs go through zod via `input(schema)` (`src/lib/validation.ts`), which also bounds string lengths and page sizes and turns the first issue into a readable error message.

## ADR-4: Rate limiting

Mutating server functions use `rateLimitMiddleware` (`src/lib/middleware.ts`): 60 requests per user per minute via the Workers Rate Limiting binding `MUTATION_LIMITER`. Better Auth's own limiter uses `storage: "database"` (`rate_limit` table), because isolates don't share memory.

## ADR-5: Activity and notifications are D1-only

`logActivity` / `notifyUsers` (`src/lib/activity.ts`) write to D1 and never fail the caller. The UI picks them up through TanStack Query refetches. There is no push.

## ADR-6: Project chat is one Durable Object per project

`ChatRoom` (`idFromName(projectId)`) uses WebSocket Hibernation. Messages persist in D1, and history is read by a server function, so reading history never wakes the DO.

- **Upgrades bypass Start.** WebSocket upgrades to `/api/chat/:projectId/ws` are routed in `src/server-entry.ts` before TanStack Start. Start rebuilds Responses and can't pass through a 101 (`RangeError: status codes 200 to 599`). `src/chat/upgrade.ts` checks origin, session and membership.
- **Removal closes sockets.** Removing a member or deleting a project calls the room's `disconnectUser` / `closeRoom` RPC (`src/chat/room-control.ts`), so removed members stop receiving messages at once.

## ADR-7: Avatars on Cloudinary at a fixed id per user

Uploads go to `worknest/avatars/<userId>` with overwrite. The app never derives a Cloudinary public id from a stored URL. A Better Auth `user.update.before` hook rejects `image` values other than the user's own Cloudinary avatar or a Google/GitHub avatar. Without it, anyone could point their `image` at another user's asset and delete it.

## ADR-8: PBKDF2 at 10k iterations

This keeps sign-in inside the free tier's 10 ms CPU limit. It is acceptable only because passwords exist solely for the public demo accounts. See `src/lib/password.ts`.

## ADR-9: Demo accounts are unprotected by design

The seeded demo accounts (public password) can edit and delete anything in their projects. They are only reachable with `ENABLE_EMAIL_PASSWORD="true"`. Re-run `pnpm db:seed --remote` to reset them.

## ADR-10: Security headers

`src/start.ts` sets HSTS, nosniff, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, and a CSP limited to `frame-ancestors`, `base-uri`, `object-src` and `form-action`. A script-src CSP would need SSR nonces.
