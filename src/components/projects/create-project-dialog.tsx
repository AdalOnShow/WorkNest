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
import { createProject } from '#/server-functions/projects'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      createProject({
        data: {
          name,
          description: description || undefined,
          deadline: deadline ? new Date(deadline).getTime() : undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created')
      onOpenChange(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create project')
    },
  })

  function resetForm() {
    setName('')
    setDescription('')
    setDeadline('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate()
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#172318] border-[#2D3B2A] text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Project</DialogTitle>
          <DialogDescription className="text-[#B8C0B5]">
            Add a new project to your workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label
              htmlFor="project-name"
              className="text-sm text-[#B8C0B5]"
            >
              Name <span className="text-[#FF5A5F]">*</span>
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="bg-[#121212] border-[#2D3B2A] text-white placeholder:text-[#6B7280] rounded-lg h-10 focus-visible:ring-[#68EF3F]/40"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="project-description"
              className="text-sm text-[#B8C0B5]"
            >
              Description
            </Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              className="bg-[#121212] border-[#2D3B2A] text-white placeholder:text-[#6B7280] rounded-lg min-h-[80px] focus-visible:ring-[#68EF3F]/40"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="project-deadline"
              className="text-sm text-[#B8C0B5]"
            >
              Deadline
            </Label>
            <Input
              id="project-deadline"
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
              onClick={() => handleOpenChange(false)}
              disabled={createMutation.isPending}
              className="border-[#2D3B2A] bg-transparent text-white hover:bg-[#1F331D] rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="bg-[#68EF3F] text-[#273F2B] hover:bg-[#5BE337] rounded-full font-medium"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
