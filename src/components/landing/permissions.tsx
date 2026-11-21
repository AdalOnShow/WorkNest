import { Check } from 'lucide-react'
import { Container, Reveal, SectionHeading } from './reveal'

/** `true` = allowed, `false` = not allowed, string = allowed with a limit. */
type Cell = boolean | string

// Mirrors the checks in src/server-functions (tasks, projects, invitations, chat).
const ROWS: Array<{ action: string; admin: Cell; pm: Cell; member: Cell }> = [
  {
    action: 'View tasks, members and chat',
    admin: true,
    pm: true,
    member: true,
  },
  { action: 'Comment on tasks', admin: true, pm: true, member: true },
  {
    action: 'Change task status',
    admin: true,
    pm: true,
    member: 'Assigned only',
  },
  {
    action: 'Create, edit and delete tasks',
    admin: true,
    pm: true,
    member: false,
  },
  {
    action: 'Delete other people’s comments',
    admin: true,
    pm: true,
    member: false,
  },
  { action: 'Invite members', admin: true, pm: true, member: false },
  { action: 'Grant the Admin role', admin: true, pm: false, member: false },
  { action: 'Remove other members', admin: true, pm: false, member: false },
  { action: 'Moderate chat messages', admin: true, pm: false, member: false },
  {
    action: 'Edit or delete the project',
    admin: true,
    pm: false,
    member: false,
  },
]

const ROLES = [
  { key: 'admin', label: 'Admin' },
  { key: 'pm', label: 'Project manager' },
  { key: 'member', label: 'Team member' },
] as const

function CellMark({ value }: { value: Cell }) {
  if (typeof value === 'string') {
    return (
      <span className="font-mono text-[11px] text-muted-foreground">
        {value}
      </span>
    )
  }
  if (value) {
    return (
      <>
        <Check aria-hidden="true" className="mx-auto size-4 text-primary" />
        <span className="sr-only">Allowed</span>
      </>
    )
  }
  return (
    <>
      <span aria-hidden="true" className="text-muted-foreground/60">
        —
      </span>
      <span className="sr-only">Not allowed</span>
    </>
  )
}

export function Permissions() {
  return (
    <section id="access" className="scroll-mt-24 pb-24 sm:pb-32">
      <Container>
        <SectionHeading
          eyebrow="Access"
          title="Every role, spelled out"
          description="Each person gets a role on each project. Here is exactly what each role can do, checked on the server for every request."
        />

        <Reveal>
          <div className="chamfer bg-border p-px [--cut:14px]">
            <div className="chamfer overflow-x-auto bg-background [--cut:14px]">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <caption className="sr-only">
                  Permissions for each project role
                </caption>
                <thead>
                  <tr className="border-b border-border/60">
                    <th
                      scope="col"
                      className="sticky left-0 bg-background px-5 py-4 sm:px-6"
                    >
                      <span className="eyebrow">Action</span>
                    </th>
                    {ROLES.map((r) => (
                      <th
                        key={r.key}
                        scope="col"
                        className="w-[20%] px-4 py-4 text-center"
                      >
                        <span className="eyebrow">{r.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr
                      key={row.action}
                      className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/50"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 bg-background px-5 py-3.5 text-[13px] font-normal text-foreground sm:px-6"
                      >
                        {row.action}
                      </th>
                      {ROLES.map((r) => (
                        <td key={r.key} className="px-4 py-3.5 text-center">
                          <CellMark value={row[r.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          Roles are set per project. Whoever creates a project starts as its
          Admin.
        </p>
      </Container>
    </section>
  )
}
