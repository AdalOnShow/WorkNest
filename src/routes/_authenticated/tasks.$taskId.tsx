import { PageContainer } from '#/components/layout/page-container'
import { AssigneeStack } from '#/components/tasks/assignee-stack'
import { EditTaskDialog } from '#/components/tasks/edit-task-dialog'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { PriorityBadge } from '#/components/ui/priority-badge'
import { ErrorState } from '#/components/ui/error-state'
import { LoadingState } from '#/components/ui/loading-state'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { UserAvatar } from '#/components/ui/user-avatar'
import {
  addTaskComment,
  changeTaskStatus,
  deleteTask,
  getTask,
  getTaskComments,
  updateTask,
} from '#/server-functions/tasks'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Send, Trash2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/tasks/$taskId')({
  component: TaskDetailPage,
  head: () => ({
    meta: [{ title: 'Task — WorkNest' }],
  }),
})

function TaskDetailPage() {
  const { taskId } = Route.useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user: sessionUser } = Route.useRouteContext()
  const [comment, setComment] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)
  const statusLabelId = useId()
  const priorityLabelId = useId()

  const {
    data: task,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask({ data: { taskId } }),
  })

  const { data: comments = [] } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: () => getTaskComments({ data: { taskId } }),
  })

  useEffect(() => {
    if (task) {
      setSelectedStatus(task.status)
      setSelectedPriority(task.priority)
    }
  }, [task])

  const statusMutation = useMutation({
    mutationFn: (status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') =>
      changeTaskStatus({ data: { taskId, status } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ])
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update status')
      if (task) setSelectedStatus(task.status)
    },
  })

  const priorityMutation = useMutation({
    mutationFn: (priority: 'HIGH' | 'MEDIUM' | 'LOW') =>
      updateTask({ data: { taskId, priority } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ])
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update priority')
      if (task) setSelectedPriority(task.priority)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask({ data: { taskId } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      toast.success('Task deleted')
      void navigate({ to: '/tasks' })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete task')
      setShowDelete(false)
    },
  })

  const addCommentMutation = useMutation({
    mutationFn: () => addTaskComment({ data: { taskId, content: comment } }),
    onSuccess: async () => {
      setComment('')
      await queryClient.invalidateQueries({
        queryKey: ['taskComments', taskId],
      })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send comment')
    },
  })

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState variant="detail" />
      </PageContainer>
    )
  }

  if (error || !task) {
    return (
      <PageContainer>
        <ErrorState
          title={
            error && !/not found/i.test(error.message)
              ? 'Something went wrong'
              : 'Task not found'
          }
          message={
            error && !/not found/i.test(error.message)
              ? 'We could not load this task. Please try again.'
              : 'We could not find this task.'
          }
          onRetry={() =>
            void queryClient.invalidateQueries({ queryKey: ['task', taskId] })
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>

        <div className="flex items-start justify-between">
          <h1 className="headline-sm text-foreground">{task.title}</h1>
          {task.canManage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEdit(true)}
                className="border-border text-card-foreground hover:bg-accent"
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label={`Delete ${task.title}`}
                onClick={() => setShowDelete(true)}
                className="border-border text-destructive hover:bg-destructive/10"
              >
                <Trash2 data-icon="inline-start" className="w-4 h-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div>
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    id={statusLabelId}
                    className="label-sm text-muted-foreground block mb-2"
                  >
                    Status
                  </label>
                  <Select
                    disabled={!task.canManage && !task.isAssignee}
                    value={selectedStatus || task.status}
                    onValueChange={(value) => {
                      setSelectedStatus(value)
                      void statusMutation.mutateAsync(
                        value as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
                      )
                    }}
                  >
                    <SelectTrigger
                      aria-labelledby={statusLabelId}
                      className="bg-background border-border text-foreground rounded-lg"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectGroup>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    id={priorityLabelId}
                    className="label-sm text-muted-foreground block mb-2"
                  >
                    Priority
                  </label>
                  {task.canManage ? (
                    <Select
                      value={selectedPriority || task.priority}
                      onValueChange={(value) => {
                        setSelectedPriority(value)
                        void priorityMutation.mutateAsync(
                          value as 'HIGH' | 'MEDIUM' | 'LOW',
                        )
                      }}
                    >
                      <SelectTrigger
                        aria-labelledby={priorityLabelId}
                        className="bg-background border-border text-foreground rounded-lg"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectGroup>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <PriorityBadge priority={task.priority} />
                  )}
                </div>
                <div>
                  <label className="label-sm text-muted-foreground block mb-2">
                    Assignees
                  </label>
                  {task.assignees.length === 0 ? (
                    <p className="body-sm text-foreground">Unassigned</p>
                  ) : (
                    <div className="space-y-2">
                      <AssigneeStack assignees={task.assignees} max={5} />
                      <p className="text-xs text-muted-foreground">
                        {task.assignees.map((a) => a.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="label-sm text-muted-foreground block mb-2">
                    Due Date
                  </label>
                  <p className="body-sm text-foreground">{task.dueFormatted}</p>
                </div>
                <div>
                  <label className="label-sm text-muted-foreground block mb-2">
                    Created
                  </label>
                  <p className="body-sm text-foreground">
                    {new Date(task.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {task.creatorName ? ` by ${task.creatorName}` : ''}
                  </p>
                </div>
                {task.completedAt && (
                  <div>
                    <label className="label-sm text-muted-foreground block mb-2">
                      Completed
                    </label>
                    <p className="body-sm text-foreground">
                      {new Date(task.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {task.description && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="label-lg text-foreground mb-3">Description</h3>
                <p className="body-md text-card-foreground leading-relaxed">
                  {task.description}
                </p>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="label-lg text-foreground mb-4">
                Comments ({comments.length})
              </h3>
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <UserAvatar
                      name={c.authorName || 'User'}
                      image={c.authorImage || undefined}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="label-sm text-foreground">
                          {c.authorName || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ·{' '}
                          {new Date(c.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="body-sm text-card-foreground mt-1">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                <UserAvatar
                  name={sessionUser.name || 'You'}
                  image={sessionUser.image || undefined}
                  size="sm"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    aria-label={`Comment on ${task.title}`}
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-1 h-10 px-4 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  <Button
                    size="icon"
                    aria-label="Send comment"
                    onClick={() => void addCommentMutation.mutateAsync()}
                    disabled={!comment.trim() || addCommentMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {task.canManage && (
        <EditTaskDialog
          open={showEdit}
          onOpenChange={setShowEdit}
          task={task}
        />
      )}
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete task"
        description="This action cannot be undone. The task and all its comments will be permanently deleted."
        onConfirm={() => deleteMutation.mutate()}
      />
    </PageContainer>
  )
}
