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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { createProjectInvitation } from '#/server-functions/invitations'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy, Check, Loader2, Mail } from 'lucide-react'

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  projectId,
}: InviteMemberDialogProps) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'>('TEAM_MEMBER')
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const inviteMutation = useMutation({
    mutationFn: () =>
      createProjectInvitation({
        data: {
          projectId,
          email,
          role,
        },
      }),
    onSuccess: (result) => {
      setInvitationLink(result.invitationLink)
      toast.success('Invitation created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invitation')
    },
  })

  function resetForm() {
    setEmail('')
    setRole('TEAM_MEMBER')
    setInvitationLink(null)
    setCopied(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    inviteMutation.mutate()
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  async function copyToClipboard() {
    if (!invitationLink) return
    try {
      await navigator.clipboard.writeText(invitationLink)
      setCopied(true)
      toast.success('Invitation link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Invite Member</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Send an invitation link to add a new member to this project.
          </DialogDescription>
        </DialogHeader>

        {invitationLink ? (
          <div className="space-y-4 mt-2">
            <div className="rounded-lg bg-accent/50 border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Invitation Link Ready
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Share this link with <span className="font-medium text-foreground">{email}</span>. 
                The link expires in 7 days.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={invitationLink}
                  readOnly
                  className="bg-background border-border text-foreground text-sm h-9"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="h-9 w-9 shrink-0 border-border hover:bg-accent"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="border-border bg-transparent text-foreground hover:bg-accent rounded-full"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-sm text-muted-foreground">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 rounded-lg h-10 focus-visible:ring-primary/40"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER')}
              >
                <SelectTrigger className="bg-background border-border text-foreground rounded-lg h-10 focus-visible:ring-primary/40">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectGroup>
                    <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                    <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === 'ADMIN' && 'Can manage project settings and members'}
                {role === 'PROJECT_MANAGER' && 'Can manage tasks and invite members'}
                {role === 'TEAM_MEMBER' && 'Can view and work on assigned tasks'}
              </p>
            </div>

            <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={inviteMutation.isPending}
                className="border-border bg-transparent text-foreground hover:bg-accent rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!email.trim() || inviteMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/85 rounded-full font-medium"
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}