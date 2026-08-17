import { PageContainer } from '#/components/layout/page-container'
import { StatusBadge } from '#/components/ui/status-badge'
import { LoadingState } from '#/components/ui/loading-state'
import { ErrorState } from '#/components/ui/error-state'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getProject } from '#/server-functions/projects'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = Route.useParams()

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject({ data: { projectId } }),
  })

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState variant="detail" />
      </PageContainer>
    )
  }

  if (error || !project) {
    return (
      <PageContainer>
        <ErrorState
          title="Project not found"
          message="We could not find this project or you don't have access."
          onRetry={() => window.location.reload()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Link
              to="/projects"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Projects
            </Link>
            <h1 className="headline-sm text-foreground">{project.name}</h1>
            {project.description && (
              <p className="body-md text-muted-foreground">
                {project.description}
              </p>
            )}
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
            <p className="headline-xs text-foreground">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
