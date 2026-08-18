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
    const d = new Date(project.deadline)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (open) {
      setName(project.name)
      setDescription(project.description || '')
      setStatus(project.status)
      setDeadline(() => {
        if (!project.deadline) return ''
        const d = new Date(project.deadline)
        return d.toISOString().split('T')[0]
      })
    }
  }, [open, project])

  const updateMutation = useMutation({
    mutationFn: () =>
      updateProject({
        data: {
          projectId: project.id,
          name: name.trim() || project.name,
          description: description || undefined,
          status,
          deadline: deadline ? new Date(deadline).getTime() : null,
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
      <DialogContent className="bg-[#172318] border-[#2D3B2A] text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Project</DialogTitle>
          <DialogDescription className="text-[#B8C0B5]">
            Update your project details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label
              htmlFor="edit-project-name"
              className="text-sm text-[#B8C0B5]"
            >
              Name <span className="text-[#FF5A5F]">*</span>
            </Label>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="bg-[#121212] border-[#2D3B2A] text-white placeholder:text-[#6B7280] rounded-lg h-10 focus-visible:ring-[#68EF3F]/40"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="edit-project-description"
              className="text-sm text-[#B8C0B5]"
            >
              Description
            </Label>
            <Textarea
              id="edit-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              className="bg-[#121212] border-[#2D3B2A] text-white placeholder:text-[#6B7280] rounded-lg min-h-[80px] focus-visible:ring-[#68EF3F]/40"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-[#B8C0B5]">Status</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(v as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD')
              }
            >
              <SelectTrigger
                className="w-full bg-[#121212] border-[#2D3B2A] text-white rounded-lg h-10 focus-visible:ring-[#68EF3F]/40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#172318] border-[#2D3B2A]">
                <SelectGroup>
                  <SelectItem
                    value="ACTIVE"
                    className="text-white focus:bg-[#1F331D] focus:text-white"
                  >
                    Active
                  </SelectItem>
                  <SelectItem
                    value="ON_HOLD"
                    className="text-white focus:bg-[#1F331D] focus:text-white"
                  >
                    On Hold
                  </SelectItem>
                  <SelectItem
                    value="COMPLETED"
                    className="text-white focus:bg-[#1F331D] focus:text-white"
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
              className="text-sm text-[#B8C0B5]"
            >
              Deadline
            </Label>
            <Input
              id="edit-project-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-[#121212] border-[#2D3B2A] text-white rounded-lg h-10 focus-visible:ring-[#68EF3F]/40"
            />
          </div>

          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="border-[#2D3B2A] bg-transparent text-white hover:bg-[#1F331D] rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || updateMutation.isPending}
              className="bg-[#68EF3F] text-[#273F2B] hover:bg-[#5BE337] rounded-full font-medium"
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
