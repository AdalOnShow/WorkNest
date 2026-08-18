# WorkNest Project Overview

## 1. Project Identity

**Project Name:** WorkNest

**Project Type:** Full-stack, serverless project and task collaboration platform

**Purpose:** WorkNest is a modern team collaboration and project management application that helps teams manage projects, tasks, members, workloads, communication, productivity, and work progress from a single platform.

This is a Programming Hero Elite Alumni Pool 4.0 assessment project, but it should be developed with production-oriented architecture and practices.

---

## 2. Core Product Goal

WorkNest should allow teams to:

- Create and manage projects
- Add and manage project members
- Create, assign, update, and track tasks
- Track project progress and team workloads
- Search, filter, sort, and paginate data
- View productivity analytics
- Track recent activities
- Add comments to tasks
- Upload task attachments
- Receive notifications
- Use the application on desktop, tablet, and mobile
- Use light and dark themes

Security and permissions must be enforced on the server, not only in the UI.

---

## 3. Architectural Decision

WorkNest is a **fully serverless, Cloudflare-native application**.

There is no traditional standalone backend server.

Do NOT introduce:

- Express.js
- Hono as a separate backend
- Prisma ORM
- PostgreSQL
- MongoDB
- Cloudinary
- Socket.io
- Firebase

Architecture:

```text
Browser
   |
   v
TanStack Start
   |
   +-----------------------+
   |                       |
   v                       v
Server Functions       Server Routes
   |
   v
Cloudflare Workers
   |
   +-------------------+-------------------+
   |                   |                   |
   v                   v                   v
Drizzle + D1          R2            Durable Objects
Database              Files         Real-time
                                      WebSockets
```

---

## 4. Final Technology Stack

### Application

- TanStack Start
- React
- TanStack Router
- TypeScript

### Server State

- TanStack Query

### Database

- Cloudflare D1
- Drizzle ORM
- Drizzle Kit

### Authentication

- Better Auth
- Email + Password
- Google OAuth
- Secure HTTP-only cookies
- Server-side sessions

### Storage

- Cloudflare R2

### Real-Time

- Cloudflare Durable Objects
- WebSockets
- WebSocket Hibernation

### Validation

- Zod

### UI

- Tailwind CSS
- shadcn/ui
- Magic UI
- Lucide React

### Tables

- TanStack Table

### Charts

- Recharts

### Security

- Cloudflare Turnstile
- Server-side authorization
- Secure cookies
- Input validation
- Appropriate rate limiting

### Runtime / Deployment

- Cloudflare Workers
- Wrangler

---

## 5. Current Infrastructure Status

The initial TanStack Start project has already been created using the Cloudflare deployment option.

Wrangler is configured for the project.

A Cloudflare D1 database has already been created.

Next infrastructure tasks:

1. Configure the D1 binding in Wrangler.
2. Configure Drizzle ORM.
3. Design the complete D1 schema.
4. Create and apply migrations.
5. Configure Better Auth.
6. Configure Google OAuth.
7. Configure Cloudflare R2.
8. Configure Durable Objects.
9. Configure WebSocket real-time communication.
10. Build application features.
11. Deploy to Cloudflare Workers.
12. Configure production secrets and domain.

Do not recreate the existing D1 database unless there is a clear technical reason.

---

## 6. Repository Philosophy

WorkNest is one full-stack TanStack Start application. There should not be separate frontend/backend applications.

Target structure:

```text
worknest/
├── src/
├── migrations/
├── public/
├── tests/
├── drizzle.config.ts
├── wrangler.jsonc
├── package.json
├── tsconfig.json
├── vite.config.ts
├── AGENTS.md
├── PROJECT_OVERVIEW.md
└── README.md
```

The exact generated files may differ according to the installed TanStack Start version. Do not blindly replace generated configuration files.

---

## 7. Feature Domains

Main domains:

