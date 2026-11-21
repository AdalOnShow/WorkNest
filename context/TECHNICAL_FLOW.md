# WorkNest Technical Flow

## 1. Authentication Flow

### Primary Authentication (Default)

```text
Login Page
    |
    v
+-------------------+-------------------+
|                   |                   |
v                   v                   |
[Google OAuth]   [GitHub OAuth]         |
|                   |                   |
+-------------------+-------------------+
                    |
                    v
            Better Auth
                    |
                    v
            Session Created
                    |
                    v
            HTTP-only Cookie
                    |
                    v
            Redirect to Dashboard
```

### Secondary Authentication (Hidden by Default)

```text
Login Page
    |
    v
[Use email instead] <-- Toggle link
    |
    v
+-------------------+
| Email + Password  |
| Form (hidden)     |
+-------------------+
    |
    v
Better Auth
    |
    v
Session + Cookie
    |
    v
Redirect to Dashboard
```

### Registration Flow

```text
Signup Page
    |
    v
+-------------------+-------------------+
|                   |                   |
v                   v                   |
[Google OAuth]   [GitHub OAuth]         |
|                   |                   |
+-------------------+-------------------+
                    |
                    v
            Turnstile Verification
                    |
                    v
            Better Auth
                    |
                    v
            User Created (D1)
                    |
                    v
            Session + Cookie
                    |
                    v
            Redirect to Dashboard
```

### Session Validation (Every Protected Operation)

```text
Request
    |
    v
Extract Cookie
    |
    v
Better Auth Session Check
    |
    +-- Invalid/Expired --> Return UNAUTHORIZED
    |
    v
Identify User (from session)
    |
    v
Proceed to Authorization
```

---

## 2. Authorization Flow

### Role-Based Access Control

```text
Validated Request
    |
    v
Get User Role (from DB, not client)
    |
    v
+----------+----------+-------------+
|          |          |             |
v          v          v             |
ADMIN   PROJECT_   TEAM_          |
        MANAGER   MEMBER          |
|          |          |             |
v          v          v             |
Full     Project    Limited        |
Access   Scope      Scope          |
```

### Permission Matrix

```text
Operation              | ADMIN | PROJECT_MANAGER | TEAM_MEMBER
-----------------------|-------|-----------------|-------------
Create Project         |   Y   |        Y        |     N
Update Any Project     |   Y   |        N        |     N
Update Owned Project   |   Y   |        Y        |     N
Delete Project         |   Y   |     Owner Only  |     N
Add Members            |   Y   |        Y        |     N
Remove Members         |   Y   |        Y        |     N
Create Task            |   Y   |        Y        |     N
Update Any Task        |   Y   |        Y        |     N
Update Assigned Task   |   Y   |        Y        |     Y
Delete Task            |   Y   |        Y        |     N
Add Comment            |   Y   |        Y        |     Y
Edit Own Comment       |   Y   |        Y        |     Y
Delete Comment         |   Y   |     Owner Only  |  Owner Only
Send Chat Message      |   Y   |        Y        |     Y   (project members)
Delete Chat Message    |   Y   |     Own Only    |  Own Only
View Dashboard         |   Y   |        Y        |     Y
View Analytics         |   Y   |        Y        |     N
Manage Users           |   Y   |        N        |     N
```

### Resource Access Check

```text
User requests resource
    |
    v
Extract resource ID
    |
    v
Query ownership/membership from D1
    |
    +-- Not member/owner --> Return FORBIDDEN
    |
    v
Check role permission
    |
    +-- Insufficient role --> Return FORBIDDEN
    |
    v
Proceed with operation
```

---

## 3. Project Management Flow

### Create Project

```text
Client Form Submit
    |
    v
TanStack Mutation
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check Role (ADMIN or PROJECT_MANAGER)
    +--> Validate Input (Zod)
    +--> Check Duplicate Name (optional)
    |
    v
Drizzle Insert (Project)
    |
    v
Drizzle Insert (ProjectMember) <-- auto-add creator as PROJECT_MANAGER
    |
    v
Return Project
    |
    v
Invalidate useProjectsQuery
    |
    v
Update UI
```

