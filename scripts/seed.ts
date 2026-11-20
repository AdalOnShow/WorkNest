/**
 * Seeds WorkNest with demo data: three sign-in accounts (admin, project
 * manager, team member), teammates, projects, tasks, comments, chat, activity
 * and notifications.
 *
 *   pnpm db:seed            # local D1 (the one `pnpm dev` uses)
 *   pnpm db:seed --remote   # production D1 — only if you mean it
 *
 * Idempotent: every row it creates has an id starting with `demo-`, and those
 * rows are deleted and re-inserted on each run. Nothing else is touched.
 *
 * The demo accounts sign in with email/password, which requires
 * ENABLE_EMAIL_PASSWORD="true" (see .dev.vars.example / wrangler.jsonc).
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { faker } from '@faker-js/faker'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '#/lib/demo-accounts'
import { hashPassword } from '#/lib/password'

const remote = process.argv.includes('--remote')
faker.seed(20261120)

const DAY = 86_400_000
const now = Date.now()
const sec = (ms: number) => Math.floor(ms / 1000)

// ─── SQL helpers ──────────────────────────────────────────────────────────

type Value = string | number | boolean | null | undefined
const lit = (v: Value) =>
  v === null || v === undefined
    ? 'NULL'
    : typeof v === 'number'
      ? String(v)
      : typeof v === 'boolean'
        ? v
          ? '1'
          : '0'
        : `'${v.replaceAll("'", "''")}'`

const statements: Array<string> = []
function insert(table: string, row: Record<string, Value>) {
  const cols = Object.keys(row)
  statements.push(
    `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map((c) => lit(row[c])).join(', ')});`,
  )
}

// ─── People ───────────────────────────────────────────────────────────────

interface Person {
  id: string
  name: string
  email: string
  /** Accounts with a password can sign in. */
  login: boolean
}

const people: Array<Person> = [
  ...DEMO_ACCOUNTS.map(({ id, name, email }) => ({
    id,
    name,
    email,
    login: true,
  })),
  ...Array.from({ length: 5 }, (_, i) => {
    const first = faker.person.firstName()
    const last = faker.person.lastName()
    return {
      id: `demo-user-${i + 1}`,
      name: `${first} ${last}`,
      email: `${first}.${last}.${i + 1}@example.com`.toLowerCase(),
      login: false,
    }
  }),
]
const [admin, pm, member, ...teammates] = people as [
  Person,
  Person,
  Person,
  ...Array<Person>,
]

// ─── Projects ─────────────────────────────────────────────────────────────

type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'
type Status = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

interface ProjectSeed {
  id: string
  name: string
  description: string
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
  deadlineInDays: number | null
  members: Array<[Person, Role]>
  tasks: Array<string>
}

const projects: Array<ProjectSeed> = [
  {
    id: 'demo-proj-website',
    name: 'Website Redesign',
    description: 'Refresh the marketing site with the new Sage design system.',
    status: 'ACTIVE',
    deadlineInDays: 21,
    members: [
      [admin, 'ADMIN'],
      [pm, 'PROJECT_MANAGER'],
      [member, 'TEAM_MEMBER'],
      [teammates[0]!, 'TEAM_MEMBER'],
      [teammates[1]!, 'TEAM_MEMBER'],
    ],
    tasks: [
      'Audit current page performance',
      'Design new homepage hero',
      'Build pricing page',
      'Migrate blog posts',
      'Set up analytics events',
      'Write accessibility checklist',
      'Create component library in Figma',
      'Implement responsive navigation',
      'Optimise hero images',
      'QA on Safari and Firefox',
      'Prepare launch announcement',
      'Configure redirects from old URLs',
    ],
  },
  {
    id: 'demo-proj-mobile',
    name: 'Mobile App Launch',
    description: 'Ship v1 of the iOS and Android apps.',
    status: 'ACTIVE',
    deadlineInDays: 45,
    members: [
      [pm, 'ADMIN'],
      [admin, 'PROJECT_MANAGER'],
      [member, 'TEAM_MEMBER'],
      [teammates[2]!, 'TEAM_MEMBER'],
      [teammates[3]!, 'TEAM_MEMBER'],
    ],
    tasks: [
      'Finalise onboarding flow',
      'Push notification service',
      'Offline mode for task list',
      'App Store screenshots',
      'Crash reporting setup',
      'Beta tester recruitment',
      'Dark mode polish',
      'Login with Google and GitHub',
      'Performance profiling on low-end Android',
      'Privacy policy review',
    ],
  },
  {
    id: 'demo-proj-api',
    name: 'API v2',
    description: 'Versioned public API with rate limiting and docs.',
    status: 'ON_HOLD',
    deadlineInDays: null,
    members: [
      [admin, 'ADMIN'],
      [teammates[1]!, 'PROJECT_MANAGER'],
      [teammates[4]!, 'TEAM_MEMBER'],
    ],
    tasks: [
      'Draft OpenAPI spec',
      'Token-based rate limiting',
      'Pagination conventions',
      'Deprecation policy for v1',
      'Generate client SDKs',
      'Write API reference docs',
    ],
  },
  {
    id: 'demo-proj-onboarding',
    name: 'Customer Onboarding',
    description: 'Smoother first week for new customers.',
    status: 'COMPLETED',
    deadlineInDays: -5,
    members: [
      [member, 'ADMIN'],
      [admin, 'TEAM_MEMBER'],
      [teammates[2]!, 'TEAM_MEMBER'],
    ],
    tasks: [
      'Welcome email sequence',
      'In-app product tour',
      'Help center articles',
      'Kickoff call template',
      'Success metrics dashboard',
      'Collect onboarding feedback',
    ],
  },
]

