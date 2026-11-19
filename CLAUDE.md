# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

AGENTS.md (imported above) covers the skills directory, `context/` spec docs, design system, shadcn rules, and TanStack intent skills. This file adds commands and the architecture you only see by reading several files.

## Commands

```bash
pnpm dev                 # Vite dev server on :3000 (runs inside workerd via @cloudflare/vite-plugin)
pnpm build               # Production build -> dist/ (dist/server/wrangler.json is the deploy config)
pnpm lint                # ESLint (@tanstack/eslint-config)
pnpm check               # Prettier check
pnpm format              # Prettier write + eslint --fix
pnpm generate-routes     # Regenerate src/routeTree.gen.ts (also happens automatically in dev)
pnpm cf-typegen          # Regenerate worker-configuration.d.ts after changing wrangler.jsonc bindings
pnpm db:generate         # drizzle-kit generate -> migrations/
pnpm db:push | db:migrate | db:studio
pnpm deploy              # build + `wrangler d1 migrations apply worknest-db --remote` + wrangler deploy
```

There is no test runner. Use `pnpm lint` and `npx tsc --noEmit` to check changes.

To apply migrations to the local D1 that `pnpm dev` uses, run `pnpm wrangler d1 migrations apply worknest-db --local`.

## Environment

- **Runtime secrets** go in `.dev.vars` for local dev (see `.dev.vars.example`) and `wrangler secret put` for production. They are listed under `secrets.required` in `wrangler.jsonc`. Keys: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, Google/GitHub OAuth pairs, and `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`.
- **Drizzle Kit** reads `.env.local` (`CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN`) because it uses the `d1-http` driver against the remote D1.
- `createAuth` throws at request time if `DB` or `BETTER_AUTH_SECRET` is missing, or if neither the Google nor the GitHub OAuth pair is set. Sign-in is social-only; there is no email/password.

## Architecture

**Single Cloudflare Worker.** The entry point is `src/server-entry.ts`, which re-exports TanStack Start's default handler. Durable Object classes must be exported from it too, bound in `wrangler.jsonc`, and added under a new `migrations` tag. Use `new_sqlite_classes` for free-tier compatibility. Never edit or remove an existing migration tag: `v2` deletes the old `NotificationDO`/`ActivityDO` classes.

**Bindings access.** Server code reads bindings through `getCloudflareEnv()` (`src/lib/request-context.ts`, a wrapper over `cloudflare:workers` `env`). Nothing is passed through context. `createDb(env.DB)` (`src/db/index.ts`) and `createAuth(env)` (`src/lib/auth.ts`) are built per call, not as module-level singletons.

**Server functions (`src/server-functions/*.ts`)** hold all data access. They are `createServerFn().middleware([authMiddleware]).validator(...).handler(...)`.
- `authMiddleware` (`src/lib/middleware.ts`) resolves the Better Auth session or throws `Unauthorized`, and puts `{ db, auth, env, headers, session, user, userId }` on `context`.
- `sessionMiddleware` is the non-throwing variant.
- Project permissions are checked in the handler with `requireProjectRole(db, projectId, userId, { roles })`, `getProjectRole` and `canManage` (`src/lib/authz.ts`).
- Keep `src/lib/middleware.ts` free of plain exported helpers. The Start compiler only strips `.server()` bodies from the client build, so a plain helper would pull `cloudflare:workers` into the browser bundle. Put request helpers such as `getDb()` in `src/lib/request-context.ts` instead. The UI calls them directly from TanStack Query `queryFn`/`mutationFn` in route components, and mutations invalidate query keys like `['tasks']`, `['projects']`, `['dashboard']`.

**Authorization is per project.** The global `user_profile.role` is created as `TEAM_MEMBER` by a Better Auth `databaseHooks.user.create.after` hook. Real permissions come from `project_member.role` (`ADMIN | PROJECT_MANAGER | TEAM_MEMBER`), checked inside each server function. A user sees a task or project only through a `project_member` join. Project creators become `ADMIN`, and a `PROJECT_MANAGER` cannot grant `ADMIN`.

**Routing (`src/routes/`, file-based; `src/routeTree.gen.ts` is generated, don't edit it).**

- `_authenticated.tsx` is the pathless layout guard. `beforeLoad` calls the `getSession` server fn, redirects to `/login`, and puts `session`/`user` into route context for `AppLayout`.
- `api/auth/$.ts` mounts the Better Auth handler.

**Activity and notifications are D1-only.** Use `logActivity()` and `notifyUsers()` from `src/lib/activity.ts`. `notifyUsers` takes candidate `recipientIds`, then drops nulls, duplicates and the actor. Both helpers catch and log their own errors so they never fail the main mutation. Keep that contract. There is no WebSocket push for these; the UI picks them up through TanStack Query refetches.

**Real-time is project chat only** (in progress; see `context/PROCESS_TRACKER.md` Phase 9). There is one `ChatRoom` DO per project (`idFromName(projectId)`) using WebSocket Hibernation. Messages persist in D1, and history loads through a normal server function, so reading history never wakes the DO. The spec is in `context/PROJECT_OVERVIEW.md` §23–25.

**Database (`src/db/schema/`).** These are Drizzle `sqliteTable` definitions, one file per domain. `auth.ts` holds the Better Auth tables. Everything is re-exported from `schema/index.ts`, and relations live separately in `src/db/relations.ts`. After a schema change, run `pnpm db:generate`, commit the SQL in `migrations/`, and let `pnpm deploy` apply it remotely.

**No file attachments.** They were removed in migration `0003_drop_attachment`. The only upload is the profile photo, sent to Cloudinary (`src/lib/cloudinary.ts`). R2 is not used.

**Imports** use the `#/*` alias for `src/*`, defined in package.json `imports` and tsconfig paths. Prefer it over relative paths.
