import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import { SearchInput } from '#/components/ui/search-input'
import { StatusBadge } from '#/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Pagination } from '#/components/ui/pagination-controls'
import { LoadingState } from '#/components/ui/loading-state'
import { EmptyState } from '#/components/ui/empty-state'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { listProjects, deleteProject } from '#/server-functions/projects'

export const Route = createFileRoute('/_authenticated/projects')({
  component: ProjectsPage,
  head: () => ({
    meta: [{ title: 'Projects — WorkNest' }],
  }),
})

function ProjectsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, statusFilter, page],
    queryFn: () =>
      listProjects({
        data: { search, status: statusFilter, page, pageSize: 10 },
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
          <Button className="rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90">
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
              className="w-[140px] bg-card border-border text-foreground rounded-lg"
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

        {isLoading ? (
          <LoadingState variant="table" />
        ) : items.length === 0 ? (
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
            <div className="bg-card border border-border rounded-[14px] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Tasks
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Deadline
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((project) => (
                    <TableRow
                      key={project.id}
                      className="border-border/50 hover:bg-accent/30"
                    >
                      <TableCell>
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: project.id }}
                          className="text-foreground font-medium hover:text-primary transition-colors"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={project.status} />
                      </TableCell>
                      <TableCell className="text-card-foreground">
                        {project.taskCount}
                      </TableCell>
                      <TableCell className="text-card-foreground">
                        {project.deadlineFormatted}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${project.name}`}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${project.name}`}
                            onClick={() => setDeleteId(project.id)}
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
        title="Delete project"
        description="This action cannot be undone. All tasks and data in this project will be permanently deleted."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </PageContainer>
  )
}
