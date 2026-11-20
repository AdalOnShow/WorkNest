import { Button } from '#/components/ui/button'
import { LoadingState } from '#/components/ui/loading-state'
import {
  acceptProjectInvitation,
  getProjectInvitation,
  rejectProjectInvitation,
} from '#/server-functions/invitations'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderKanban,
  Loader2,
  Mail,
  User,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/invitations/$token')({
  component: InvitationPage,
  head: () => ({
    meta: [{ title: 'Project Invitation — WorkNest' }],
  }),
})

function InvitationPage() {
  const { token } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => getProjectInvitation({ data: { token } }),
  })

  const acceptMutation = useMutation({
    mutationFn: () => acceptProjectInvitation({ data: { token } }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('You joined the project')
      if (result.projectId) {
        navigate({
          to: '/projects/$projectId',
          params: { projectId: result.projectId },
        })
      } else {
        navigate({ to: '/projects' })
      }
    },
    onError: (err: Error) => {
      if (err.message === 'Unauthorized') {
        toast.info('Sign in to accept this invitation')
        void navigate({
          to: '/login',
          search: { redirect: `/invitations/${token}` },
        })
        return
      }
      toast.error(err.message || 'Failed to accept invitation')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectProjectInvitation({ data: { token } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast.success('Invitation declined')
      navigate({ to: '/projects' })
    },
    onError: (err: Error) => {
      if (err.message === 'Unauthorized') {
        toast.info('Sign in to respond to this invitation')
        void navigate({
          to: '/login',
          search: { redirect: `/invitations/${token}` },
        })
        return
      }
      toast.error(err.message || 'Failed to decline invitation')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState variant="detail" />
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Invitation Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              This invitation link is invalid or has been removed.
            </p>
            <Link to="/projects">
              <Button>Go to Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (invitation.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Invitation Expired
            </h1>
            <p className="text-muted-foreground mb-6">
              This invitation has expired. Please ask the project admin to send
              a new one.
            </p>
            <Link to="/projects">
              <Button>Go to Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (invitation.isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Already Accepted
            </h1>
            <p className="text-muted-foreground mb-6">
              You have already accepted this invitation.
            </p>
            <Link
              to="/projects/$projectId"
              params={{ projectId: invitation.projectId }}
            >
              <Button>Go to Project</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (invitation.isRejected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Invitation Declined
            </h1>
            <p className="text-muted-foreground mb-6">
              You have already declined this invitation.
            </p>
            <Link to="/projects">
              <Button>Go to Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const roleLabels = {
    ADMIN: 'Admin',
    PROJECT_MANAGER: 'Project Manager',
    TEAM_MEMBER: 'Team Member',
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FolderKanban className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-xl font-semibold text-foreground text-center mb-2">
            Project Invitation
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            You've been invited to join a project
          </p>

          <div className="space-y-4 mb-6">
            <div className="rounded-lg bg-accent/50 border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Project</p>
              <p className="font-semibold text-foreground">
                {invitation.projectName}
              </p>
              {invitation.projectDescription && (
                <p className="text-sm text-muted-foreground mt-1">
                  {invitation.projectDescription}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-accent/50 border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Invited by</p>
                </div>
                <p className="font-semibold text-foreground">
                  {invitation.inviterName || invitation.inviterEmail}
                </p>
              </div>

              <div className="rounded-lg bg-accent/50 border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Your role</p>
                </div>
                <p className="font-semibold text-foreground">
                  {roleLabels[invitation.role]}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              className="flex-1 border-border bg-transparent text-foreground hover:bg-accent"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Decline
            </Button>
            <Button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
              className="flex-1 font-semibold"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Accept Invitation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
