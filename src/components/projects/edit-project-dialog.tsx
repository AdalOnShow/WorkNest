import { useEffect, useState } from 'react'
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
import { updateProject } from '#/server-functions/projects'
import { parseLocalDate, timestampToLocalDateString } from '#/lib/date-utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: {
    id: string
    name: string
    description?: string | null
    status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
    deadline?: number | null
  }
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
}: EditProjectDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [status, setStatus] = useState(project.status)
  const [deadline, setDeadline] = useState(() => {
    if (!project.deadline) return ''
    return timestampToLocalDateString(project.deadline)
  })

  useEffect(() => {
    if (open) {
      setName(project.name)
      setDescription(project.description || '')
      setStatus(project.status)
      setDeadline(() => {
        if (!project.deadline) return ''
        return timestampToLocalDateString(project.deadline)
      })
    }
  }, [open, project.id, project.name, project.description, project.status, project.deadline])

  const updateMutation = useMutation({
    mutationFn: () =>
      updateProject({
        data: {
          projectId: project.id,
          name: name.trim(),
          description: description,
          status,
          deadline: deadline ? parseLocalDate(deadline).getTime() : null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      toast.success('Project updated')
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update project')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    updateMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Project</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your project details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label
              htmlFor="edit-project-name"
              className="text-sm text-muted-foreground"
            >
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 rounded-lg h-10 focus-visible:ring-primary/40"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="edit-project-description"
              className="text-sm text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="edit-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 rounded-lg min-h-[80px] focus-visible:ring-primary/40"
            />
          </div>

          <div className="space-y-2">
            <Label id="edit-project-status-label" className="text-sm text-muted-foreground">Status</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(v as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD')
              }
            >
              <SelectTrigger aria-labelledby="edit-project-status-label" className="w-full bg-background border-border text-foreground rounded-lg h-10 focus-visible:ring-primary/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectGroup>
                  <SelectItem
                    value="ACTIVE"
                    className="text-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    Active
                  </SelectItem>
                  <SelectItem
                    value="ON_HOLD"
                    className="text-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    On Hold
                  </SelectItem>
                  <SelectItem
                    value="COMPLETED"
                    className="text-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    Completed
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="edit-project-deadline"
              className="text-sm text-muted-foreground"
            >
              Deadline
            </Label>
            <Input
              id="edit-project-deadline"
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
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="border-border bg-transparent text-foreground hover:bg-accent rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || updateMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-medium"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
