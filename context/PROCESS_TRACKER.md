# WorkNest Development Process Tracker

Track high-level development phases and milestones.

**Legend:**

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

---

## Phase 1: Infrastructure

**Goal:** Working TanStack Start project on Cloudflare with D1, Cloudinary, Durable Objects.

| #   | Task                                       | Status | Notes                                          |
| --- | ------------------------------------------ | ------ | ---------------------------------------------- |
| 1   | TanStack Start project scaffolded          | [x]    | vite.config.ts with tanstackStart + cloudflare |
| 2   | Cloudflare Worker configured               | [x]    | wrangler.jsonc, cloudflare vite plugin         |
| 3   | D1 database created                        | [x]    | Binding "DB" in wrangler.jsonc, dev.db exists  |
| 4   | Drizzle ORM + Drizzle Kit installed        | [x]    | drizzle-orm@^0.45.2, drizzle-kit@^0.31.10      |
| 5   | drizzle.config.ts configured (D1-http)     | [x]    | D1-http driver with env credentials            |
| 6   | D1 binding in wrangler config              | [x]    | d1_databases binding "DB" configured           |
| 7   | Cloudinary configured (profile photos)     | [x]    | REST API wrapper, worknest/avatars folder      |
| 8   | Durable Objects configured (ChatRoom only) | [x]    | CHAT_ROOM binding, migration v3; v2 removed old DOs |
| 9   | Database client (src/db/index.ts)          | [x]    | createDb() with D1 + schema + relations        |

---

## Phase 2: Database Schema

**Goal:** Complete D1 schema with all tables, relations, indexes, constraints.

| #   | Task                         | Status | Notes                                          |
| --- | ---------------------------- | ------ | ---------------------------------------------- |
| 10  | Better Auth schema generated | [x]    | user, session, account, verification tables    |
| 11  | User profile schema          | [x]    | userProfile with role enum field               |
| 12  | Project schema               | [x]    | project table with status enum                 |
| 13  | Project member schema        | [x]    | projectMember with unique constraint           |
| 14  | Task schema                  | [x]    | task with unique(project, title) constraint    |
| 15  | Comment schema               | [x]    | comment table                                  |
| 16  | ~~Attachment schema~~        | n/a    | Dropped by migration 0003_drop_attachment      |
| 17  | Notification schema          | [x]    | notification with type enum                    |
| 18  | Activity schema              | [x]    | activity table                                 |
| 19  | All relations defined        | [x]    | relations.ts — all one/many relations          |
| 21  | All indexes defined          | [x]    | Indexes on all tables (creator, assignee, etc) |
| 22  | Migrations generated         | [x]    | 0000_rapid_joseph.sql, 0001_minor_exiles.sql   |
| 23  | Migrations applied locally   | [x]    | dev.db exists with tables                      |
| 24  | Schema verified              | [x]    | All tables, relations, indexes in place        |

---

## Phase 3: Authentication

**Goal:** Working auth with email/password (hidden toggle), Google OAuth, GitHub OAuth, sessions, role-based route protection.

| #   | Task                                      | Status | Notes                                         |
| --- | ----------------------------------------- | ------ | --------------------------------------------- |
| 25  | auth.ts configured (D1 adapter)           | [x]    | drizzleAdapter with authSchema, session cache |
| 26  | Email + password enabled (behind toggle)  | [x]    | ENABLE_EMAIL_PASSWORD, sign-in only, PBKDF2     |
| 27  | Google OAuth configured                   | [x]    | Dynamic — enabled if GOOGLE_CLIENT_* set      |
| 28  | GitHub OAuth configured                   | [x]    | Dynamic — enabled if GITHUB_CLIENT_* set      |
| 29  | Auth client configured                    | [x]    | src/lib/auth-client.ts                        |
| 30  | Session management working                | [x]    | Cookie cache (2min), getSession server fn     |
| 31  | Protected routes (beforeLoad guards)      | [x]    | _authenticated layout redirects to /login     |
| 32  | Server-side session validation middleware | [x]    | getSession + requireSession server functions  |
| 33  | Role-based authorization middleware       | [x]    | authMiddleware + requireProjectRole (lib/authz) |
| 34  | Login page                                | [x]    | Social login (Google + GitHub) with redirect  |
| 35  | Signup page                               | [x]    | Via OAuth first sign-in; email is sign-in only |
| 36  | Auth callback handling                    | [x]    | /api/auth/$ catch-all route                   |

