/**
 * Seeded demo accounts (see scripts/seed.ts). Shared by the seed script and
 * the login page's one-click demo buttons. The password is intentionally
 * public: these accounts only exist when the demo seed has been run.
 */
export const DEMO_PASSWORD = 'worknest-demo'

export const DEMO_ACCOUNTS = [
  {
    id: 'demo-user-admin',
    name: 'Demo Admin',
    email: 'demo@worknest.dev',
    roleLabel: 'Admin',
  },
  {
    id: 'demo-user-pm',
    name: 'Priya Manager',
    email: 'pm@worknest.dev',
    roleLabel: 'Project manager',
  },
  {
    id: 'demo-user-member',
    name: 'Sam Member',
    email: 'member@worknest.dev',
    roleLabel: 'Team member',
  },
] as const

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number]
