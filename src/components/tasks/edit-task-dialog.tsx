import { useEffect, useState } from 'react'
import { AssigneePicker } from '#/components/tasks/assignee-picker'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { DatePicker } from '#/components/ui/date-picker'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { parseLocalDate, timestampToLocalDateString } from '#/lib/date-utils'
import { updateTask } from '#/server-functions/tasks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Status = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface EditableTask {
  id: string
  projectId: string
  title: string
  description: string | null
  status: Status
  priority: Priority
  deadline: Date | string | number | null
  assignees: Array<{ id: string }>
}

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: EditableTask
}

const selectTriggerClass =
  'bg-background border-border text-foreground rounded-lg h-10 focus-visible:ring-primary/40'
const inputClass =
  'bg-background border-border text-foreground rounded-lg h-10 focus-visible:ring-primary/40'

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
}: EditTaskDialogProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [status, setStatus] = useState<Status>(task.status)
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [deadline, setDeadline] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<Array<string>>([])

  // Reset the form from the latest task each time the dialog opens.
  useEffect(() => {
    if (!open) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setStatus(task.status)
    setPriority(task.priority)
    setDeadline(
      task.deadline != null
        ? timestampToLocalDateString(new Date(task.deadline).getTime())
        : '',
    )
    setAssigneeIds(task.assignees.map((a) => a.id))
  }, [open, task])

  // Assignees are frozen while the task is (and stays) completed.
  const assigneesLocked = task.status === 'COMPLETED' && status === 'COMPLETED'

  const mutation = useMutation({
    mutationFn: () =>
      updateTask({
        data: {
          taskId: task.id,
          title,
          description,
          status,
          priority,
          deadline: deadline ? parseLocalDate(deadline).getTime() : null,
          ...(assigneesLocked ? {} : { assigneeIds }),
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task', task.id] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      toast.success('Task updated')
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit task</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update the details and assignees for this task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label
              htmlFor="edit-task-title"
              className="text-sm text-muted-foreground"
            >
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="edit-task-description"
              className="text-sm text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="edit-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background border-border text-foreground rounded-lg min-h-[80px] focus-visible:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger className={selectTriggerClass}>
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
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Status)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectGroup>
                    <SelectItem value="TODO">To do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AssigneePicker
            projectId={task.projectId}
            value={assigneeIds}
            onChange={setAssigneeIds}
            disabled={assigneesLocked}
            enabled={open}
          />
          {assigneesLocked && (
            <p className="text-xs text-muted-foreground -mt-2">
              Completed tasks cannot be reassigned. Change the status first.
            </p>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="edit-task-deadline"
              className="text-sm text-muted-foreground"
            >
              Deadline
            </Label>
            <DatePicker
              id="edit-task-deadline"
              value={deadline}
              onChange={setDeadline}
              className="h-10"
            />
          </div>

          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
              className="border-border bg-transparent text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || mutation.isPending}
              className="font-semibold"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