---

## Phase 4: Projects

**Goal:** Full project CRUD with membership, search, filter, sort, pagination.

| #   | Task                             | Status | Notes                                                        |
| --- | -------------------------------- | ------ | ------------------------------------------------------------ |
| 37  | Create project (server function) | [x]    | createProject — inserts project + member                     |
| 38  | Read project (server function)   | [x]    | getProject — with membership check                           |
| 39  | Update project (server function) | [x]    | updateProject — name, status, deadline                       |
| 40  | Delete project (server function) | [x]    | deleteProject — admin-only                                   |
| 41  | Add project member               | [x]    | addProjectMember                                             |
| 42  | Remove project member            | [x]    | removeProjectMember                                          |
| 43  | Project list page                | [x]    | Real D1 data via TanStack Query                              |
| 44  | Project detail page              | [x]    | Real D1 data via TanStack Query                              |
| 45  | Search (by name)                 | [x]    | Server-side search via like()                                |
| 46  | Filter (by status)               | [x]    | Server-side filter via eq()                                  |
| 47  | Sort                             | [x]    | created / name / deadline (nulls last) / updated, asc or desc  |
| 48  | Pagination                       | [x]    | Server-side pagination (count + offset)                      |
| 49  | Permissions enforced             | [x]    | Membership check in getProject, admin check in deleteProject |

---

## Phase 5: Tasks

**Goal:** Full task CRUD with assignment, status, priority, deadline, validation, search, filter, sort, pagination.

| #   | Task                                                   | Status | Notes                                          |
| --- | ------------------------------------------------------ | ------ | ---------------------------------------------- |
| 50  | Create task                                            | [x]    | createTask                                     |
| 51  | Read task                                              | [x]    | getTask — with project/assignee joins          |
| 52  | Update task                                            | [x]    | updateTask — title, status, priority, assignee |
| 53  | Delete task                                            | [x]    | deleteTask                                     |
| 54  | Assign task                                            | [x]    | assignTask                                     |
| 55  | Change task status                                     | [x]    | changeTaskStatus — auto-sets completedAt       |
| 56  | Task validation                                        | [x]    | Duplicate title, past deadline, completed-reassign block, RBAC |
| 57  | Task list page                                         | [x]    | Real D1 data via TanStack Query                |
| 58  | Task detail page                                       | [x]    | Real D1 data with comments                     |
| 59  | Search (by title)                                      | [x]    | Server-side search via like()                  |
| 60  | Filter (project, status, priority, assignee, deadline) | [x]    | Server-side; assignee via task_assignee        |
| 61  | Sort                                                   | [x]    | created / deadline / priority / updated        |
| 62  | Pagination                                             | [x]    | Server-side pagination                         |

---

## Phase 6: Dashboard

**Goal:** KPI cards, charts, workload, progress, deadlines.

| #   | Task                           | Status | Notes                                                |
| --- | ------------------------------ | ------ | ---------------------------------------------------- |
| 63  | KPI cards (server query)       | [x]    | Real D1 counts (projects, tasks, completed, overdue) |
| 64  | Project progress chart         | [x]    | Per-project % complete meters (top 6 by task count)  |
| 65  | Tasks by priority chart        | [x]    | Dynamic CSS bar chart with real data                 |
| 66  | Task status distribution chart | [x]    | Dynamic circle chart with real data                  |
| 67  | Team productivity chart        | [x]    | Recharts bars: tasks completed per day, last 14 days |
| 68  | Member workload section        | [x]    | Recharts stacked bars: open tasks per assignee by priority |
| 69  | Recent activities section      | [x]    | Real D1 data from activity table                     |
| 70  | Upcoming deadlines section     | [x]    | Real D1 data with task count per project             |
| 71  | High priority tasks section    | [x]    | Dashboard widgets: My Tasks + High Priority          |

