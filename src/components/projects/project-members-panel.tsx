import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Clock, Copy, Loader2, Trash2, UserPlus, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { UserAvatar } from '#/components/ui/user-avatar'
import { cn } from '#/lib/utils'
import {
  listProjectMembers,
  removeProjectMember,
} from '#/server-functions/projects'
import {
  listProjectInvitations,
  revokeProjectInvitation,
} from '#/server-functions/invitations'
import { InviteMemberDialog } from './invite-member-dialog'

const ROLE_LABELS = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  TEAM_MEMBER: 'Team Member',
} as const

function daysLeft(expiresAt: number) {
  const days = Math.ceil((expiresAt - Date.now()) / 86_400_000)
  return days <= 0 ? 'Expired' : days === 1 ? '1 day left' : `${days} days left`
}

export function ProjectMembersPanel({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<{
    userId: string
    name: string
  } | null>(null)

  const membersQuery = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers({ data: { projectId } }),
  })
  const myRole = membersQuery.data?.myRole
  const canInvite = myRole === 'ADMIN' || myRole === 'PROJECT_MANAGER'

  const invitesQuery = useQuery({
    queryKey: ['invitations', 'project', projectId],
    queryFn: () =>
      listProjectInvitations({ data: { projectId, pageSize: 50 } }),
    enabled: canInvite,
  })

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) =>
      revokeProjectInvitation({ data: { invitationId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast.success('Invitation revoked')
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Failed to revoke invitation'),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      removeProjectMember({ data: { projectId, userId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['project-members', projectId],
      })
      void queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Member removed')
      setRemoving(null)
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Failed to remove member'),
  })

  async function copyLink(id: string, link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000)
    } catch {
      toast.error('Could not copy the link')
    }
  }

  const members = membersQuery.data?.items ?? []
  const invites = invitesQuery.data?.items ?? []

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-border p-5">
        <div>
          <h2 className="label-lg text-foreground">Members</h2>
          <p className="text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? 'person' : 'people'} in
            this project
          </p>
        </div>
        {canInvite && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4" />
            Invite member
          </Button>
        )}
      </div>

      {membersQuery.isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 px-5 py-3">
              <UserAvatar
                name={m.name}
                image={m.image ?? undefined}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {m.name}
                  {m.isMe && (
                    <span className="ml-1.5 text-muted-foreground font-normal">
                      (you)
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.email}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2.5 py-0.5 text-xs',
                  m.role === 'ADMIN'
                    ? 'border-primary/40 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {ROLE_LABELS[m.role]}
              </span>
              {myRole === 'ADMIN' && !m.isMe && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${m.name}`}
                  onClick={() =>
                    setRemoving({ userId: m.userId, name: m.name })
                  }
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canInvite && invites.length > 0 && (
        <div className="border-t border-border p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Pending invitations
          </h3>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/60 p-3"
              >
                <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {inv.email}
                  </p>
                  <p
                    className={cn(
                      'text-xs',
                      inv.isExpired
                        ? 'text-destructive'
                        : 'text-muted-foreground',
                    )}
                  >
                    {ROLE_LABELS[inv.role]} · {daysLeft(inv.expiresAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {inv.invitationLink && !inv.isExpired && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyLink(inv.id, inv.invitationLink!)}
                    >
                      {copiedId === inv.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-primary" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy link
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className=" text-muted-foreground hover:text-destructive"
                    disabled={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate(inv.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                    {inv.isExpired ? 'Remove' : 'Revoke'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canInvite && (
        <InviteMemberDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          projectId={projectId}
          myRole={myRole}
        />
      )}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove member?"
        description={`${removing?.name ?? 'This person'} will lose access to this project, its tasks and its chat.`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => removing && removeMutation.mutate(removing.userId)}
      />
    </div>
  )
}
