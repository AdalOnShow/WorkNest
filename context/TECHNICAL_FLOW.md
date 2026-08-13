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
Upload Attachment      |   Y   |        Y        |     Y
Delete Attachment      |   Y   |     Owner Only  |  Owner Only
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
    Drizzle Delete (ChatMessage) <-- cascade or manual
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
    |      Create Notification (TASK_ASSIGNED)
    |      Broadcast via WebSocket (TASK_ASSIGNED)
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
    |      Create Notification (TASK_STATUS_UPDATED)
    |      Broadcast via WebSocket (TASK_UPDATED)
    +--> If assignee changed:
    |      Create Notification (TASK_ASSIGNED)
    |      Broadcast via WebSocket (TASK_ASSIGNED)
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
    Drizzle Delete (Attachment) <-- cascade
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

## 7. File Attachments Flow

### Upload Attachment

```text
Client Select File
    |
    v
Client Validation:
    - Is image? (MIME check)
    - Size <= 2MB?
    |
    +-- Invalid --> Show error, stop
    |
    v
TanStack Mutation (FormData)
    |
    v
Server Function
    |
    +--> Validate Session
    +--> Check Project Membership
    +--> Re-validate MIME type
    +--> Re-validate file size
    |
    v
Upload to Cloudflare R2
    |
    +-- Upload failed --> Return error
    |
    v
Generate object key (unique)
    |
    v
Drizzle Insert (Attachment)
    |
    v
Return Attachment metadata
    |
    v
Invalidate useAttachmentsQuery(taskId)
    |
    v
Show in UI
```

### Delete Attachment

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
    +--> Check (Uploader OR ADMIN/PROJECT_MANAGER)
    |
    v
Drizzle Delete (Attachment metadata)
    |
    v
Delete from R2 (object key)
    |
    v
Invalidate useAttachmentsQuery
    |
    v
Remove from UI
```

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
Drizzle Insert (Notification)
    |
    v
WebSocket Broadcast (NOTIFICATION_CREATED)
    |
    +--> If recipient online:
    |      Real-time update to notification bell
    +--> If recipient offline:
    |      Persisted for next login
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

## 9. Real-Time Messaging Flow

### WebSocket Connection

```text
Client Opens Chat
    |
    v
Connect to Durable Object WebSocket
    |
    v
Durable Object Validates:
    1. Session cookie valid
    2. User identified
    3. Project ID provided
    4. User is project member
    |
    +-- Invalid --> Close connection
    |
    v
Connection Accepted
    |
    +--> Register user in room state
    +--> Broadcast USER_JOINED to others
    +--> Set user online status
    +--> Send current online users list
```

### Send Message

```text
Client Types Message + Enter
    |
    v
WebSocket Send (MESSAGE_CREATED)
    |
    v
Durable Object Receives
    |
    +--> Validate sender is connected & member
    |
    v
Drizzle Insert (ChatMessage) --> D1
    |
    v
Broadcast MESSAGE_CREATED to all connected room members
    |
    v
All clients receive message
```

### Typing Indicators

```text
Client Starts Typing
    |
    v
WebSocket Send (TYPING_STARTED)
    |
    v
Durable Object Broadcasts to others
    |
    v
Other clients show "User is typing..."
    |
    v
Client Stops Typing (debounce 2s)
    |
    v
WebSocket Send (TYPING_STOPPED)
    |
    v
Durable Object Broadcasts
    |
    v
Other clients hide typing indicator
```

### Online/Offline Presence

```text
User Connects
    |
    v
Durable Object:
    - Set status: ONLINE
    - Set lastSeen: NOW
    - Broadcast USER_ONLINE
    |
    v
Other clients update presence list
    |
    |
    +--- When user disconnects:
    |
    v
Durable Object:
    - Set status: OFFLINE
    - Set lastSeen: NOW
    - Broadcast USER_OFFLINE
    - Broadcast lastSeen timestamp
    |
    v
Other clients show "Offline 2 hours ago" (relative time)
```

### Load Chat History

```text
Client Opens Chat
    |
    v
useChatMessagesQuery(projectId, { limit: 50, before: timestamp })
    |
    v