---

## Phase 7: Collaboration

**Goal:** Comments, activity logs, notifications.

| #   | Task                               | Status | Notes                                                                       |
| --- | ---------------------------------- | ------ | --------------------------------------------------------------------------- |
| 72  | Add comment                        | [x]    | addTaskComment server function                                              |
| 73  | Edit comment                       | [x]    | updateTaskComment — author only; "(edited)" from updatedAt > createdAt     |
| 74  | Delete comment                     | [x]    | deleteTaskComment — author or project ADMIN/PM; ConfirmDialog              |
| 75  | Activity logging (server)          | [x]    | logActivity in src/lib/activity.ts (D1 only), project/task/invite mutations |
| 76  | Notification creation (server)     | [x]    | notifyUsers in src/lib/activity.ts (D1 only, skips actor, dedupes)          |
| 77  | Notification UI (bell, list, read) | [x]    | Real D1 data + mark read mutations                                          |
| 78  | Notifications page                 | [x]    | Real D1 data with mark-all-read                                             |

---

## Phase 8: Profile Photos (attachments removed)

**Goal:** Cloudinary for profile photos only. Task/project attachments were dropped from scope.

| #   | Task                          | Status | Notes                                        |
| --- | ----------------------------- | ------ | -------------------------------------------- |
| 79  | Cloudinary upload (profile)   | [x]    | REST API, worknest/avatars folder, SHA-1 sig |
| 80  | Image validation (MIME, size) | [x]    | JPEG/PNG/WebP/GIF, max 5MB                   |
| 81  | Remove attachments            | [x]    | Schema, relations, UI; migration 0003        |

---

## Phase 9: Project Chat

**Goal:** Real-time chat per project. One `ChatRoom` DO per project; messages in D1. Notifications and activities are NOT real-time (D1 + TanStack Query refetch); the old Notification/Activity DOs were removed.

