import { PageContainer } from '#/components/layout/page-container'
import { PageHeader, pathLinkClass } from '#/components/layout/page-header'
import { StatusBadge } from '#/components/ui/status-badge'
import { LoadingState } from '#/components/ui/loading-state'
import { ErrorState } from '#/components/ui/error-state'
import { Button } from '#/components/ui/button'
import { TaskTable } from '#/components/tasks/task-table'
import { listTasks } from '#/server-functions/tasks'
import { CreateTaskDialog } from '#/components/tasks/create-task-dialog'
import { EditProjectDialog } from '#/components/projects/edit-project-dialog'
import { ProjectMembersPanel } from '#/components/projects/project-members-panel'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getProject, listProjectMembers } from '#/server-functions/projects'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = Route.useParams()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showTaskDialog, setShowTaskDialog] = useState(false)

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject({ data: { projectId } }),
  })

  // Shares its cache with ProjectMembersPanel.
  const { data: members } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers({ data: { projectId } }),
  })

  const { data: taskData } = useQuery({
    queryKey: ['tasks', 'project', projectId],
    queryFn: () => listTasks({ data: { projectId, pageSize: 50 } }),
  })

  // Only project admins and managers may create tasks (enforced server-side too).
  const canCreateTask =
    members?.myRole === 'ADMIN' || members?.myRole === 'PROJECT_MANAGER'

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
        <PageHeader
          path={[
            <Link key="projects" to="/projects" className={pathLinkClass}>
              Projects
            </Link>,
            project.name,
          ]}
          title={project.name}
          description={project.description || undefined}
          actions={
            <>
              <StatusBadge status={project.status} />
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
              {canCreateTask && (
                <Button onClick={() => setShowTaskDialog(true)}>
                  <Plus className="size-4" />
                  Add task
                </Button>
              )}
            </>
          }
        />

        <dl className="grid grid-cols-1 divide-y divide-border rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-5">
            <dt className="text-sm font-semibold text-muted-foreground">
              Tasks
            </dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {project.taskCount}
            </dd>
          </div>
          <div className="p-5">
            <dt className="text-sm font-semibold text-muted-foreground">
              Members
            </dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {members?.items.length ?? '—'}
            </dd>
          </div>
          <div className="p-5">
            <dt className="text-sm font-semibold text-muted-foreground">
              Deadline
            </dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {project.deadline != null
                ? new Date(project.deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'None set'}
            </dd>
          </div>
        </dl>

        <section className="space-y-3">
          <h2 className="label-lg flex items-baseline gap-2 text-foreground">
            Tasks
            {taskData && (
              <span className="font-mono text-sm font-medium text-muted-foreground tabular-nums">
                {taskData.total}
              </span>
            )}
          </h2>
          {taskData && taskData.items.length > 0 ? (
            <TaskTable items={taskData.items} showProject={false} />
          ) : (
            <div className="space-y-4 rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No tasks yet</p>
              {canCreateTask && (
                <Button
                  variant="outline"
                  onClick={() => setShowTaskDialog(true)}
                >
                  <Plus className="size-4" />
                  Create the first task
                </Button>
              )}
            </div>
          )}
        </section>

        <ProjectMembersPanel projectId={projectId} />
      </div>

      <CreateTaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        projectId={projectId}
      />

      <EditProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          deadline:
            project.deadline != null
              ? typeof project.deadline === 'number'
                ? project.deadline
                : new Date(project.deadline).getTime()
              : null,
        }}
      />
    </PageContainer>
  )
}