```text
auth
users
projects
members
tasks
comments
attachments
notifications
activities
dashboard
```

Each feature should own its relevant components, hooks, queries, mutations, schemas, types, and utilities where practical.

Server-only logic must remain server-side.

---

## 8. User Roles

### ADMIN

Full system access.

Can:

- Manage users
- Manage projects
- Manage project members
- Manage tasks
- View system-wide analytics
- View activity logs
- Manage system settings where implemented

### PROJECT_MANAGER

Project and team management.

Can:

- Create projects
- Update managed projects
- Delete projects according to permission rules
- Add/remove project members
- Create/update/delete tasks
- Assign tasks
- Manage project workflow
- View project analytics
- Manage project collaboration

### TEAM_MEMBER

Limited project participation.

Can:

- View projects they belong to
- View assigned tasks
- Update assigned task status
- Add comments where permitted
- Upload permitted attachments
- View relevant project activity

Role permissions must be enforced on the server.

---

## 9. Authentication

Better Auth is the authentication system.

Supported methods:

```text
Email + Password
Google OAuth
```

Flow:

```text
User
 |
 +---- Email/Password
 |
 +---- Google OAuth
 |
 v
Better Auth
 |
 v
Session
 |
 v
HTTP-only Cookie
 |
 v
Protected Server Functions
```

Do not store authentication/session tokens in localStorage.

Better Auth's session is the source of truth for the authenticated user.

Do not duplicate the Better Auth session into Zustand.

Client UI may use Better Auth session hooks for:

- Current user
- User name
- Avatar
- Authentication state
- Loading state

Server-side code must independently validate the session before protected operations.

---

## 10. Authentication vs Authorization

Authentication answers:

> Who is this user?

Authorization answers:

> What is this user allowed to do?

Every protected operation should follow:

```text
Request
  |
  v
Validate Session
  |
  v
Identify User
  |
  v
Check Role
  |
  v
Check Resource Ownership / Membership
  |
  v
Validate Input
  |
  v
Perform Operation
```

Never trust client-provided:

- User ID
- Role
- Project membership
- Ownership

Derive these from trusted server-side data.

---

## 11. Project Management

Each project should have:

- Name
- Description
- Deadline
- Status
- Creator/owner
- Created timestamp
- Updated timestamp

Statuses:

```text
ACTIVE
COMPLETED
ON_HOLD
```

Authorized users can:

- Create
- View
- Update
- Delete
- Search
- Filter
- Sort

---

## 12. Project Membership

A project can have multiple members.

Relationship:

```text
User <-> Project
```

Prevent duplicate membership with a unique constraint on the user/project pair.

Membership controls access to:

- Project data
- Tasks
- Comments
- Attachments
- Activities

Knowing a project ID must never be enough to access private project data.

---

## 13. Task Management

Each task should support:

- Title
- Description
- Project
- Assigned member
- Creator
- Due date
- Priority
- Status
- Created timestamp
- Updated timestamp
- Completed timestamp

Priority:

```text
HIGH
MEDIUM
LOW
```

Status:

```text
TODO
IN_PROGRESS
COMPLETED
```

Authorized users can:

- Create tasks
- Update tasks
- Delete tasks
- Assign tasks
- Change status
- Search
- Filter
- Sort

Team members can update tasks assigned to them according to role rules.

---

## 14. Task Validation

Mandatory rules:

### Duplicate task title

A task title must not be duplicated within the same project.

Message:

```text
This task already exists in the project.
```

Enforce with application validation and database constraints where practical.

### Completed task reassignment

Completed tasks cannot be reassigned.

Message:

```text
Completed tasks cannot be reassigned.
```

Enforce server-side.

### Deadline

Invalid/past deadlines should be rejected according to the business rule.

Message:

```text
Please select a valid deadline.
```

Client validation is only for UX. Server validation is mandatory.

---

## 15. Dashboard

KPI cards:

