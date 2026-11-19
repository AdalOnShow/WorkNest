import { PageContainer } from '#/components/layout/page-container'
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
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Pencil,
  Plus,
  Users,
} from 'lucide-react'
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
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Link>
            <div>
              <h1 className="headline-sm text-foreground">{project.name}</h1>
              {project.description && (
                <p className="body-md text-muted-foreground mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={project.status} />
            {canCreateTask && (
              <Button size="sm" onClick={() => setShowTaskDialog(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add task
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="border-border text-card-foreground hover:bg-accent"
            >
              <Pencil className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-foreground">
                  {project.taskCount}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-2xl font-bold text-foreground">
                  {members?.items.length ?? '—'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="text-lg font-bold text-foreground">
                  {project.deadline != null
                    ? new Date(project.deadline).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'No deadline set'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="label-lg text-foreground">
              Tasks{taskData ? ` (${taskData.total})` : ''}
            </h2>
            {canCreateTask && (
              <Button size="sm" onClick={() => setShowTaskDialog(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add task
              </Button>
            )}
          </div>
          {taskData && taskData.items.length > 0 ? (
            <TaskTable items={taskData.items} showProject={false} />
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
              {canCreateTask && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTaskDialog(true)}
                  className="border-border"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
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