| #   | Task                                    | Status | Notes                                            |
| --- | --------------------------------------- | ------ | ------------------------------------------------ |
| 97  | chat_message schema + migration         | [x]    | 0004_chat_message; index (project, created, id)  |
| 98  | getMessages server function             | [x]    | src/server-functions/chat.ts, keyset 30/page     |
| 99  | ChatRoom Durable Object                 | [x]    | src/chat/ChatRoom.ts, CHAT_ROOM binding (v3)     |
| 100 | Chat WebSocket route                    | [x]    | src/chat/upgrade.ts; session, Origin, membership |
| 101 | useChatRoom client hook                 | [x]    | src/hooks/use-chat-room.ts; backoff, cache merge |
| 102 | Messages page rebuild                   | [x]    | src/components/chat/*, messages.tsx rebuilt      |
| 103 | Verify (build, 2 sessions, permissions) | [x]    | Prod build via wrangler dev: handshake 401/403/404/426, 2-client protocol, pagination, removal (4003), reconnect |

---

## Phase 10: Polish

**Goal:** Theme, responsive design, accessibility, loading/error/empty states, performance.

| #   | Task                                   | Status | Notes                                      |
| --- | -------------------------------------- | ------ | ------------------------------------------ |
| 84  | styles.css updated (Tomorro Dark Neon) | [x]    | Full light + dark mode CSS variables       |
| 85  | Dark mode                              | [x]    | next-themes provider, .dark class          |
| 86  | Light mode                             | [x]    | :root variables defined                    |
| 87  | System preference mode                 | [x]    | next-themes with enableSystem              |
| 88  | Desktop layout                         | [x]    | Sidebar + header + mobile nav              |
| 89  | Tablet layout                          | [x]    | Icon-rail sidebar md–lg, narrower chat list |
| 90  | Mobile layout                          | [x]    | Bottom nav, stacked layouts                |
| 91  | Loading states (all pages)             | [x]    | LoadingState component wired to all pages  |
| 92  | Error states (all pages)               | [x]    | ErrorState component wired to detail pages |
| 93  | Empty states (all pages)               | [x]    | EmptyState component wired to list pages   |
| 94  | Confirmation dialogs                   | [x]    | ConfirmDialog on delete actions            |
| 95  | Accessibility audit                    | [x]    | AA text contrast tokens, labels, focus, hydration |
| 96  | Performance review                     | [x]    | Lazy Recharts chunk, staleTime 30s, index 0009 |

---

## Phase 11: Deployment

**Goal:** Production-ready on Cloudflare.

| #   | Task                        | Status | Notes                                        |
| --- | --------------------------- | ------ | -------------------------------------------- |
| 108 | Production D1 database      | [ ]    |                                              |
| 109 | Production Cloudinary       | [ ]    | Set CLOUDINARY_* secrets via wrangler        |
| 110 | Production Durable Objects  | [ ]    |                                              |
| 111 | Production secrets set      | [~]    | wrangler.jsonc secrets.list defined, not set |
| 112 | OAuth callback URLs updated | [~]    | BETTER_AUTH_URL=worknest.sadal.dev in vars   |
| 113 | Custom domain configured    | [x]    | worknest.sadal.dev in wrangler routes        |
| 114 | Build + deploy successful   | [ ]    |                                              |
| 115 | README written              | [ ]    |                                              |
| 116 | Demo credentials provided   | [ ]    |                                              |
| 117 | Final QA pass               | [ ]    |                                              |

---

## Additional Pages (Not in Original Tracker)

| Page          | Status | Notes                                                 |
| ------------- | ------ | ----------------------------------------------------- |
| Landing page  | [x]    | Hero, Features, HowItWorks, Testimonials, CTA, Footer |
| Members page  | [x]    | Real D1 data via TanStack Query                       |
| Settings page | [x]    | Profile (name/photo), theme toggle, account mgmt      |
| Messages page | [x]    | Rebuilt in Phase 9 (project chat)                     |

---

## Server Functions

| Function                 | Status | Notes                                                          |
| ------------------------ | ------ | -------------------------------------------------------------- |
| getSession               | [x]    | Auth session from cookie                                       |
| requireSession           | [x]    | Auth session or throw                                          |
| getProfile               | [x]    | Returns user + session from cookie                             |
| updateProfile            | [x]    | Updates name via auth.api.updateUser (refreshes cookie)        |
| uploadProfilePhoto       | [x]    | Cloudinary upload + auth.api.updateUser                        |
| deleteProfilePhoto       | [x]    | Cloudinary delete + auth.api.updateUser                        |
| listProjects             | [x]    | Paginated, searchable, filterable, with task counts            |
| getProject               | [x]    | With membership check + task count                             |
| createProject            | [x]    | Creates project + adds creator as ADMIN member                 |
| updateProject            | [x]    | Name, status, deadline updates with membership check           |
| deleteProject            | [x]    | Admin-only with membership check                               |
| addProjectMember         | [x]    | With membership check                                          |
| removeProjectMember      | [x]    | With membership check                                          |
| listTasks                | [x]    | Paginated, searchable, filterable, with project/assignee joins |
| getTask                  | [x]    | With project + assignee joins                                  |
| createTask               | [x]    | Creates task in project                                        |
| updateTask               | [x]    | Title, description, status, priority, assignee, deadline       |
| deleteTask               | [x]    | Deletes task                                                   |
| assignTask               | [x]    | Sets/clears assignee                                           |
| changeTaskStatus         | [x]    | Updates status + auto-sets completedAt                         |
| getTaskComments          | [x]    | Lists comments with author info                                |
| addTaskComment           | [x]    | Creates comment                                                |
| listMembers              | [x]    | Paginated, searchable, with role from userProfile              |
| listNotifications        | [x]    | Paginated, with unread count                                   |
| markNotificationRead     | [x]    | Marks single notification as read                              |
| markAllNotificationsRead | [x]    | Marks all user notifications as read                           |
| getDashboardData         | [x]    | KPIs, tasks by status/priority, activities, deadlines          |

---

## UI Components Library

| Component        | Status | Notes                                   |
| ---------------- | ------ | --------------------------------------- |
| button           | [x]    | shadcn + custom rounded-full variant    |
| card             | [x]    | shadcn                                  |
| input            | [x]    | shadcn                                  |
| badge            | [x]    | shadcn                                  |
| avatar           | [x]    | shadcn                                  |
| dialog           | [x]    | shadcn                                  |
| dropdown-menu    | [x]    | shadcn                                  |
| popover          | [x]    | shadcn                                  |
| tooltip          | [x]    | shadcn                                  |
| table            | [x]    | shadcn                                  |
| tabs             | [x]    | shadcn                                  |
| select           | [x]    | shadcn                                  |
| checkbox         | [x]    | shadcn                                  |
| radio-group      | [x]    | shadcn                                  |
| form             | [x]    | shadcn                                  |
| separator        | [x]    | shadcn                                  |
| sheet            | [x]    | shadcn                                  |
| sidebar          | [x]    | shadcn                                  |
| scroll-area      | [x]    | shadcn                                  |
| skeleton         | [x]    | shadcn                                  |
| label            | [x]    | shadcn                                  |
| StatusBadge      | [x]    | Custom — maps status to colored badge   |
| PriorityBadge    | [x]    | Custom — maps priority to colored badge |
| SearchInput      | [x]    | Custom — input with search icon         |
| Pagination       | [x]    | Custom — page controls                  |
| UserAvatar       | [x]    | Custom — initials + online status       |
| NotificationBell | [x]    | Custom — popover with notification list |
| FilterControls   | [x]    | Custom — filter UI                      |
| ConfirmDialog    | [x]    | Custom — confirmation modal             |
| LoadingState     | [x]    | Custom — table/cards/detail/list        |
| ErrorState       | [x]    | Custom — retry button                   |
| EmptyState       | [x]    | Custom — icon + action button           |
| ThemeToggle      | [x]    | Custom — dark/light toggle              |
| DataTable        | [x]    | Custom — wrapper for TanStack Table     |
| Field            | [x]    | Custom — form field wrapper             |

---

## Summary

| Phase              | Tasks   | Complete | In Progress | Not Started |
| ------------------ | ------- | -------- | ----------- | ----------- |
| 1. Infrastructure  | 9       | 9        | 0           | 0           |
| 2. Database Schema | 13      | 13       | 0           | 0           |
| 3. Authentication  | 12      | 12       | 0           | 0           |
| 4. Projects        | 13      | 13       | 0           | 0           |
| 5. Tasks           | 13      | 13       | 0           | 0           |
| 6. Dashboard       | 9       | 9        | 0           | 0           |
| 7. Collaboration   | 7       | 7        | 0           | 0           |
| 8. Profile Photos  | 3       | 3        | 0           | 0           |
| 9. Project Chat    | 7       | 7        | 0           | 0           |
| 10. Polish         | 13      | 13       | 0           | 0           |
| 11. Deployment     | 10      | 1        | 2           | 7           |
| **Total**          | **109** | **100**  | **2**       | **7**       |

Phase 2 excludes the n/a attachment row.

---

## Current Phase

**Master plan (F0–F8):** finish every in-scope unimplemented item. Deployment (tasks 108–114, 117) is out of scope for now.

### Feature order

1. F0: Tracker housekeeping
2. F1: Shared auth + RBAC middleware (task 33)
3. F2: Project sort (task 47)
4. F3: Comment edit/delete (tasks 73, 74)
5. F4: Email/password behind `ENABLE_EMAIL_PASSWORD` (task 26)
6. F5: Dashboard charts: progress, productivity, workload (tasks 64, 67, 68)
7. F6: Chat verification (task 103)
8. F7: Polish: tablet, a11y, perf (tasks 89, 95, 96)
9. F8: Seed data, demo login, README (tasks 115, 116)