### Update Project

```text
Client Edit Submit
    |
    v
TanStack Mutation
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check Role (ADMIN or project PROJECT_MANAGER)
    +--> Validate Input (Zod)
    |
    v
Drizzle Update (Project)
    |
    v
Return Updated Project
    |
    v
Invalidate useProjectQuery + useProjectsQuery
    |
    v
Update UI
```

### Delete Project

```text
Client Confirm Delete
    |
    v
TanStack Mutation
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check Role (ADMIN or project creator)
    +--> Confirm Match
    |
    v
Drizzle Delete (ProjectMember) <-- cascade or manual
    Drizzle Delete (Task)       <-- cascade or manual
    Drizzle Delete (Project)
    |
    v
Invalidate Queries
    |
    v
Redirect to Projects List
```

### Project List (Search/Filter/Sort/Paginate)

```text
Client Page Load
    |
    v
useProjectsQuery({ page, search, status, sort })
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Get user's project IDs (membership check)
    +--> Build Drizzle Query
    |      WHERE name LIKE %search%
    |      AND status = filter
    |      AND id IN (user's projects)
    |      ORDER BY sort
    |      LIMIT offset, count
    +--> Count total for pagination
    |
    v
Return { projects, total, page, pageSize }
    |
    v
TanStack Table renders
```

---

## 4. Task Management Flow

### Create Task

```text
Client Form Submit
    |
    v
TanStack Mutation
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check Project Membership
    +--> Check Role (ADMIN or PROJECT_MANAGER)
    +--> Validate Input (Zod)
    +--> Check Duplicate Title within Project
    +--> Validate Deadline (not past)
    |
    v
Drizzle Insert (Task)
    |
    +--> If assignee provided:
    |      notifyUsers (TASK_ASSIGNED, D1 only)
    |
    v
Return Task
    |
    v
Invalidate useTasksQuery
    |
    v
Update UI
```

### Update Task

```text
Client Edit Submit
    |
    v
TanStack Mutation
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check Project Membership
    +--> Check Role Permission
    +--> Validate Input (Zod)
    +--> If reassigning:
    |      Check task not COMPLETED
    +--> If changing status to COMPLETED:
    |      Set completedAt timestamp
    |
    v
Drizzle Update (Task)
    |
    +--> If status changed:
    |      notifyUsers (TASK_STATUS_UPDATED, D1 only)
    +--> If assignee changed:
    |      notifyUsers (TASK_ASSIGNED, D1 only)
    |
    v
Return Task
    |
    v
Invalidate Queries
    |
    v
Update UI
```

### Delete Task

```text
Client Confirm Delete
    |
    v
TanStack Mutation
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check Role (ADMIN or PROJECT_MANAGER)
    |
    v
Drizzle Delete (Comment)    <-- cascade
    Drizzle Delete (Task)
    |
    v
Invalidate Queries
    |
    v
Update UI
```

### Task List (Search/Filter/Sort/Paginate)

```text
Client Page Load
    |
    v
useTasksQuery({ page, search, projectId, status, priority, assignee, deadline, sort })
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Get user's project IDs
    +--> Build Drizzle Query
    |      WHERE (title LIKE %search% OR description LIKE %search%)
    |      AND projectId IN (user's projects)
    |      AND status = filter
    |      AND priority = filter
    |      AND assigneeId = filter
    |      AND dueDate conditions
    |      ORDER BY sort
    |      LIMIT offset, count
    +--> Count total
    |
    v
Return { tasks, total, page, pageSize }
    |
    v
TanStack Table renders
```

---

## 5. Dashboard Flow

### Dashboard Data Loading