// ─── Build rows ───────────────────────────────────────────────────────────

const PRIORITIES: Array<Priority> = ['HIGH', 'MEDIUM', 'LOW']

function pickStatus(project: ProjectSeed): Status {
  if (project.status === 'COMPLETED') return 'COMPLETED'
  return faker.helpers.weightedArrayElement([
    { weight: 4, value: 'COMPLETED' as const },
    { weight: 3, value: 'IN_PROGRESS' as const },
    { weight: 4, value: 'TODO' as const },
  ])
}

const COMMENTS = [
  'Started on this — first draft by tomorrow.',
  'Can we get a second pair of eyes on the approach?',
  'Blocked on design sign-off.',
  'Done locally, opening a PR.',
  'Looks good to me 👍',
  'Moved the deadline after talking with the team.',
  'Found an edge case on small screens, fixing now.',
  'Added notes to the task description.',
]

const CHAT = [
  'Morning all! Standup in 10.',
  'Pushed the latest build to staging.',
  'Has anyone seen the feedback from the review?',
  'I can take the QA pass this afternoon.',
  'Great work on the release 🎉',
  'Reminder: retro on Friday.',
  'Heads up, the API is slow on staging today.',
  'Thanks for the quick fix!',
]

async function build() {
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  // Clean previous demo rows. Projects cascade to members, tasks, comments,
  // activity and chat; users cascade to sessions and accounts.
  statements.push(
    `DELETE FROM "notification" WHERE "id" LIKE 'demo-%' OR "recipient_id" LIKE 'demo-%';`,
    `DELETE FROM "project" WHERE "id" LIKE 'demo-%';`,
    `DELETE FROM "session" WHERE "user_id" LIKE 'demo-%';`,
    `DELETE FROM "account" WHERE "user_id" LIKE 'demo-%';`,
    `DELETE FROM "user_profile" WHERE "id" LIKE 'demo-%';`,
    `DELETE FROM "user" WHERE "id" LIKE 'demo-%';`,
  )

  for (const p of people) {
    insert('user', {
      id: p.id,
      name: p.name,
      email: p.email,
      email_verified: true,
      image: null,
      created_at: now - 60 * DAY,
      updated_at: now - 60 * DAY,
    })
    insert('user_profile', {
      id: p.id,
      role: 'TEAM_MEMBER',
      created_at: now - 60 * DAY,
      onboarding_completed_at: now - 60 * DAY,
    })
    if (p.login) {
      insert('account', {
        id: `${p.id}-credential`,
        account_id: p.id,
        provider_id: 'credential',
        user_id: p.id,
        password: passwordHash,
        created_at: now - 60 * DAY,
        updated_at: now - 60 * DAY,
      })
    }
  }

  let taskCounter = 0
  let commentCounter = 0
  let activityCounter = 0
  let notificationCounter = 0

  for (const project of projects) {
    const createdAt = now - faker.number.int({ min: 30, max: 50 }) * DAY
    const creator = project.members.find(([, r]) => r === 'ADMIN')![0]
    insert('project', {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      deadline:
        project.deadlineInDays === null
          ? null
          : sec(now + project.deadlineInDays * DAY),
      creator_id: creator.id,
      created_at: sec(createdAt),
      updated_at: sec(now - faker.number.int({ min: 0, max: 5 }) * DAY),
    })
    project.members.forEach(([person, role], i) =>
      insert('project_member', {
        id: `demo-pm-${project.id.slice(10)}-${i}`,
        project_id: project.id,
        user_id: person.id,
        role,
        created_at: sec(createdAt + i * 3600_000),
      }),
    )
    const memberPeople = project.members.map(([person]) => person)
    const managers = project.members
      .filter(([, r]) => r !== 'TEAM_MEMBER')
      .map(([person]) => person)

    for (const title of project.tasks) {
      const id = `demo-task-${++taskCounter}`
      const status = pickStatus(project)
      const priority = faker.helpers.arrayElement(PRIORITIES)
      const taskCreated =
        createdAt + faker.number.int({ min: 1, max: 20 }) * DAY
      // Completed tasks finish within the last ~2 weeks so the productivity
      // chart has data; open ones get a deadline around today.
      const completedAt =
        status === 'COMPLETED'
          ? now -
            faker.number.int({ min: 0, max: 13 }) * DAY -
            faker.number.int({ min: 1, max: 8 }) * 3600_000
          : null
      const deadline = faker.datatype.boolean(0.8)
        ? now + faker.number.int({ min: -4, max: 20 }) * DAY
        : null
      const taskCreator = faker.helpers.arrayElement(managers)
      insert('task', {
        id,
        project_id: project.id,
        title,
        description: faker.datatype.boolean(0.6)
          ? faker.lorem.sentences({ min: 1, max: 3 })
          : null,
        status,
        priority,
        creator_id: taskCreator.id,
        deadline: deadline === null ? null : sec(deadline),
        created_at: sec(Math.min(taskCreated, now - DAY)),
        updated_at: sec(
          completedAt ?? now - faker.number.int({ min: 0, max: 6 }) * DAY,
        ),
        completed_at: completedAt === null ? null : sec(completedAt),
      })

      const assignees = faker.helpers.arrayElements(memberPeople, {
        min: 0,
        max: 2,
      })
      for (const a of assignees) {
        insert('task_assignee', {
          task_id: id,
          user_id: a.id,
          created_at: sec(taskCreated),
        })
      }

      insert('activity', {
        id: `demo-act-${++activityCounter}`,
        actor_id: taskCreator.id,
        project_id: project.id,
        action: 'TASK_CREATED',
        entity_type: 'task',
        entity_id: id,
        metadata: JSON.stringify({ title, priority }),
        created_at: sec(Math.min(taskCreated, now - DAY)),
      })
      if (completedAt !== null) {
        insert('activity', {
          id: `demo-act-${++activityCounter}`,
          actor_id: (assignees[0] ?? taskCreator).id,
          project_id: project.id,
          action: 'TASK_STATUS_UPDATED',
          entity_type: 'task',
          entity_id: id,
          metadata: JSON.stringify({ title, status: 'COMPLETED' }),
          created_at: sec(completedAt),
        })
      }

      // A few comments on some tasks.
      const commentCount = faker.helpers.weightedArrayElement([
        { weight: 5, value: 0 },
        { weight: 3, value: 1 },
        { weight: 2, value: 2 },
      ])
      for (let c = 0; c < commentCount; c++) {
        const author = faker.helpers.arrayElement(memberPeople)
        const at = sec(now - faker.number.int({ min: 1, max: 10 }) * DAY)
        insert('comment', {
          id: `demo-comment-${++commentCounter}`,
          task_id: id,
          author_id: author.id,
          content: faker.helpers.arrayElement(COMMENTS),
          created_at: at,
          updated_at: at,
        })
      }

      // Notifications for the demo admin about their assigned work.
      if (assignees.some((a) => a.id === admin.id)) {
        insert('notification', {
          id: `demo-notif-${++notificationCounter}`,
          recipient_id: admin.id,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You were assigned to "${title}"`,
          reference_id: id,
          read: notificationCounter > 4,
          created_at: sec(now - notificationCounter * 7 * 3600_000),
        })
      }
    }

    // Chat history for active projects (chat timestamps are milliseconds).
    if (project.status === 'ACTIVE') {
      for (let m = 0; m < 12; m++) {
        insert('chat_message', {
          id: `demo-chat-${project.id.slice(10)}-${String(m).padStart(2, '0')}`,
          project_id: project.id,
          sender_id: faker.helpers.arrayElement(memberPeople).id,
          body: faker.helpers.arrayElement(CHAT),
          created_at: now - (12 - m) * 47 * 60_000,
        })
      }
    }
  }

  return {
    users: people.length,
    projects: projects.length,
    tasks: taskCounter,
    comments: commentCounter,
    notifications: notificationCounter,
  }
}

const counts = await build()

const dir = join(process.cwd(), '.wrangler', 'tmp')
mkdirSync(dir, { recursive: true })
const file = join(dir, 'seed.sql')
writeFileSync(file, statements.join('\n') + '\n')

console.log(
  `Seeding ${remote ? 'REMOTE' : 'local'} D1: ${counts.users} users, ${counts.projects} projects, ${counts.tasks} tasks, ${counts.comments} comments, ${counts.notifications} notifications`,
)
execFileSync(
  'pnpm',
  [
    'wrangler',
    'd1',
    'execute',
    'worknest-db',
    remote ? '--remote' : '--local',
    '--file',
    file,
  ],
  { stdio: 'inherit' },
)

console.log(`
Demo accounts (password: ${DEMO_PASSWORD}):
  ${admin.email.padEnd(22)} admin of Website Redesign and API v2
  ${pm.email.padEnd(22)} admin of Mobile App Launch, project manager elsewhere
  ${member.email.padEnd(22)} team member (admin of Customer Onboarding)
Email sign-in needs ENABLE_EMAIL_PASSWORD="true".`)