Server Function
    |
    +--> Validate Session + Membership
    +--> Drizzle Query (ChatMessage)
    |      WHERE projectId = ?
    |      AND createdAt < before (if provided)
    |      ORDER BY createdAt DESC
    |      LIMIT 50
    |
    v
Return messages (newest first)
    |
    v
Render in chronological order
    |
    v
Scroll to bottom (newest)
    |
    v
On scroll up --> load older messages (infinite scroll)
```

---

## 10. Theme Flow

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

## 11. Responsive Design Flow

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
    [Dashboard] [Projects] [Tasks] [Chat] [Profile]
    |
    v
Or Hamburger Menu:
    |
    v
Slide-out drawer with full navigation
```

---

## 12. Search, Filter, Sort Flow

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

## 13. Pagination Flow

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

### Chat Pagination (Infinite Scroll)

```text
Initial Load:
    useChatMessagesQuery(projectId, { limit: 50 })
    |
    v
Load 50 most recent messages
    |
    v
User Scrolls to Top
    |
    v
Trigger: loadOlderMessages(before: oldestMessage.createdAt)
    |
    v
Server returns 50 older messages
    |
    v
Prepend to list (maintain scroll position)
    |
    v
Repeat until no older messages
```

---

## 14. Error Handling Flow

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

## 15. State Management Flow

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
│   useChatMessagesQuery(projectId)                    │
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
│   useUploadAttachment / useDeleteAttachment          │
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
│   - Chat input text                                 │
│   - Search input (before debounce)                  │
│   - Sidebar collapsed state                         │
│   - Theme preference                                │
└─────────────────────────────────────────────────────┘
```

### Real-Time Client State

```text
┌─────────────────────────────────────────────────────┐
│          WebSocket / Real-Time State                 │
├─────────────────────────────────────────────────────┤
│ Manages:                                             │
│   - WebSocket connection status                     │
│   - Connected users list                            │
│   - Typing users map                                │
│   - Online/offline presence                         │
│   - Last seen timestamps                            │
│   - Real-time message buffer                        │
│                                                      │
│ Implementation:                                      │
│   - React state in chat context                     │
│   - Or small dedicated store if complexity grows    │
│   - NO Zustand unless genuinely needed              │
└─────────────────────────────────────────────────────┘
```

---

## 16. Data Flow Summary

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

### Real-Time Data Flow

```text
┌──────────┐    WebSocket    ┌─────────────────┐
│  Client  │<───────────────>│ Durable Object   │
│  (React) │                 │ (WebSocket Room) │
└──────────┘                 └─────────────────┘
     │                              │
     │                              ├── Persist to D1
     │                              │
     │                              ├── Broadcast to room
     │                              │
     │                              ├── Update presence
     │                              │
     │                              └── Typing indicators
     │
     v
┌──────────────────┐
│ TanStack Query   │
│ Cache Invalidation│
│ (real-time events)│
└──────────────────┘
     │
     v
┌──────────────────┐
│ UI Updates       │
│ (messages,       │
│  notifications,  │
│  presence)       │
└──────────────────┘
```

---

## 17. Feature Interaction Map

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
       │  (CRUD)     │  │  (KPIs)   │  │  (Real-time)  │
       └──────┬──────┘  └───────────┘  └──────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    v         v         v
┌───────┐ ┌───────┐ ┌────────┐
│ Tasks │ │Members│ │  Chat  │
│ (CRUD)│ │ (RBAC)│ │(DO+WS) │
└───┬───┘ └───────┘ └────────┘
    │
    ├──> Comments
    │
    └──> Attachments (R2)
```

---

## 18. Security Enforcement Points

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

WebSocket Connection:
    │
    ├── 1. Validate Session
    │
    ├── 2. Identify User
    │
    ├── 3. Identify Project
    │
    ├── 4. Verify Membership
    │
    └── 5. Accept or Reject

File Upload:
    │
    ├── 1. Validate Session
    │
    ├── 2. Check Membership
    │
    ├── 3. Validate MIME type
    │
    ├── 4. Validate file size
    │
    ├── 5. Upload to R2
    │
    └── 6. Store metadata in D1
```