- Total Projects
- Total Tasks
- Completed Tasks
- Pending Tasks
- Overdue Tasks

Additional sections:

- Project progress
- Tasks by priority
- Task status distribution
- Team productivity
- Member workload
- Recent activities
- Upcoming deadlines
- High priority tasks

Example:

```text
Website Redesign
5 tasks pending

Mobile App
80% completed

Admin Dashboard
Deadline in 2 days
```

---

## 16. Analytics

Use Recharts.

Charts may include:

```text
Task Status Distribution
Tasks by Priority
Project Progress
Team Productivity
Project Progress Trend
```

Large calculations should preferably happen server-side.

Do not load the entire database into the browser just to calculate dashboard statistics.

---

## 17. Search, Filtering, Sorting

### Projects

Search:

- Name

Filter:

- Status

Sort:

- Latest created
- Nearest deadline
- Recently updated

### Tasks

Search:

- Title
- Description

Filters:

- Project
- Status
- Priority
- Assigned member
- Deadline status

Deadline status:

```text
UPCOMING
OVERDUE
```

Sort:

- Latest created
- Nearest deadline
- Highest priority
- Recently updated

### Members

Search:

- Name
- Email

---

## 18. Pagination

Use server-side pagination for large datasets:

- Projects
- Tasks
- Members
- Activities
- Notifications

---

## 19. Comments

Tasks support comments.

Comment fields:

- Task
- Author
- Content
- Created timestamp
- Updated timestamp

Rules:

- Authorized project members may comment.
- Authors can edit their own comments.
- Delete permissions are checked server-side.
- Display chronologically.
- Support `Cmd + Enter` / `Ctrl + Enter` for posting.

---

## 20. File Attachments

Use Cloudflare R2.

Initial scope:

- Images only
- Maximum 2 MB per file

Flow:

```text
User
 |
 v
Server Validation
 |
 v
Cloudflare R2
 |
 v
File Metadata
 |
 v
D1
```

D1 stores metadata, not binary content.

Metadata:

- ID
- Task ID
- Uploader ID
- File name
- Object key
- MIME type
- File size
- Created timestamp

Uploader-controlled deletion must be enforced server-side.

---

## 21. Notifications

Persist notifications in D1.

Initial types:

```text
TASK_ASSIGNED
TASK_STATUS_UPDATED
TASK_DUE_SOON
```

Fields:

- Recipient
- Type
- Title
- Message
- Reference ID
- Read state
- Created timestamp

UI:

- Notification bell
- Unread badge
- Notification list
- Mark as read
- Mark all as read
- Dedicated notifications page

Use WebSockets for real-time delivery where appropriate. D1 remains the persistent notification history.

---

## 22. Activity Log

Track meaningful activities:

```text
Project created
Project updated
Task created
Task assigned
Task status changed
Task completed
Member added
Member removed
Comment created
Attachment uploaded
```

Fields:

- Actor
- Project
- Action
- Entity type
- Entity ID
- Optional metadata
- Timestamp

Show latest 5-10 relevant activities.

---

## 23. Real-Time Notifications

WorkNest includes live notifications via WebSockets.

Technology:

```text
Cloudflare Durable Objects
+
WebSockets
+
WebSocket Hibernation
```

Durable Objects handle:

- WebSocket connections
- Online presence tracking
- Notification delivery (push when online)
- Connection lifecycle

Permanent notification data is stored in D1.

---

## 24. Real-Time Events

WebSocket events:

```text
USER_ONLINE
USER_OFFLINE

TASK_UPDATED
TASK_ASSIGNED

NOTIFICATION_CREATED
NOTIFICATION_READ
```

All WebSocket event payloads must be strongly typed.

---

## 25. WebSocket Security

Before accepting a WebSocket connection:

1. Validate session.
2. Identify user.
3. Accept connection.

WebSocket connections are used for:

- Online presence tracking
- Real-time notification delivery

---

