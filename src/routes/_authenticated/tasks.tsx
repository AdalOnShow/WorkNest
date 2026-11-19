import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { EmptyState } from '#/components/ui/empty-state'
import { ErrorState } from '#/components/ui/error-state'
import { LoadingState } from '#/components/ui/loading-state'
import { Pagination } from '#/components/ui/pagination-controls'
import { SearchInput } from '#/components/ui/search-input'
import { CreateTaskDialog } from '#/components/tasks/create-task-dialog'
import { TaskTable } from '#/components/tasks/task-table'
import { FilterControls } from '#/components/ui/filter-controls'
import { listProjects } from '#/server-functions/projects'
import { deleteTask, listTasks } from '#/server-functions/tasks'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CheckSquare, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const [projectFilter, setProjectFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [deadlineFilter, setDeadlineFilter] = useState('all')
  const [sort, setSort] = useState('created:desc')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pickProjectOpen, setPickProjectOpen] = useState(false)
  const [createProjectId, setCreateProjectId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const [sortKey, sortDir] = sort.split(':') as [
    'created' | 'deadline' | 'priority' | 'updated',
    'asc' | 'desc',
  ]

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'tasks',
      debouncedSearch,
      statusFilter,
      priorityFilter,
      projectFilter,
      assigneeFilter,
      deadlineFilter,
      sort,
      page,
    ],
    queryFn: () =>
      listTasks({
        data: {
          search: debouncedSearch,
          status: statusFilter,
          priority: priorityFilter,
          projectId: projectFilter === 'all' ? undefined : projectFilter,
          assigneeId: assigneeFilter === 'all' ? undefined : assigneeFilter,
          deadline: deadlineFilter as 'all' | 'overdue' | 'week' | 'none',
          sort: sortKey,
          dir: sortDir,
          page,
          pageSize: 10,
        },
      }),
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'all-for-tasks'],
    queryFn: () => listProjects({ data: { pageSize: 100 } }),
  })
  const projects = projectsData?.items ?? []

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask({ data: { taskId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Task deleted')
      setDeleteId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete task')
    },
  })

  const items = data?.items || []
  const totalPages = data?.totalPages || 1
  const isRecoveringPage = Boolean(data && page > totalPages)

  useEffect(() => {
    if (
      data?.totalPages !== undefined &&
      page > data.totalPages &&
      data.totalPages > 0
    ) {
      setPage(data.totalPages)
    }
  }, [data?.totalPages, page])

  const shouldShowEmptyState =
    !isLoading && !isError && !isRecoveringPage && items.length === 0

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
          <Button
            className="font-semibold"
            disabled={projects.length === 0}
            onClick={() => setPickProjectOpen(true)}
          >
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
          <FilterControls
            filters={[
              {
                label: 'Filter tasks by status',
                value: statusFilter,
                onChange: (v) => {
                  setStatusFilter(v)
                  setPage(1)
                },
                options: [
                  { label: 'All Status', value: 'all' },
                  { label: 'To Do', value: 'TODO' },
                  { label: 'In Progress', value: 'IN_PROGRESS' },
                  { label: 'Completed', value: 'COMPLETED' },
                ],
              },
              {
                label: 'Filter tasks by priority',
                value: priorityFilter,
                onChange: (v) => {
                  setPriorityFilter(v)
                  setPage(1)
                },
                options: [
                  { label: 'All Priority', value: 'all' },
                  { label: 'High', value: 'HIGH' },
                  { label: 'Medium', value: 'MEDIUM' },
                  { label: 'Low', value: 'LOW' },
                ],
              },
              {
                label: 'Filter tasks by project',
                value: projectFilter,
                onChange: (v) => {
                  setProjectFilter(v)
                  setPage(1)
                },
                options: [
                  { label: 'All Projects', value: 'all' },
                  ...projects.map((p) => ({ label: p.name, value: p.id })),
                ],
              },
              {
                label: 'Filter tasks by assignee',
                value: assigneeFilter,
                onChange: (v) => {
                  setAssigneeFilter(v)
                  setPage(1)
                },
                options: [
                  { label: 'All Assignees', value: 'all' },
                  { label: 'Assigned to me', value: 'me' },
                ],
              },
              {
                label: 'Filter tasks by deadline',
                value: deadlineFilter,
                onChange: (v) => {
                  setDeadlineFilter(v)
                  setPage(1)
                },
                options: [
                  { label: 'Any Deadline', value: 'all' },
                  { label: 'Overdue', value: 'overdue' },
                  { label: 'Due this week', value: 'week' },
                  { label: 'No deadline', value: 'none' },
                ],
              },
              {
                label: 'Sort tasks',
                value: sort,
                onChange: (v) => {
                  setSort(v)
                  setPage(1)
                },
                options: [
                  { label: 'Newest first', value: 'created:desc' },
                  { label: 'Oldest first', value: 'created:asc' },
                  { label: 'Deadline (soonest)', value: 'deadline:asc' },
                  { label: 'Deadline (latest)', value: 'deadline:desc' },
                  { label: 'Priority (high first)', value: 'priority:desc' },
                  { label: 'Priority (low first)', value: 'priority:asc' },
                  { label: 'Recently updated', value: 'updated:desc' },
                ],
              },
            ]}
          />
        </div>

        {isLoading || isRecoveringPage ? (
          <LoadingState variant="table" />
        ) : isError ? (
          <ErrorState
            title="Tasks unavailable"
            message="We couldn't load your tasks."
            onRetry={() => void refetch()}
          />
        ) : shouldShowEmptyState ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={
              search ||
              statusFilter !== 'all' ||
              priorityFilter !== 'all' ||
              projectFilter !== 'all' ||
              assigneeFilter !== 'all' ||
              deadlineFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first task to get started'
            }
          />
        ) : (
          <>
            <TaskTable items={items} onDelete={setDeleteId} />

            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={pickProjectOpen} onOpenChange={setPickProjectOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Choose a project</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Pick the project this task belongs to.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-lg border border-border">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPickProjectOpen(false)
                  setCreateProjectId(p.id)
                }}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                {p.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {createProjectId && (
        <CreateTaskDialog
          open
          onOpenChange={(o) => !o && setCreateProjectId(null)}
          projectId={createProjectId}
        />
      )}

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
