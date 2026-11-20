import { PageContainer } from '#/components/layout/page-container'
import { PageHeader } from '#/components/layout/page-header'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
import { ErrorState } from '#/components/ui/error-state'
import { LoadingState } from '#/components/ui/loading-state'
import { Pagination } from '#/components/ui/pagination-controls'
import { SearchInput } from '#/components/ui/search-input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { StatusBadge } from '#/components/ui/status-badge'
import { CreateProjectDialog } from '#/components/projects/create-project-dialog'
import { listProjects } from '#/server-functions/projects'
import { useQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  Link,
  Outlet,
  useChildMatches,
} from '@tanstack/react-router'
import { FolderKanban, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/_authenticated/projects')({
  component: ProjectsRoute,
  head: () => ({
    meta: [{ title: 'Projects — WorkNest' }],
  }),
})

function ProjectsRoute() {
  const hasChildMatch = useChildMatches({
    select: (matches) => matches.length > 0,
  })

  return hasChildMatch ? <Outlet /> : <ProjectsPage />
}

function ProjectCard({
  project,
}: {
  project: {
    id: string
    name: string
    status: string
    taskCount: number
    deadline: number | null
  }
}) {
  const formattedDeadline = project.deadline
    ? new Date(project.deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="group flex min-h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate">
            {project.name}
          </h3>
        </div>
        <StatusBadge
          status={project.status as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'}
        />
      </div>

      <div className="flex items-center justify-between gap-4 font-mono text-xs text-muted-foreground tabular-nums">
        <span>
          {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
        </span>
        <span>{formattedDeadline ?? 'No deadline'}</span>
      </div>
    </Link>
  )
}

function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('created:desc')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const [sortKey, sortDir] = sort.split(':') as [
    'created' | 'deadline' | 'name' | 'updated',
    'asc' | 'desc',
  ]

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects', search, statusFilter, sort, page],
    queryFn: () =>
      listProjects({
        data: {
          search,
          status: statusFilter,
          sort: sortKey,
          dir: sortDir,
          page,
          pageSize: 12,
        },
      }),
  })

  const items = data?.items || []
  const totalPages = data?.totalPages || 1
  const isRecoveringPage = Boolean(data && page > totalPages)

  useEffect(() => {
    if (data && data.totalPages < 1 && page > 0) {
      setPage(0)
    } else if (data && data.totalPages >= 1 && page > data.totalPages) {
      setPage(data.totalPages)
    }
  }, [data?.totalPages, page])

  const shouldShowEmptyState =
    !isLoading && !isError && !isRecoveringPage && items.length === 0

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Projects"
          description="Every project has its own tasks, members and chat"
          actions={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus data-icon="inline-start" className="size-4" />
              New project
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Search projects"
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
              aria-label="Filter projects by status"
              style={{ width: '144px' }}
              className="bg-card border-border text-foreground rounded-lg"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectGroup>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON_HOLD">On hold</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v)
              setPage(1)
            }}
          >
            <SelectTrigger
              aria-label="Sort projects"
              style={{ width: '180px' }}
              className="bg-card border-border text-foreground rounded-lg"
            >
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectGroup>
                <SelectItem value="created:desc">Newest first</SelectItem>
                <SelectItem value="created:asc">Oldest first</SelectItem>
                <SelectItem value="name:asc">Name (A–Z)</SelectItem>
                <SelectItem value="name:desc">Name (Z–A)</SelectItem>
                <SelectItem value="deadline:asc">Deadline (soonest)</SelectItem>
                <SelectItem value="deadline:desc">Deadline (latest)</SelectItem>
                <SelectItem value="updated:desc">Recently updated</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {isLoading || isRecoveringPage ? (
          <LoadingState variant="table" />
        ) : isError ? (
          <ErrorState
            title="Projects unavailable"
            message="We couldn't load your projects."
            onRetry={() => void refetch()}
          />
        ) : shouldShowEmptyState ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            description={
              search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first project to get started'
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

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

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </PageContainer>
  )
}
