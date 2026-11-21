import { Link } from '@tanstack/react-router'
import { ChevronRight, Mail } from 'lucide-react'
import { cn } from '#/lib/utils'

export const PROJECT_ROLE_LABELS = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  TEAM_MEMBER: 'Team Member',
} as const

export interface PendingInvitation {
  id: string
  token: string
  role: keyof typeof PROJECT_ROLE_LABELS
  projectName: string
  inviterName: string | null
}

/** A pending project invitation: links to the review/accept page. */
export function InvitationRow({
  invitation,
  onNavigate,
  className,
}: {
  invitation: PendingInvitation
  onNavigate?: () => void
  className?: string
}) {
  return (
    <Link
      to="/invitations/$token"
      params={{ token: invitation.token }}
      onClick={onNavigate}
      className={cn(
        'group flex items-start gap-3 border-b border-border/50 border-l-2 border-l-primary bg-primary/5 p-4 transition-colors hover:bg-accent/50',
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Mail className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold leading-none text-foreground">
          Project invitation
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground">
            {invitation.inviterName ?? 'Someone'}
          </span>{' '}
          invited you to{' '}
          <span className="text-foreground">{invitation.projectName}</span> as{' '}
          {PROJECT_ROLE_LABELS[invitation.role]}
        </p>
        <p className="text-xs font-semibold text-primary">Review invitation</p>
      </div>
      <ChevronRight className="w-4 h-4 mt-2 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  )
}