```text
Dashboard Page Load
    |
    v
Parallel Queries:
    |
    +--> useDashboardKPIs()
    |      Server queries D1:
    |      - COUNT projects WHERE user is member
    |      - COUNT tasks WHERE project in user's projects
    |      - COUNT completed tasks
    |      - COUNT pending tasks (TODO + IN_PROGRESS)
    |      - COUNT overdue tasks (dueDate < NOW AND status != COMPLETED)
    |
    +--> useProjectProgress()
    |      Server queries D1:
    |      - Per project: completed / total tasks
    |
    +--> useTasksByPriority()
    |      Server queries D1:
    |      - GROUP BY priority, COUNT
    |
    +--> useTaskStatusDistribution()
    |      Server queries D1:
    |      - GROUP BY status, COUNT
    |
    +--> useTeamProductivity()
    |      Server queries D1:
    |      - Per member: tasks completed this week/month
    |
    +--> useMemberWorkload()
    |      Server queries D1:
    |      - Per member: assigned active tasks count
    |
    +--> useRecentNotifications()
    |      Server queries D1:
    |      - Latest 10 notifications for user
    |
    +--> useUpcomingDeadlines()
    |      Server queries D1:
    |      - Tasks WHERE dueDate > NOW AND status != COMPLETED
    |      - ORDER BY dueDate ASC LIMIT 5
    |
    +--> useHighPriorityTasks()
    |      Server queries D1:
    |      - Tasks WHERE priority = HIGH AND status != COMPLETED
    |      - LIMIT 5
    |
    v
All queries resolve
    |
    v
Dashboard renders with KPI cards + charts (Recharts)
```

---

## 6. Comments Flow

### Add Comment

```text
Client Submit (Cmd/Ctrl + Enter)
    |
    v
TanStack Mutation
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check Project Membership
    +--> Validate Input (Zod)
    |
    v
Drizzle Insert (Comment)
    |
    v
Return Comment
    |
    v
Invalidate useCommentsQuery(taskId)
    |
    v
Append to UI list (chronological)
```

### Edit Comment

```text
Client Edit Submit
    |
    v
TanStack Mutation
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check Comment Author (match user ID)
    +--> Validate Input (Zod)
    |
    v
Drizzle Update (Comment) -- set updatedAt
    |
    v
Return Comment
    |
    v
Invalidate useCommentsQuery
    |
    v
Update UI
```

### Delete Comment

```text
Client Confirm Delete
    |
    v
TanStack Mutation
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check (Comment Author OR ADMIN/PROJECT_MANAGER)
    |
    v
Drizzle Delete (Comment)
    |
    v
Invalidate useCommentsQuery
    |
    v
Remove from UI
```

---

## 7. Project Chat Flow

Attachments were removed. Chat is per project; there are no DMs.

### Load History

```text
Messages page (project selected)
    |
    v
useInfiniteQuery(['chat', projectId])
    |
    v
Server Function getMessages(projectId, cursor, limit = 30)
    |
    +--> Validate Session
    +--> Verify Project Membership
    |
    v
Drizzle Select (chat_message) keyset on (createdAt, id) DESC
    |
    v
Return { items, nextCursor }      <-- never wakes the Durable Object
```

### Connect

```text
Client WebSocket -> /api/chat/$projectId/ws
    |
    +--> Require Upgrade: websocket
    +--> Validate Better Auth session
    +--> Verify project membership
    |
    v
Forward to ChatRoom DO (idFromName(projectId)) with verified user headers
    |
    v
acceptWebSocket (hibernation) + serializeAttachment {userId, name, image}
    |
    v
Send PRESENCE_SNAPSHOT; broadcast USER_ONLINE if first socket for that user
```

### Send / Delete / Typing

```text
SEND    -> Zod (1-2000 chars) -> rate limit -> insert into D1 -> broadcast MESSAGE_CREATED
DELETE  -> author or project ADMIN -> delete in D1 -> broadcast MESSAGE_DELETED
TYPING  -> broadcast only (client throttles to ~3s), never stored
close   -> broadcast USER_OFFLINE if it was the user's last socket
```

Client merges MESSAGE_CREATED / MESSAGE_DELETED into the infinite query cache.

---

## 8. Notifications Flow

### Notification Creation (Server-Side)