## 26. State Management

Do not add Zustand unless a real requirement appears.

### Server state

Use TanStack Query for:

- Projects
- Tasks
- Members
- Comments
- Notifications
- Activities
- Dashboard data

### Authentication state

Use Better Auth session.

Do not duplicate auth state into another global store.

### Local UI state

Use React state for:

- Modal visibility
- Dropdowns
- Tabs
- Form state
- File previews

### Real-time client state

React state or a small dedicated store may manage:

- Connection status
- Online presence
- WebSocket state
- Notification count

Only add Zustand if global client state becomes genuinely difficult to manage otherwise.

---

## 27. TanStack Query

Expected queries:

```text
useProjectsQuery
useProjectQuery
useTasksQuery
useTaskQuery
useMembersQuery
useCommentsQuery
useNotificationsQuery
useActivitiesQuery
```

Expected mutations:

```text
useCreateProject
useUpdateProject
useDeleteProject

useCreateTask
useUpdateTask
useDeleteTask
useAssignTask

useAddMember
useRemoveMember

useCreateComment
useUpdateComment
useDeleteComment

useUploadAttachment
useDeleteAttachment

useMarkNotificationRead
```

Use targeted invalidation or direct cache updates.

Real-time events should update relevant query caches where practical.

---

## 28. Server Functions

Use TanStack Start Server Functions for internal application operations.

Flow:

```text
UI
 |
 v
TanStack Query
 |
 v
Server Function
 |
 +--> Authentication
 +--> Authorization
 +--> Validation
 +--> Business Logic
 +--> Drizzle
 |
 v
D1
```

Server Functions may call server-side services/repositories.

Never expose secrets or Cloudflare bindings to the client.

---

## 29. Server Routes

Use Server Routes when a real HTTP endpoint is useful.

Examples:

- Webhooks
- External API endpoints
- OAuth/auth handlers
- Integrations
- Special file endpoints

Do not build a traditional REST API for every internal UI operation without a real requirement.

---

## 30. Drizzle ORM

Use Drizzle for D1 access.

Architecture:

```text
Server Function
      |
      v
Service / Repository
      |
      v
Drizzle ORM
      |
      v
Cloudflare D1
```

Avoid raw SQL unless it is clearly justified by query complexity or performance.

Keep database queries out of React components.

---

## 31. Database Design Principles

D1 is SQLite-based.

Do not blindly copy PostgreSQL-specific schema patterns.

Consider:

- SQLite data types
- Foreign keys
- Unique constraints
- Indexes
- D1 limitations
- Query performance

Core relationships:

```text
User
 |
 +---- Project
 +---- ProjectMember
 +---- Task
 +---- Comment
 +---- Notification
 +---- ActivityLog

Project
 |
 +---- ProjectMember
 +---- Task
 +---- ActivityLog

Task
 |
 +---- Comment
 +---- Attachment
```

---

## 32. Important Database Constraints

The final schema should enforce important integrity rules.

Examples:

```text
ProjectMember(projectId, userId)
    UNIQUE

Task(projectId, title)
    UNIQUE

Foreign keys
    ENABLED

Required fields
    NOT NULL
```

Add indexes for common queries such as:

- User email
- Project status
- Project creator
- Project deadline
- Project member project ID
- Project member user ID
- Task project ID
- Task assignee
- Task status
- Task priority
- Task due date
- Notification user ID
- Notification read status
- Activity project ID
- Activity created timestamp

Review the complete schema before generating migrations.

---

## 33. Migration Strategy

Use versioned migration files.

Preferred flow:

```text
Drizzle Schema
      |
      v
Drizzle Kit
      |
      v
Migration SQL
      |
      v
Local D1
      |
      v
Test
      |
      v
Remote D1
```

Do not casually run destructive commands against production.

Do not reset production data during normal development.

---

## 34. Cloudflare D1

D1 is the primary relational database.

