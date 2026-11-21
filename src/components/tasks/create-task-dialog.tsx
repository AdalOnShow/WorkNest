import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { DatePicker } from '#/components/ui/date-picker'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { createTask } from '#/server-functions/tasks'
import { parseLocalDate } from '#/lib/date-utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AssigneePicker } from '#/components/tasks/assignee-picker'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  projectId,
}: CreateTaskDialogProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM')
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'COMPLETED'>(
    'TODO',
  )
  const [assigneeIds, setAssigneeIds] = useState<Array<string>>([])
  const [deadline, setDeadline] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      createTask({
        data: {
          projectId,
          title,
          description: description || undefined,
          priority,
          status,
          assigneeIds,
          deadline: deadline ? parseLocalDate(deadline).getTime() : undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Task created')
      onOpenChange(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create task')
    },
  })

  function resetForm() {
    setTitleTouched(false)
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setStatus('TODO')
    setAssigneeIds([])
    setDeadline('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createMutation.mutate()
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-[460px] p-4 gap-3 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Create task</DialogTitle>
          <DialogDescription className="sr-only">
            Add a new task to this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label
              htmlFor="task-title"
              className="text-xs text-muted-foreground"
            >
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setTitleTouched(true)
              }}
              onBlur={() => setTitleTouched(true)}
              aria-invalid={(titleTouched && !title.trim()) || undefined}
              aria-describedby={
                titleTouched && !title.trim() ? 'task-title-error' : undefined
              }
              placeholder="e.g. Design homepage mockup"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 rounded-lg h-8 text-sm focus-visible:ring-primary/40"
              autoFocus
            />
            {titleTouched && !title.trim() && (
              <p id="task-title-error" className="text-[11px] text-destructive">
                Title is required
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="task-description"
              className="text-xs text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="task-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 rounded-lg min-h-[52px] py-1.5 text-sm focus-visible:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) =>
                  setPriority(v as 'HIGH' | 'MEDIUM' | 'LOW')
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground rounded-lg h-8 text-sm focus-visible:ring-primary/40">
                  <SelectValue placeholder="Priority" />
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

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as 'TODO' | 'IN_PROGRESS' | 'COMPLETED')
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground rounded-lg h-8 text-sm focus-visible:ring-primary/40">
                  <SelectValue placeholder="Status" />
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

            <div className="space-y-1">
              <Label
                htmlFor="task-deadline"
                className="text-xs text-muted-foreground"
              >
                Deadline
              </Label>
              <DatePicker
                id="task-deadline"
                value={deadline}
                onChange={setDeadline}
                disablePast
                className="h-8 text-sm"
              />
            </div>
          </div>

          <AssigneePicker
            projectId={projectId}
            value={assigneeIds}
            onChange={setAssigneeIds}
            enabled={open}
          />

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createMutation.isPending}
              className="border-border bg-transparent text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || createMutation.isPending}
              className=" font-semibold"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