```text
Trigger Event (task assigned, status changed, etc.)
    |
    v
Server Function
    |
    +--> Determine notification type
    +--> Determine recipient(s)
    +--> Build title + message
    |
    v
notifyUsers() in src/lib/activity.ts
    |
    +--> Drop actor + duplicate recipients
    |
    v
Drizzle Insert (Notification rows)       <-- errors logged, never thrown
    |
    v
Client picks it up on next TanStack Query refetch
(window focus / mutation invalidation). No WebSocket push.
```

### Notification UI

```text
Notification Bell
    |
    v
useNotificationsQuery({ unreadOnly: true })
    |
    v
Display badge count (unread)
    |
    v
Click Bell
    |
    v
Notification Dropdown:
    - Latest 20 notifications
    - Unread highlighted
    - Click notification --> navigate to reference
    - "Mark as read" button
    - "Mark all as read" button
    |
    v
Dedicated /notifications page:
    - Full paginated list
    - Filter by type
    - Search
```

### Mark as Read

```text
Client Click "Mark as read"
    |
    v
TanStack Mutation
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check Notification Recipient
    |
    v
Drizzle Update (Notification) -- set readAt
    |
    v
Invalidate useNotificationsQuery
    |
    v
Update UI (badge count decreases)
```

---

## 9. Theme Flow

### Theme Selection

```text
User Clicks Theme Toggle
    |
    v
Options: Light | Dark | System
    |
    v
Apply Theme:
    - Light: class="light" on <html>
    - Dark: class="dark" on <html>
    - System: matchMedia prefers-color-scheme
    |
    v
Persist to localStorage
    |
    v
Tailwind CSS applies dark: variants
```

### Theme on Page Load

```text
Page Load
    |
    v
Read localStorage theme preference
    |
    +-- No preference --> Default to System
    |
    v
Apply class to <html> before render
    |
    v
No flash of wrong theme
```

---

## 10. Responsive Design Flow

### Layout Breakpoints

```text
Desktop (>= 1024px)
    |
    +--> Full sidebar visible
    +--> Content area with padding
    +--> Multi-column layouts
    |
Tablet (768px - 1023px)
    |
    +--> Collapsed sidebar (icons only)
    +--> Content area adapts
    +--> Cards stack vertically
    |
Mobile (< 768px)
    |
    +--> Sidebar hidden (hamburger menu)
    +--> Bottom nav or slide-out drawer
    +--> Single column layout
    +--> Touch-friendly tap targets (min 44px)
```

### Mobile Navigation

```text
Mobile View
    |
    v
Bottom Navigation Bar:
    [Dashboard] [Projects] [Tasks] [Profile]
    |
    v
Or Hamburger Menu:
    |
    v
Slide-out drawer with full navigation
```

---

## 11. Search, Filter, Sort Flow

### Client-Side State

```text
User Types in Search / Selects Filter / Clicks Sort
    |
    v
Update URL Search Params (debounced for search)
    |
    v
TanStack Query reads params
    |
    v
Triggers re-fetch with new filters
```

### Server-Side Execution

```text
Server Function Receives: { search, filters, sort, page, pageSize }
    |
    v
Build Drizzle Query:
    |
    +--> WHERE clauses based on filters
    +--> LIKE clauses for search
    +--> ORDER BY based on sort
    +--> LIMIT/OFFSET for pagination
    +--> Separate COUNT query for total
    |
    v
Return { data, total, page, pageSize, totalPages }
```

---

## 12. Pagination Flow

### Server-Side Pagination

```text
Client Page Change (click page number or arrow)
    |
    v
Update page state + URL params
    |
    v
useXxxQuery({ page, pageSize, ...filters })
    |
    v
Server Function:
    |
    +--> Drizzle Query with LIMIT/OFFSET
    +--> COUNT total matching rows
    |
    v
Return { items, total, page, pageSize }
    |
    v
TanStack Table renders page
    |
    v
Pagination component shows:
    - Current page / total pages
    - Previous / Next buttons
    - Page numbers
```

---

## 13. Error Handling Flow

### Server-Side Error Categories