Conceptually:

```text
Cloudflare Worker
      |
      v
env.DB
      |
      v
Drizzle
      |
      v
D1
```

There should be no PostgreSQL-style `DATABASE_URL`.

The Worker receives the D1 binding through Wrangler.

---

## 35. Cloudflare R2

R2 is object storage.

Use it for:

- Task images
- Project files where applicable
- User avatars

Do not store binary file contents inside D1.

---

## 36. Cloudflare Turnstile

Turnstile may protect:

- Signup
- Login
- Password recovery
- Other abuse-sensitive flows

The server must verify Turnstile tokens.

Client-side success is not sufficient authorization.

---

## 37. UI/UX

Responsive targets:

- Desktop
- Tablet
- Mobile

Use:

- Tailwind CSS
- shadcn/ui
- Consistent spacing
- Accessible controls
- Keyboard-friendly interactions
- Loading states
- Empty states
- Error states
- Confirmation dialogs for destructive actions

Themes:

```text
Light
Dark
System
```

---

## 38. Shared UI Components

Common reusable components:

```text
Sidebar
Header
Mobile Navigation
Page Container
Loading State
Error State
Empty State
Pagination
Confirmation Dialog
Data Table
Search Input
Filter Controls
Status Badge
Priority Badge
Avatar
Modal
Dropdown
Toast
```

Avoid duplicating shared components across features.

---

## 39. Error Handling

Use consistent categories:

```text
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
```

Do not expose:

- Stack traces
- Raw database errors
- Secrets
- Internal implementation details

---

## 40. Security Rules

Mandatory:

- Server-side authentication
- Server-side authorization
- Input validation
- Secure HTTP-only cookies
- Appropriate CSRF protection
- File validation
- File size limits
- MIME validation
- Project membership checks
- Ownership checks
- Rate limiting for sensitive operations
- Cloudflare secret management
- No secrets in frontend bundles
- No auth tokens in localStorage
- No client-controlled role assignment

---

## 41. Environment and Secrets

Expected secrets/configuration:

```text
BETTER_AUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
TURNSTILE_SECRET_KEY
```

Use the environment mechanism supported by the current TanStack/Cloudflare setup.

Production secrets must be stored through Cloudflare secret management.

Never commit secrets.

---

## 42. Deployment

Target:

```text
Cloudflare Workers
```

Production architecture:

```text
                    Cloudflare
                         |
                  WorkNest Worker
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
       D1                R2         Durable Objects
    Database           Files          WebSockets
        |
    Better Auth
```

Production deployment must include:

- D1 binding
- R2 binding
- Durable Object binding
- Production secrets
- Google OAuth production callback
- Correct Better Auth production URL
- Secure cookies
- Custom domain if configured

---

## 43. Development Order

### Phase 1: Infrastructure

- TanStack Start
- Cloudflare Worker
- D1
- Drizzle
- R2
- Durable Objects configuration

### Phase 2: Database

- Better Auth schema
- User schema
- Project schema
- Membership schema
- Task schema
- Comment schema
- Attachment schema
- Notification schema
- Activity schema
- Indexes
- Constraints
- Migrations

### Phase 3: Authentication

- Email/password
- Google OAuth
- Sessions
- Protected routes
- Role authorization

### Phase 4: Projects

- Project CRUD
- Project membership
- Permissions

### Phase 5: Tasks

- Task CRUD
- Assignment
- Status
- Priority
- Deadline
- Validation
- Search
- Filtering
- Sorting
- Pagination

### Phase 6: Dashboard

- KPIs
- Charts
- Workload
- Progress
- Upcoming deadlines
- Overdue tasks

### Phase 7: Collaboration

- Comments
- Activity logs
- Notifications

### Phase 8: Attachments

- R2 upload
- Image validation
- Metadata
- Preview
- Delete permissions

### Phase 9: Real-Time

