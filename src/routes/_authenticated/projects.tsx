import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
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
import { deleteProject, listProjects } from '#/server-functions/projects'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Calendar, CheckSquare, FolderKanban, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/projects')({
  component: ProjectsPage,
  head: () => ({
    meta: [{ title: 'Projects — WorkNest' }],
  }),
})

function ProjectCard({
  project,
  onDelete,
}: {
  project: {
    id: string
    name: string
    status: string
    taskCount: number
    deadline: number | null
  }
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate({ to: '/projects/$projectId', params: { projectId: project.id } })
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(project.id)
  }

  const formattedDeadline = project.deadline
    ? new Date(project.deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      className="group relative bg-card border border-border rounded-[14px] p-5 cursor-pointer transition-all duration-200 hover:border-primary/30 hover:bg-accent/20 hover:shadow-lg hover:shadow-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </h3>
        </div>
        <StatusBadge status={project.status as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'} />
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

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${project.name}`}
          onClick={handleDeleteClick}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function ProjectsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects', search, statusFilter, page],
    queryFn: () =>
      listProjects({
        data: { search, status: statusFilter, page, pageSize: 12 },
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => deleteProject({ data: { projectId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
      setDeleteId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete project')
    },
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
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={setDeleteId}
                />
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete project"
        description="This action cannot be undone. All tasks and data in this project will be permanently deleted."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </PageContainer>
  )
}
