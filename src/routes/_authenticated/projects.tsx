import { PageContainer } from '#/components/layout/page-container'
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
import { Calendar, CheckSquare, FolderKanban, Plus } from 'lucide-react'
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
      className="group relative bg-card border border-border rounded-[14px] p-5 min-h-[140px] block transition-all duration-200 hover:border-primary/30 hover:bg-accent/20 hover:shadow-lg hover:shadow-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </h3>
        </div>
        <StatusBadge
          status={project.status as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'}
        />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4" />
          <span>
            {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        {formattedDeadline && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formattedDeadline}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects', search, statusFilter, page],
    queryFn: () =>
      listProjects({
        data: { search, status: statusFilter, page, pageSize: 12 },
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="headline-sm text-foreground">Projects</h1>
            <p className="body-md text-muted-foreground mt-1">
              Manage your team projects
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            <Plus data-icon="inline-start" className="w-4 h-4" />
            New Project
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            placeholder="Search projects..."
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
              style={{ width: '140px' }}
              className="bg-card border-border text-foreground rounded-lg"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectGroup>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
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
