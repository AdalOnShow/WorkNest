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
import {
  createProjectInvitation,
  listInvitableProjects,
} from '#/server-functions/invitations'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bell, Check, Copy, Loader2, Mail } from 'lucide-react'

type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Fixed project. When omitted, the dialog shows a project picker. */
  projectId?: string
  /** The inviter's role in `projectId`. Project Managers can't grant Admin. */
  myRole?: Role
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  projectId: fixedProjectId,
  myRole: fixedRole,
}: InviteMemberDialogProps) {
  const queryClient = useQueryClient()
  const [pickedProjectId, setPickedProjectId] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('TEAM_MEMBER')
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: invitableProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['invitations', 'invitable-projects'],
    queryFn: () => listInvitableProjects(),
    enabled: open && !fixedProjectId,
  })

  const projectId = fixedProjectId ?? pickedProjectId
  const myRole =
    fixedRole ?? invitableProjects?.find((p) => p.id === pickedProjectId)?.role
  const canInviteAdmin = myRole !== 'PROJECT_MANAGER'

  const inviteMutation = useMutation({
    mutationFn: () =>
      createProjectInvitation({ data: { projectId, email, role } }),
    onSuccess: (result) => {
      setInvitationLink(result.invitationLink)
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast.success('Invitation sent')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invitation')
    },
  })

  function resetForm() {
    setPickedProjectId('')
    setEmail('')
    setRole('TEAM_MEMBER')
    setInvitationLink(null)
    setCopied(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !projectId) return
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

  const noInvitableProjects =
    !fixedProjectId && !projectsLoading && invitableProjects?.length === 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Invite Member</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Invite someone to join a project with a role.
          </DialogDescription>
        </DialogHeader>

        {invitationLink ? (
          <div className="space-y-4 mt-2">
            <div className="rounded-lg bg-accent/50 border border-border p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Bell className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{email}</span> will see this
                  invitation in their notifications when they sign in with that
                  email.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Not on WorkNest yet? Share this link with them. It expires in
                  7 days.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={invitationLink}
                  readOnly
                  className="bg-background border-border text-foreground text-sm h-9"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copy invitation link"
                  onClick={() => void copyToClipboard()}
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
                onClick={() => {
                  setEmail('')
                  setInvitationLink(null)
                  setCopied(false)
                }}
                className="border-border bg-transparent text-foreground hover:bg-accent"
              >
                Invite another
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : noInvitableProjects ? (
          <p className="text-sm text-muted-foreground mt-2">
            You need to be an Admin or Project Manager of a project to invite
            people. Create a project first, or ask a project admin.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {!fixedProjectId && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Project <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={pickedProjectId}
                  onValueChange={(v) => {
                    setPickedProjectId(v)
                    setRole('TEAM_MEMBER')
                  }}
                  disabled={projectsLoading}
                >
                  <SelectTrigger className="w-full bg-background border-border text-foreground rounded-lg h-10">
                    <SelectValue
                      placeholder={
                        projectsLoading ? 'Loading…' : 'Choose a project'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectGroup>
                      {invitableProjects?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="invite-email"
                className="text-sm text-muted-foreground"
              >
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
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-full bg-background border-border text-foreground rounded-lg h-10 focus-visible:ring-primary/40">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectGroup>
                    <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                    <SelectItem value="PROJECT_MANAGER">
                      Project Manager
                    </SelectItem>
                    {canInviteAdmin && (
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === 'ADMIN' && 'Can manage project settings and members'}
                {role === 'PROJECT_MANAGER' &&
                  'Can manage tasks and invite members'}
                {role === 'TEAM_MEMBER' &&
                  'Can view and work on assigned tasks'}
              </p>
            </div>

            <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={inviteMutation.isPending}
                className="border-border bg-transparent text-foreground hover:bg-accent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !email.trim() || !projectId || inviteMutation.isPending
                }
                className=" font-semibold"
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
