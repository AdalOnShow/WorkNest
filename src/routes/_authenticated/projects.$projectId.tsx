import { PageContainer } from '#/components/layout/page-container'
import { StatusBadge } from '#/components/ui/status-badge'
import { PriorityBadge } from '#/components/ui/priority-badge'
import { LoadingState } from '#/components/ui/loading-state'
import { ErrorState } from '#/components/ui/error-state'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
import { EditProjectDialog } from '#/components/projects/edit-project-dialog'
import { CreateTaskDialog } from '#/components/tasks/create-task-dialog'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getProject } from '#/server-functions/projects'
import { listTasks } from '#/server-functions/tasks'
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
  const navigate = useNavigate()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject({ data: { projectId } }),
  })

  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () =>
      listTasks({
        data: { projectId, pageSize: 5 },
      }),
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

  const tasks = tasksData?.items || []
  const totalTasks = tasksData?.total || 0

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <button
              onClick={() => navigate({ to: '/projects' })}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </button>
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
          <div className="rounded-[14px] border border-border bg-card p-5">
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
          <div className="rounded-[14px] border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-2xl font-bold text-foreground">—</p>
              </div>
            </div>
          </div>
          <div className="rounded-[14px] border border-border bg-card p-5 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="text-lg font-semibold text-foreground">
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

        <div className="rounded-[14px] border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Tasks
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateTaskDialog(true)}
              className="border-border text-card-foreground hover:bg-accent"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Task
            </Button>
          </div>
          <div className="p-5">
            {isLoadingTasks ? (
              <LoadingState variant="list" />
            ) : tasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks yet"
                description="Create your first task to get started"
              />
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Link
                    key={task.id}
                    to="/tasks/$taskId"
                    params={{ taskId: task.id }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 hover:border-border transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <PriorityBadge priority={task.priority} />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {task.projectName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={task.status} />
                      {task.assigneeName && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                          {task.assigneeName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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

      <CreateTaskDialog
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        projectId={project.id}
      />
    </PageContainer>
  )
}