- Durable Object for notifications (WebSocket hibernation)
- Durable Object for activities (broadcast to project members)
- WebSocket connection management
- Real-time notification delivery
- Real-time activity broadcasting

### Phase 10: Polish

- Dark mode
- Responsive design
- Accessibility
- Loading/error/empty states
- Performance
- Security review

### Phase 11: Deployment

- Production Worker
- Production D1
- Production R2
- Production Durable Objects
- Production secrets
- OAuth callback
- Custom domain
- README
- Demo credentials

---

## 44. Definition of Done

A feature is complete only when:

- UI works
- Server logic works
- Server validation exists
- Server authorization exists
- Database constraints exist where appropriate
- Loading state exists
- Error state exists
- Empty state exists where applicable
- Mobile layout works
- TypeScript is properly typed
- No unnecessary `any`
- Relevant tests exist
- Production behavior has been verified

---

## 45. AI Agent Rules

Any AI coding agent working on WorkNest must:

### Do

- Inspect existing files before modifying them.
- Respect installed TanStack Start and Cloudflare versions.
- Respect generated Cloudflare/Vite/Wrangler configuration.
- Use TypeScript.
- Use Drizzle for D1.
- Use Better Auth for authentication.
- Use R2 for files.
- Use Durable Objects for real-time features.
- Keep server-only code server-side.
- Validate inputs with Zod.
- Enforce permissions on the server.
- Keep migrations versioned.
- Reuse existing components.
- Keep modules focused.
- Run lint/type/build checks after meaningful changes.

### Do Not

- Add Express.
- Add Hono as a separate backend unless explicitly requested.
- Add Prisma.
- Add PostgreSQL.
- Add MongoDB.
- Add Cloudinary.
- Add Socket.io.
- Add Firebase.
- Add Redux without a real requirement.
- Add Zustand for server state.
- Duplicate Better Auth session into another global store.
- Store secrets in frontend code.
- Store auth tokens in localStorage.
- Trust client-provided roles.
- Bypass server-side validation.
- Directly modify production schema without migrations.
- Blindly overwrite generated Cloudflare configuration.
- Add dependencies without a clear reason.

---

## 46. Architectural Summary

```text
                    WorkNest
                       |
                 TanStack Start
                       |
          +------------+------------+
          |                         |
      TanStack Query          Server Functions
          |                         |
          |                 Cloudflare Worker
          |                         |
          |          +--------------+--------------+
          |          |              |              |
          |          v              v              v
          |         D1             R2       Durable Objects
          |          |              |              |
          |      Drizzle          Files        WebSockets
          |          |
          |     Better Auth
          |
       React UI
```

The architecture should remain simple where possible. Do not add infrastructure merely because it is available. Every technology must solve a real product or engineering requirement.

---

## 47. Immediate Next Step

The immediate next task is **database schema design**.

Before implementing application features:

1. Inspect the current generated TanStack/Cloudflare project.
2. Inspect installed Better Auth and Drizzle versions.
3. Design the complete D1 schema.
4. Define all relationships.
5. Define indexes.
6. Define unique constraints.
7. Define SQLite/D1-compatible enums/constants.
8. Integrate Better Auth tables correctly.
9. Create Drizzle migrations.
10. Apply migrations locally.
11. Verify relationships and constraints.
12. Apply the validated migration to the existing remote D1 database.

Do not begin broad feature implementation until the core data model and authentication schema are reviewed.

---

## 48. Quality Goal

WorkNest should demonstrate:

- Strong TypeScript
- Modern full-stack architecture
- Serverless development
- Cloudflare Workers
- Cloudflare D1
- Drizzle ORM
- Better Auth
- Google OAuth
- Role-based authorization
- Cloudflare R2
- Durable Objects
- Real-time WebSockets
- TanStack Query
- Responsive UI
- Database design
- Validation
- Security
- Production deployment

The application should prioritize clean, understandable architecture over unnecessary complexity.
