import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Pagination } from '#/components/ui/pagination-controls'

export const Route = createFileRoute('/_authenticated/projects')({
  component: ProjectsPage,
  head: () => ({
    meta: [{ title: 'Projects — WorkNest' }],
  }),
})

const MOCK_PROJECTS = [
  { id: '1', name: 'Website Redesign', status: 'ACTIVE' as const, deadline: 'Mar 15', taskCount: 12 },
  { id: '2', name: 'Mobile App', status: 'COMPLETED' as const, deadline: '—', taskCount: 24 },
  { id: '3', name: 'API Backend', status: 'ON_HOLD' as const, deadline: 'Apr 01', taskCount: 8 },
  { id: '4', name: 'Dashboard', status: 'ACTIVE' as const, deadline: 'Feb 28', taskCount: 6 },
]

function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="headline-sm text-foreground">Projects</h1>
            <p className="body-md text-muted-foreground mt-1">Manage your team projects</p>
          </div>
          <Button className="rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-card border-border text-foreground rounded-lg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-[14px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Tasks</TableHead>
                <TableHead className="text-muted-foreground font-medium">Deadline</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PROJECTS.map((project) => (
                <TableRow key={project.id} className="border-border/50 hover:bg-accent/30">
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
                  <TableCell className="text-card-foreground">{project.taskCount}</TableCell>
                  <TableCell className="text-card-foreground">{project.deadline}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-accent">
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
          <Pagination currentPage={page} totalPages={3} onPageChange={setPage} />
        </div>
      </div>
    </PageContainer>
  )
}