```text
Error Occurs
    |
    v
Categorize:
    |
    +--> UNAUTHORIZED (401) -- not logged in
    +--> FORBIDDEN (403) -- logged in but no permission
    +--> NOT_FOUND (404) -- resource doesn't exist
    +--> VALIDATION_ERROR (400) -- bad input
    +--> CONFLICT (409) -- duplicate, constraint violation
    +--> RATE_LIMITED (429) -- too many requests
    +--> INTERNAL_ERROR (500) -- unexpected server error
    |
    v
Return structured error response:
    { error: true, code: "VALIDATION_ERROR", message: "..." }
    |
    v
Never expose:
    - Stack traces
    - Raw DB errors
    - Secrets
    - Internal paths
```

### Client-Side Error Display

```text
Query/Mutation Error
    |
    v
TanStack Query error state
    |
    v
UI shows appropriate state:
    |
    +--> 401 --> Redirect to login
    +--> 403 --> "You don't have access" message
    +--> 404 --> "Not found" page
    +--> 400 --> Inline validation messages
    +--> 500 --> "Something went wrong" + retry button
    |
    v
Toast notification for transient errors
```

---

## 14. State Management Flow

### Server State (TanStack Query)

```text
┌─────────────────────────────────────────────────────┐
│                  TanStack Query                      │
├─────────────────────────────────────────────────────┤
│ Queries:                                             │
│   useProjectsQuery(filters)                          │
│   useProjectQuery(projectId)                         │
│   useTasksQuery(filters)                             │
│   useTaskQuery(taskId)                               │
│   useMembersQuery(projectId)                         │
│   useCommentsQuery(taskId)                           │
│   useNotificationsQuery(filters)                     │
│   useDashboardKPIs()                                 │
│   useProjectProgress()                               │
│   useTasksByPriority()                               │
│   useTaskStatusDistribution()                        │
│   useTeamProductivity()                              │
│   useMemberWorkload()                                │
│   useUpcomingDeadlines()                             │
│   useHighPriorityTasks()                             │
│                                                      │
│ Mutations:                                           │
│   useCreateProject / useUpdateProject / useDeleteProject
│   useCreateTask / useUpdateTask / useDeleteTask      │
│   useAddMember / useRemoveMember                     │
│   useCreateComment / useUpdateComment / useDeleteComment
│   useSendChatMessage (via WebSocket)                 │
│   useMarkNotificationRead                            │
│                                                      │
│ Strategy:                                            │
│   - Query key includes filters/pagination            │
│   - Invalidate relevant queries on mutation success  │
│   - Use select for derived data                      │
│   - staleTime: 30s default                          │
│   - gcTime: 5 minutes                               │
└─────────────────────────────────────────────────────┘
```

### Authentication State (Better Auth)

```text
┌─────────────────────────────────────────────────────┐
│                Better Auth Session                   │
├─────────────────────────────────────────────────────┤
│ Source of truth for:                                 │
│   - Is user authenticated?                           │
│   - Current user ID                                 │
│   - User name, email, avatar                        │
│   - User role                                       │
│                                                      │
│ Client hooks:                                        │
│   useSession() -- get current session               │
│   useUser() -- get current user                     │
│                                                      │
│ Rules:                                               │
│   - NEVER duplicate to Zustand                      │
│   - Server validates independently                  │
│   - No localStorage for tokens                     │
└─────────────────────────────────────────────────────┘
```

### Local UI State (React)

```text
┌─────────────────────────────────────────────────────┐
│               React Component State                  │
├─────────────────────────────────────────────────────┤
│ Manages:                                             │
│   - Modal open/close                                │
│   - Dropdown open/close                             │
│   - Active tab                                      │
│   - Form input values                               │
│   - File preview state                              │
│   - Search input (before debounce)                  │
│   - Sidebar collapsed state                         │
│   - Theme preference                                │
└─────────────────────────────────────────────────────┘
```

### Real-Time Client State

