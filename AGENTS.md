# WorkNest - Agent Instructions

## Project Overview

WorkNest is a fully serverless, Cloudflare-native team collaboration platform built with TanStack Start, Cloudflare D1/R2/Durable Objects, Better Auth, Drizzle ORM, and shadcn/ui.

---

## Skills Directory (`.agents/skills/`)

### When to Use Each Skill

| Skill | When to Use |
|-------|-------------|
| `better-auth-best-practices` | Configuring auth.ts, OAuth providers (Google/GitHub), session management, Better Auth plugins, database adapter setup, email/password auth, environment variables (BETTER_AUTH_SECRET, BETTER_AUTH_URL) |
| `cloudflare` | Any Cloudflare platform task: D1 database operations, R2 file storage, Durable Objects for chat, Workers configuration, wrangler.jsonc, KV, Vectorize, deployment settings |
| `code-review` | Reviewing branches, PRs, or work-in-progress changes. Runs Standards + Spec review in parallel. Use when user asks to "review since X" |
| `drizzle-orm-patterns` | Defining database schemas, writing type-safe queries, CRUD operations, relations, transactions, migrations with Drizzle Kit. For SQLite (D1) use `sqliteTable()` from `drizzle-orm/sqlite-core` |
| `tanstack-start` | TanStack Start project setup, server functions, route configuration, SSR/streaming, middleware, API routes, deployment, React Server Components |
| `workers-best-practices` | Writing or reviewing Cloudflare Workers code, wrangler.jsonc config, checking anti-patterns (streaming, floating promises, global state, secrets, bindings) |

### Skill Loading

Load skills proactively when a task matches their description. Use the skill tool to inject instructions into the conversation.

---

## Context Directory (`context/`)

### File Reference

| File | Contents |
|------|----------|
| `PROJECT_OVERVIEW.md` | Master project specification (1650 lines). Tech stack, features, constraints, role-based access, state management rules, all 50 sections of the spec |
| `TECHNICAL_FLOW.md` | Complete technical/user flows for all 18 features: Auth, Authorization, Projects, Tasks, Dashboard, Comments, Attachments, Notifications, Real-Time Messaging, Theme, Responsive Design, Search/Filter/Sort, Pagination, Error Handling, State Management, Data Flow Summary, Feature Interaction Map, Security Enforcement Points |
| `DESIGN.md` | **Tomorro Dark Neon** design system. Colors (primary #68EF3F, secondary #121212, tertiary #1F331D, surface #172318), typography (Ozik for headlines, Aeonik for body), spacing scale, rounded corners, component tokens (button, card, input, chip), layout rules, do's and don'ts |
| `ARCHITECTURE_DECISIONS.md` | (To be populated) Architecture decision records |
| `DATABASE_SCHEMA.md` | (To be populated) Drizzle ORM schema definitions for D1 |
| `FEATURES.md` | (To be populated) Feature implementation status tracker |
| `PROCESS_TRACKER.md` | (To be populated) Development progress tracker |

### Design System

This project follows the **Tomorro Dark Neon** design system defined in `context/DESIGN.md`. Key rules:

- **Primary accent:** #68EF3F (neon green) — reserved for CTAs and critical highlights only
- **Background:** #121212 (near-black forest) — dominant page background
- **Surface:** #172318 (dark green) — cards, chips, UI containers
- **Typography:** Ozik for hero headlines, Aeonik for everything else
- **Shapes:** Pill-heavy buttons (full radius), medium-large rounded cards, no sharp corners
- **Elevation:** Flat and tonal — no heavy shadows, use color contrast for hierarchy

---

## Styling Rules

### styles.css

Update `src/styles.css` to match the Tomorro Dark Neon design system. The current file contains the old WorkNest theme. Replace CSS variables with the DESIGN.md tokens.

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
