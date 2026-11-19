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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listProjectMembers } from '#/server-functions/projects'
import { Checkbox } from '#/components/ui/checkbox'
import { UserAvatar } from '#/components/ui/user-avatar'
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
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM')
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'COMPLETED'>(
    'TODO',
  )
  const [assigneeIds, setAssigneeIds] = useState<Array<string>>([])
  const [deadline, setDeadline] = useState('')

  const { data: membersData } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers({ data: { projectId } }),
    enabled: open,
  })

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

  const members = membersData?.items || []

  function toggleAssignee(id: string, checked: boolean) {
    setAssigneeIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Task</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new task to this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label
              htmlFor="task-title"
              className="text-sm text-muted-foreground"
            >
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design homepage mockup"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 rounded-lg h-10 focus-visible:ring-primary/40"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="task-description"
              className="text-sm text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 rounded-lg min-h-[80px] focus-visible:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) =>
                  setPriority(v as 'HIGH' | 'MEDIUM' | 'LOW')
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground rounded-lg h-10 focus-visible:ring-primary/40">
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

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as 'TODO' | 'IN_PROGRESS' | 'COMPLETED')
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground rounded-lg h-10 focus-visible:ring-primary/40">
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
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Assignees
              {assigneeIds.length > 0 && ` (${assigneeIds.length})`}
            </Label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-background divide-y divide-border">
              {members.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No members found.
                </p>
              ) : (
                members.map((member) => (
                  <label
                    key={member.userId}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent"
                  >
                    <Checkbox
                      checked={assigneeIds.includes(member.userId)}
                      onCheckedChange={(c) =>
                        toggleAssignee(member.userId, c === true)
                      }
                    />
                    <UserAvatar
                      name={member.name || member.email}
                      image={member.image ?? undefined}
                      size="sm"
                    />
                    <span className="text-sm text-foreground truncate">
                      {member.name || member.email}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="task-deadline"
              className="text-sm text-muted-foreground"
            >
              Deadline
            </Label>
            <Input
              id="task-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-background border-border text-foreground rounded-lg h-10 focus-visible:ring-primary/40"
            />
          </div>

          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createMutation.isPending}
              className="border-border bg-transparent text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
              className=" font-semibold"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