```text
┌─────────────────────────────────────────────────────┐
│          Chat Real-Time State                        │
├─────────────────────────────────────────────────────┤
│ Manages:                                             │
│   - Chat WebSocket connection status                │
│   - Online members in the open chat room            │
│   - Typing indicators                               │
│                                                      │
│ Implementation:                                      │
│   - React state or small dedicated store            │
│   - NO Zustand unless genuinely needed              │
└─────────────────────────────────────────────────────┘
```

---

## 15. Data Flow Summary

### Complete Request Lifecycle

```text
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Browser  │───>│  React   │───>│TanStack  │───>│ Server   │
│  (UI)     │    │  State   │    │ Query    │    │ Function │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                       │
                                                       v
                                               ┌──────────────┐
                                               │ Authorization │
                                               │ (Session +    │
                                               │  Role Check)  │
                                               └──────────────┘
                                                       │
                                                       v
                                               ┌──────────────┐
                                               │ Validation    │
                                               │ (Zod)         │
                                               └──────────────┘
                                                       │
                                                       v
                                               ┌──────────────┐
                                               │ Drizzle ORM   │
                                               └──────────────┘
                                                       │
                                                       v
                                               ┌──────────────┐
                                               │ Cloudflare D1 │
                                               └──────────────┘
                                                       │
                                                       v
                                               ┌──────────────┐
                                               │ Response      │
                                               │ (Typed)       │
                                               └──────────────┘
                                                       │
                                                       v
                                               ┌──────────────┐
                                               │ TanStack Query│
                                               │ Cache Update  │
                                               └──────────────┘
                                                       │
                                                       v
                                               ┌──────────────┐
                                               │ React Re-render│
                                               └──────────────┘
```

### Real-Time Data Flow (Project Chat only)

```text
┌──────────┐   WebSocket    ┌──────────────────┐   insert/delete   ┌────┐
│  Client  │<──────────────>│ ChatRoom DO       │──────────────────>│ D1 │
│  (React) │                │ (1 per project)   │                   └────┘
└────┬─────┘                └──────────────────┘                      ^
     │  MESSAGE_CREATED / MESSAGE_DELETED / presence / typing         │
     v                                                                │
┌───────────────────────┐     history (keyset, 30/page)               │
│ Infinite Query cache  │<──── getMessages server function ───────────┘
└───────────────────────┘
```

Notifications and activities are not real-time: they are D1 rows read through TanStack Query.

---

## 16. Feature Interaction Map

```text
                        ┌─────────────┐
                        │     Auth     │
                        │  (Better     │
                        │   Auth)      │
                        └──────┬──────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              v                v                v
       ┌─────────────┐  ┌───────────┐  ┌──────────────┐
       │  Projects   │  │ Dashboard │  │ Notifications │
       │  (CRUD)     │  │  (KPIs)   │  │  (D1 + Query) │
       └──────┬──────┘  └───────────┘  └──────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    v         v         v
┌───────┐ ┌───────┐ ┌────────────┐
│ Tasks │ │Members│ │ Activities │
│ (CRUD)│ │ (RBAC)│ │    (D1)    │
└───┬───┘ └───────┘ └────────────┘
    │
    └──> Comments

Projects ──> Chat (ChatRoom DO + D1)
```

---

## 17. Security Enforcement Points

```text
Every Server Function:
    │
    ├── 1. Validate Session (Better Auth)
    │
    ├── 2. Identify User (from session, not client)
    │
    ├── 3. Check Role (from DB, not client)
    │
    ├── 4. Check Resource Ownership/Membership
    │
    ├── 5. Validate Input (Zod)
    │
    ├── 6. Apply Rate Limiting (sensitive ops)
    │
    └── 7. Execute Operation

Chat WebSocket Connection:
    │
    ├── 1. Validate Session
    │
    ├── 2. Identify User
    │
    ├── 3. Identify Project
    │
    ├── 4. Verify Membership
    │
    └── 5. Forward to ChatRoom DO with verified user headers

Profile Photo Upload (only upload in the app):
    │
    ├── 1. Validate Session
    │
    ├── 2. Validate MIME type + size
    │
    └── 3. Upload to Cloudinary, store URL on user.image
```
