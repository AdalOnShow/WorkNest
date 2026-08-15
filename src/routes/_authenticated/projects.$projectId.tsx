import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import { StatusBadge } from '#/components/ui/status-badge'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: RouteComponent,
})

const PROJECTS = {
  '1': {
    name: 'Website Redesign',
    status: 'ACTIVE' as const,
    taskCount: 12,
    deadline: 'Mar 15',
    description:
      'Refreshing the marketing site with a clearer information hierarchy, sharper visuals, and improved conversion tracking.',
  },
  '2': {
    name: 'Mobile App',
    status: 'COMPLETED' as const,
    taskCount: 24,
    deadline: '—',
    description:
      'Delivered the first release of the mobile companion app with task review, notifications, and team messaging.',
  },
  '3': {
    name: 'API Backend',
    status: 'ON_HOLD' as const,
    taskCount: 8,
    deadline: 'Apr 01',
    description:
      'Backend platform work focused on task APIs, project permissions, and notification delivery is paused pending scope review.',
  },
  '4': {
    name: 'Dashboard',
    status: 'ACTIVE' as const,
    taskCount: 6,
    deadline: 'Feb 28',
    description:
      'Internal dashboard work is tracking workspace activity, team health, and operational insights for managers.',
  },
} satisfies Record<
  string,
  {
    name: string
    status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
    taskCount: number
    deadline: string
    description: string
  }
>

function RouteComponent() {
  const { projectId } = Route.useParams()
  const project = PROJECTS[projectId]

  if (!project) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <h1 className="headline-sm text-foreground">Project not found</h1>
          <p className="body-md text-muted-foreground">
            We could not find project {projectId}.
          </p>
          <Button asChild>
            <a href="/projects">Back to projects</a>
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="label-sm text-muted-foreground">Project ID</p>
            <h1 className="headline-sm text-foreground">{project.name}</h1>
            <p className="body-md text-muted-foreground">
              {project.description}
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[14px] border border-border bg-card p-6">
            <p className="label-sm text-muted-foreground">Project</p>
            <p className="headline-xs text-foreground">{project.name}</p>
          </div>
          <div className="rounded-[14px] border border-border bg-card p-6">
            <p className="label-sm text-muted-foreground">Tasks</p>
            <p className="headline-xs text-foreground">{project.taskCount}</p>
          </div>
          <div className="rounded-[14px] border border-border bg-card p-6">
            <p className="label-sm text-muted-foreground">Deadline</p>
            <p className="headline-xs text-foreground">{project.deadline}</p>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
