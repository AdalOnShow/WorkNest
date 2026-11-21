# WorkNest - Agent Instructions

## Project Overview

WorkNest is a fully serverless, Cloudflare-native team collaboration platform built with TanStack Start, Cloudflare D1 + Durable Objects (project chat only), Cloudinary (profile photos only), Better Auth, Drizzle ORM, and shadcn/ui.

---

## Skills Directory (`.agents/skills/`)

### When to Use Each Skill

| Skill                        | When to Use                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `better-auth-best-practices` | Configuring auth.ts, OAuth providers (Google/GitHub), session management, Better Auth plugins, database adapter setup, email/password auth, environment variables (BETTER_AUTH_SECRET, BETTER_AUTH_URL) |
| `cloudflare`                 | Any Cloudflare platform task: D1 database operations, R2 file storage, Durable Objects for chat, Workers configuration, wrangler.jsonc, KV, Vectorize, deployment settings                              |
| `code-review`                | Reviewing branches, PRs, or work-in-progress changes. Runs Standards + Spec review in parallel. Use when user asks to "review since X"                                                                  |
| `drizzle-orm-patterns`       | Defining database schemas, writing type-safe queries, CRUD operations, relations, transactions, migrations with Drizzle Kit. For SQLite (D1) use `sqliteTable()` from `drizzle-orm/sqlite-core`         |
| `tanstack-start`             | TanStack Start project setup, server functions, route configuration, SSR/streaming, middleware, API routes, deployment, React Server Components                                                         |
| `workers-best-practices`     | Writing or reviewing Cloudflare Workers code, wrangler.jsonc config, checking anti-patterns (streaming, floating promises, global state, secrets, bindings)                                             |

### Skill Loading

Load skills proactively when a task matches their description. Use the skill tool to inject instructions into the conversation.

---

## Context Directory (`context/`)

### File Reference

| File                        | Contents                                                                                                                                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PROJECT_OVERVIEW.md`       | Master project specification (1650 lines). Tech stack, features, constraints, role-based access, state management rules, all 50 sections of the spec                                                                                                                                                           |
| `TECHNICAL_FLOW.md`         | Complete technical/user flows for all 18 features: Auth, Authorization, Projects, Tasks, Dashboard, Comments, Project Chat, Notifications, Theme, Responsive Design, Search/Filter/Sort, Pagination, Error Handling, State Management, Data Flow Summary, Feature Interaction Map, Security Enforcement Points |
| `DESIGN.md`                 | **Mono** design system. Monochrome neutral surfaces (white / #0A0A0A), single blue accent #2F80FF with a blue ramp for charts, Geist UI + Source Serif 4 headlines (weight 400), chamfered (cut-corner) buttons and cards, hairline borders, status/priority tokens, do's and don'ts                           |
| `ARCHITECTURE_DECISIONS.md` | (To be populated) Architecture decision records                                                                                                                                                                                                                                                                |
| `DATABASE_SCHEMA.md`        | (To be populated) Drizzle ORM schema definitions for D1                                                                                                                                                                                                                                                        |
| `FEATURES.md`               | (To be populated) Feature implementation status tracker                                                                                                                                                                                                                                                        |
| `PROCESS_TRACKER.md`        | (To be populated) Development progress tracker                                                                                                                                                                                                                                                                 |

### Design System

This project follows the **Mono** design system defined in `context/DESIGN.md`. All values live as tokens in `src/styles.css`. Use the tokens and utilities, never raw hex. Key rules:

- **Themes:** light-first (`:root`) with a matching dark mode (`.dark`). The default follows the OS (`defaultTheme="system"`).
- **Palette:** monochrome neutral (`background` #FFF / #0A0A0A, `muted` #F5F5F5, `border` #E5E5E5) with one blue accent #2F80FF (`primary`). Charts use the blue ramp (`blue-1`…`blue-4`, `chart-*`). Legacy chip roles `lime`, `sky`, `highlight` map to pale blue, neutral and pale amber.
- **Typography:** Geist for UI (body 400). `h1`/`h2` are Source Serif 4 at weight 400 with -0.01em tracking. Geist Mono for `eyebrow` labels, dates and counts. App UI is dense: 13px panel titles, 11px meta text. Use `stat-number` for KPI figures.
- **Buttons:** Button `default` is `bg-foreground` with the `chamfer` cut-corner shape; `outline` is a chamfered hairline. Badges are `rounded-[3px]`, 11px.
- **Surfaces:** `rounded-lg border border-border/60 bg-background` panels. Chamfered cards use an outer `bg-border p-px` wrapper. **No gradients, glows or gradient text.**

---

## Styling Rules

### styles.css

`src/styles.css` holds the Mono tokens (`:root` = light, `.dark` = dark), the `@theme inline` mapping, and the custom utilities (`headline-*`, `eyebrow`, `label-*`, `body-*`, `stat-number`, `chamfer`). Add new colors there as tokens, not as hex in components.

### shadcn/ui Components

**DO NOT generate shadcn components manually.** Install all components from the online registry:

```bash
pnpm dlx shadcn@latest add <component-name>
```

Common components needed for this project:

- `button`, `card`, `input`, `label`, `badge`, `avatar`
- `dialog`, `dropdown-menu`, `popover`, `tooltip`
- `table`, `tabs`, `select`, `checkbox`, `radio-group`
- `form`, `separator`, `sheet`, `sidebar`
- `scroll-area`, `skeleton`, `spinner`

Always install from registry, then customize via CSS variables in `styles.css`.

---

## Intent Skills (TanStack)

Before editing TanStack files, run the matching guidance command from the intent-skills block at the top of this file. Key ones for this project:

- `@tanstack/react-start#react-start` — React bindings, createStart, StartClient
- `@tanstack/router-core#router-core` — Route tree, createRoute, file naming
- `@tanstack/router-core#router-core/auth-and-guards` — Route protection with beforeLoad, RBAC
- `@tanstack/router-core#router-core/data-loading` — Loaders, staleTime, error handling
- `@tanstack/router-core#router-core/navigation` — Link, useNavigate, preloading
- `@tanstack/start-client-core#start-core/server-functions` — createServerFn, validators
- `@tanstack/start-client-core#start-core/middleware` — createMiddleware, context passing
- `@tanstack/react-table#getting-started` — Table setup with useTable, features
- `@tanstack/react-table#with-tanstack-query` — Composing table with TanStack Query

---

## Quick Commands

```bash
# Dev server
pnpm dev

# Build
pnpm build

# Install shadcn component
pnpm dlx shadcn@latest add button

# Drizzle migrations
pnpm drizzle-kit push        # dev
pnpm drizzle-kit generate    # generate migration files
pnpm drizzle-kit migrate     # apply migrations

# Deploy to Cloudflare
pnpm deploy
```
