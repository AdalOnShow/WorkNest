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

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TasksPage,
  head: () => ({
    meta: [{ title: 'Tasks — WorkNest' }],
  }),
})

const MOCK_TASKS = [
  { id: '1', title: 'Fix login bug', project: 'Website Redesign', assignee: 'John D.', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, due: 'Feb 20' },
  { id: '2', title: 'Add tests', project: 'Website Redesign', assignee: 'Jane S.', status: 'TODO' as const, priority: 'MEDIUM' as const, due: 'Feb 25' },
  { id: '3', title: 'Design UI', project: 'Mobile App', assignee: 'Mike R.', status: 'COMPLETED' as const, priority: 'LOW' as const, due: '—' },
  { id: '4', title: 'Setup CI/CD', project: 'API Backend', assignee: 'John D.', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, due: 'Feb 22' },
  { id: '5', title: 'Write docs', project: 'Dashboard', assignee: 'Jane S.', status: 'TODO' as const, priority: 'LOW' as const, due: 'Mar 01' },
]

function TasksPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [page, setPage] = useState(1)

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="headline-sm text-foreground">Tasks</h1>
            <p className="body-md text-muted-foreground mt-1">Manage all tasks across projects</p>
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
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-card border-border text-foreground rounded-lg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] bg-card border-border text-foreground rounded-lg">
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

        <div className="bg-card border border-border rounded-[14px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Title</TableHead>
                <TableHead className="text-muted-foreground font-medium">Project</TableHead>
                <TableHead className="text-muted-foreground font-medium">Assignee</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Priority</TableHead>
                <TableHead className="text-muted-foreground font-medium">Due</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TASKS.map((task) => (
                <TableRow key={task.id} className="border-border/50 hover:bg-accent/30">
                  <TableCell>
                    <Link
                      to="/tasks/$taskId"
                      params={{ taskId: task.id }}
                      className="text-foreground font-medium hover:text-primary transition-colors"
                    >
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-card-foreground">{task.project}</TableCell>
                  <TableCell className="text-card-foreground">{task.assignee}</TableCell>
                  <TableCell><StatusBadge status={task.status} /></TableCell>
                  <TableCell>
                    <span className={`label-sm ${
                      task.priority === 'HIGH' ? 'text-destructive' :
                      task.priority === 'MEDIUM' ? 'text-[var(--color-status-on-hold)]' : 'text-muted-foreground'
                    }`}>
                      {task.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-card-foreground">{task.due}</TableCell>
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
