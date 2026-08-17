import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { EmptyState } from '#/components/ui/empty-state'
import { LoadingState } from '#/components/ui/loading-state'
import { Pagination } from '#/components/ui/pagination-controls'
import { SearchInput } from '#/components/ui/search-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { StatusBadge } from '#/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { deleteTask, listTasks } from '#/server-functions/tasks'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckSquare, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TasksPage,
  head: () => ({
    meta: [{ title: 'Tasks — WorkNest' }],
  }),
})

function TasksPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', search, statusFilter, priorityFilter, page],
    queryFn: () =>
      listTasks({
        data: {
          search,
          status: statusFilter,
          priority: priorityFilter,
          page,
          pageSize: 10,
        },
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask({ data: { taskId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
      setDeleteId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete task')
    },
  })

  const items = data?.items || []
  const totalPages = data?.totalPages || 1

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="headline-sm text-foreground">Tasks</h1>
            <p className="body-md text-muted-foreground mt-1">
              Manage all tasks across projects
            </p>
          </div>
          <Button className="rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger
              aria-label="Filter tasks by status"
              className="w-35 bg-card border-border text-foreground rounded-lg"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(v) => {
              setPriorityFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger
              aria-label="Filter tasks by priority"
              className="w-35 bg-card border-border text-foreground rounded-lg"
            >
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState variant="table" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={
              search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first task to get started'
            }
          />
        ) : (
          <>
            <div className="bg-card border border-border rounded-[14px] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">
                      Title
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Project
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Assignee
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Priority
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Due
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((task) => (
                    <TableRow
                      key={task.id}
                      className="border-border/50 hover:bg-accent/30"
                    >
                      <TableCell>
                        <Link
                          to="/tasks/$taskId"
                          params={{ taskId: task.id }}
                          className="text-foreground font-medium hover:text-primary transition-colors"
                        >
                          {task.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-card-foreground">
                        {task.projectName}
                      </TableCell>
                      <TableCell className="text-card-foreground">
                        {task.assigneeShort}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`label-sm ${task.priority === 'HIGH'
                              ? 'text-destructive'
                              : task.priority === 'MEDIUM'
                                ? 'text-(--color-status-on-hold)'
                                : 'text-muted-foreground'
                            }`}
                        >
                          {task.priority}
                        </span>
                      </TableCell>
                      <TableCell className="text-card-foreground">
                        {task.dueFormatted}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${task.title}`}
                            onClick={() => setDeleteId(task.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-accent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete task"
        description="This action cannot be undone. The task and all its comments will be permanently deleted."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </PageContainer>
  )
}
