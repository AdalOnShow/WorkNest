import { AssigneeStack } from '#/components/tasks/assignee-stack'
import { Button } from '#/components/ui/button'
import { PriorityBadge } from '#/components/ui/priority-badge'
import { StatusBadge } from '#/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { TaskAssignee } from '#/server-functions/tasks'
import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'

export interface TaskTableRow {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  deadline: Date | null
  dueFormatted: string
  projectName: string | null
  assignees: Array<TaskAssignee>
  myRole: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'
}

interface TaskTableProps {
  items: Array<TaskTableRow>
  showProject?: boolean
  onDelete?: (taskId: string) => void
}

const headClass = 'text-muted-foreground font-semibold'

export function TaskTable({
  items,
  showProject = true,
  onDelete,
}: TaskTableProps) {
  const now = Date.now()
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className={headClass}>Title</TableHead>
            {showProject && <TableHead className={headClass}>Project</TableHead>}
            <TableHead className={headClass}>Assignees</TableHead>
            <TableHead className={headClass}>Status</TableHead>
            <TableHead className={headClass}>Priority</TableHead>
            <TableHead className={headClass}>Due</TableHead>
            {onDelete && (
              <TableHead className={`${headClass} text-right`}>
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((task) => {
            const overdue =
              task.deadline != null &&
              task.status !== 'COMPLETED' &&
              new Date(task.deadline).getTime() < now
            return (
              <TableRow
                key={task.id}
                className="border-border/50 hover:bg-accent/30"
              >
                <TableCell>
                  <Link
                    to="/tasks/$taskId"
                    params={{ taskId: task.id }}
                    className="text-foreground font-semibold hover:text-primary transition-colors"
                  >
                    {task.title}
                  </Link>
                </TableCell>
                {showProject && (
                  <TableCell className="text-card-foreground">
                    {task.projectName}
                  </TableCell>
                )}
                <TableCell>
                  <AssigneeStack assignees={task.assignees} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell
                  className={
                    overdue
                      ? 'text-destructive font-semibold'
                      : 'text-card-foreground'
                  }
                >
                  {task.dueFormatted}
                  {overdue && ' (overdue)'}
                </TableCell>
                {onDelete && (
                  <TableCell className="text-right">
                    {task.myRole !== 'TEAM_MEMBER' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${task.title}`}
                        onClick={() => onDelete(task.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-accent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
