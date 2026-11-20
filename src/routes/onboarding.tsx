import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  FolderKanban,
  Info,
  Loader2,
  Mail,
  MessageSquare,
  Sprout,
  Users,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { DatePicker } from '#/components/ui/date-picker'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { UserAvatar } from '#/components/ui/user-avatar'
import { parseLocalDate } from '#/lib/date-utils'
import { cn } from '#/lib/utils'
import { getSession } from '#/server-functions/auth'
import { createProject, getProject } from '#/server-functions/projects'
import {
  createProjectInvitation,
  listMyPendingInvitations,
} from '#/server-functions/invitations'
import {
  completeOnboarding,
  getOnboardingStatus,
} from '#/server-functions/onboarding'

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'project', label: 'Project' },
  { id: 'team', label: 'Team' },
  { id: 'done', label: 'Done' },
] as const

type StepId = (typeof STEPS)[number]['id']
type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'

interface OnboardingSearch {
  step: StepId
  projectId?: string
}

const ROLE_LABELS: Record<Role, string> = {
  TEAM_MEMBER: 'Team Member',
  PROJECT_MANAGER: 'Project Manager',
  ADMIN: 'Admin',
}

export const Route = createFileRoute('/onboarding')({
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => {
    const step = STEPS.some((s) => s.id === search.step)
      ? (search.step as StepId)
      : 'welcome'
    const projectId =
      typeof search.projectId === 'string' ? search.projectId : undefined
    return { step, projectId }
  },
  beforeLoad: async ({ search }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: '/onboarding' } })
    }
    const status = await getOnboardingStatus()
    // Finished users can still see the final screen, nothing else.
    if (status.completed && search.step !== 'done') {
      throw redirect({ to: '/dashboard' })
    }
    // Team and Done need a project; send them back to create one.
    if (
      (search.step === 'team' || search.step === 'done') &&
      !search.projectId
    ) {
      throw redirect({ to: '/onboarding', search: { step: 'project' } })
    }
    return { user: session.user }
  },
  component: OnboardingPage,
  head: () => ({ meta: [{ title: 'Get started — WorkNest' }] }),
})

/* ------------------------------------------------------------------ */

function OnboardingPage() {
  const { step } = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const stepIndex = STEPS.findIndex((s) => s.id === step)

  const skipMutation = useMutation({
    mutationFn: () => completeOnboarding(),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      void navigate({ to: '/dashboard' })
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-ink">
              <Sprout className="size-5 text-ink-foreground" />
            </span>
            <span className="font-semibold text-foreground">WorkNest</span>
          </div>

          <Stepper current={stepIndex} />

          {step !== 'done' ? (
            <button
              type="button"
              onClick={() => skipMutation.mutate()}
              disabled={skipMutation.isPending}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {skipMutation.isPending ? 'Skipping…' : 'Skip setup'}
            </button>
          ) : (
            <span className="w-18" />
          )}
        </div>
        {/* Mobile progress */}
        <div className="sm:hidden px-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2">
            Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex]?.label}
          </p>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full w-full origin-left bg-primary transition-transform duration-500 ease-out"
              style={{
                transform: `scaleX(${(stepIndex + 1) / STEPS.length})`,
              }}
            />
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="relative flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
        <div key={step} className="hiw-rise relative w-full max-w-xl">
          {step === 'welcome' && <WelcomeStep />}
          {step === 'project' && <ProjectStep />}
          {step === 'team' && <TeamStep />}
          {step === 'done' && <DoneStep />}
        </div>
      </main>
    </div>
  )
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="hidden sm:flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-200',
                active && 'border-primary bg-primary text-primary-foreground',
                done && 'border-primary text-primary',
                !active && !done && 'border-border text-muted-foreground',
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                'text-sm transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-8 overflow-hidden bg-border">
                <span
                  className={cn(
                    'block h-full bg-primary transition-transform duration-500 origin-left',
                    done ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function StepCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <p className="text-sm font-semibold text-primary mb-2">{eyebrow}</p>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2">
        {title}
      </h1>
      <p className="text-muted-foreground mb-8">{description}</p>
      {children}
    </div>
  )
}

/* ---------------------------- Step 1 ---------------------------- */

function WelcomeStep() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const firstName = user.name.split(' ')[0] || 'there'
  const { data: invites = [] } = useQuery({
    queryKey: ['invitations', 'mine'],
    queryFn: () => listMyPendingInvitations(),
  })

  const plan = [
    {
      icon: FolderKanban,
      title: 'Create your first project',
      text: 'A home for your team’s tasks, chat and deadlines.',
    },
    {
      icon: Users,
      title: 'Invite your team',
      text: 'Share invite links and give everyone a role.',
    },
    {
      icon: MessageSquare,
      title: 'Start working together',
      text: 'Add tasks, comment and chat in real time.',
    },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="hiw-pop mb-5" style={{ animationDelay: '150ms' }}>
          <UserAvatar
            name={user.name}
            image={user.image ?? undefined}
            size="lg"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2">
          Welcome to WorkNest, {firstName}
        </h1>
        <p className="text-muted-foreground max-w-md">
          Let’s set up your workspace. You can skip any step.
        </p>
      </div>

      {invites.length > 0 && (
        <div className="hiw-rise mt-8" style={{ animationDelay: '250ms' }}>
          <p className="mb-3 text-sm font-semibold text-foreground">
            You’ve been invited to join
          </p>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li key={inv.id}>
                <Link
                  to="/invitations/$token"
                  params={{ token: inv.token }}
                  className="group flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 hover:bg-primary/10 transition-colors"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Mail className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {inv.projectName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {inv.inviterName ?? 'Someone'} invited you as{' '}
                      {inv.role === 'PROJECT_MANAGER'
                        ? 'Project Manager'
                        : inv.role === 'ADMIN'
                          ? 'Admin'
                          : 'Team Member'}
                    </p>
                  </div>
                  <span className="hidden sm:inline text-sm font-semibold text-primary">
                    Review
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Or set up your own project:
          </p>
        </div>
      )}

      <ol className={cn('space-y-3', invites.length > 0 ? 'mt-3' : 'mt-8')}>
        {plan.map((item, i) => (
          <li
            key={item.title}
            className="hiw-rise flex items-start gap-4 rounded-xl border border-border bg-background/60 p-4"
            style={{ animationDelay: `${300 + i * 120}ms` }}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <item.icon className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-background/60 px-4 py-3 text-sm">
        <span className="truncate text-muted-foreground">
          Signed in as <span className="text-foreground">{user.email}</span>
        </span>
        <Link to="/settings" className="shrink-0 text-primary hover:underline">
          Edit profile
        </Link>
      </div>

      <Button
        size="lg"
        className="mt-8 w-full"
        onClick={() =>
          void navigate({ to: '/onboarding', search: { step: 'project' } })
        }
      >
        Let’s get started <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}

/* ---------------------------- Step 2 ---------------------------- */

function ProjectStep() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      createProject({
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          deadline: deadline ? parseLocalDate(deadline).getTime() : undefined,
        },
      }),
    onSuccess: ({ id }) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Project created')
      void navigate({
        to: '/onboarding',
        search: { step: 'team', projectId: id },
        replace: true,
      })
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Failed to create project'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate()
  }

  return (
    <StepCard
      eyebrow="Step 2 of 4"
      title="Create your first project"
      description="Projects hold your tasks, members and chat. You’ll be its admin."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="ob-name">
            Project name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ob-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website Relaunch"
            className="h-11 rounded-lg bg-background"
            autoFocus
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ob-description">
            Description{' '}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Textarea
            id="ob-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            className="min-h-22 rounded-lg bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ob-deadline">
            Deadline{' '}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <DatePicker
            id="ob-deadline"
            value={deadline}
            onChange={setDeadline}
            disablePast
            className="h-11"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              void navigate({ to: '/onboarding', search: { step: 'welcome' } })
            }
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Create project <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </StepCard>
  )
}

/* ---------------------------- Step 3 ---------------------------- */

interface SentInvite {
  email: string
  role: Role
  link: string
}

function TeamStep() {
  const { projectId } = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('TEAM_MEMBER')
  const [invites, setInvites] = useState<Array<SentInvite>>([])
  const [copied, setCopied] = useState<string | null>(null)

  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => getProject({ data: { projectId: projectId! } }),
    enabled: Boolean(projectId),
  })

  const inviteMutation = useMutation({
    mutationFn: () =>
      createProjectInvitation({
        data: { projectId: projectId!, email: email.trim(), role },
      }),
    onSuccess: (result) => {
      setInvites((prev) => [
        { email: email.trim(), role, link: result.invitationLink },
        ...prev,
      ])
      setEmail('')
      setRole('TEAM_MEMBER')
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Failed to create invitation'),
  })

  const finishMutation = useMutation({
    mutationFn: () => completeOnboarding(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void navigate({
        to: '/onboarding',
        search: { step: 'done', projectId },
      })
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  })

  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(link)
      setTimeout(() => setCopied((c) => (c === link ? null : c)), 2000)
    } catch {
      toast.error('Could not copy the link')
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    inviteMutation.mutate()
  }

  return (
    <StepCard
      eyebrow="Step 3 of 4"
      title="Invite your team"
      description={`Add people to ${project?.name ?? 'your project'} and choose what they can do.`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <Label htmlFor="ob-email" className="sr-only">
          Email address
        </Label>
        <Input
          id="ob-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className="h-11 flex-1 rounded-lg bg-background"
          autoFocus
        />
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger
            aria-label="Role"
            className="h-11! rounded-lg bg-background sm:w-42.5"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ROLE_LABELS) as Array<Role>).map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          className="h-11"
          disabled={!email.trim() || inviteMutation.isPending}
        >
          {inviteMutation.isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Invite
        </Button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        {role === 'ADMIN' && 'Admins can manage project settings and members.'}
        {role === 'PROJECT_MANAGER' &&
          'Project Managers can manage tasks and invite members.'}
        {role === 'TEAM_MEMBER' &&
          'Team Members can view and work on their tasks.'}
      </p>

      {/* Sent invites */}
      <div className="mt-6">
        {invites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Users className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              People you invite will show up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.link}
                className="hiw-rise flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3"
              >
                <UserAvatar name={inv.email} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {inv.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[inv.role]} · Invite link ready
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => void copy(inv.link)}
                >
                  {copied === inv.link ? (
                    <>
                      <Check className="size-3.5 text-primary" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" /> Copy link
                    </>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 flex gap-2.5 rounded-xl bg-background/60 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p>
          WorkNest doesn’t send emails. Copy each link and share it with your
          teammate. They must sign in with the same email you invited to accept.
          Links expire after 7 days, and you can invite more people later from
          the project’s Members page.
        </p>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          size="lg"
          variant={invites.length ? 'default' : 'outline'}
          disabled={finishMutation.isPending}
          onClick={() => finishMutation.mutate()}
        >
          {finishMutation.isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {invites.length ? 'Continue' : 'I’ll do this later'}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </StepCard>
  )
}

/* ---------------------------- Step 4 ---------------------------- */

function DoneStep() {
  const { projectId } = Route.useSearch()
  const navigate = useNavigate()

  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => getProject({ data: { projectId: projectId! } }),
    enabled: Boolean(projectId),
  })

  const next = [
    'Add your first tasks with a priority and due date',
    'Say hello in the project chat',
    'Track progress from your dashboard',
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center">
      <span
        className="hiw-pop mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-primary"
        style={{ animationDelay: '150ms' }}
      >
        <Check className="size-7 text-primary-foreground" />
      </span>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2">
        You’re all set!
      </h1>
      <p className="text-muted-foreground">
        {project ? (
          <>
            <span className="text-foreground">{project.name}</span> is ready for
            your team.
          </>
        ) : (
          'Your workspace is ready.'
        )}
      </p>

      <ul className="mx-auto mt-8 max-w-sm space-y-2.5 text-left">
        {next.map((item, i) => (
          <li
            key={item}
            className="hiw-rise flex items-center gap-3 text-sm text-foreground"
            style={{ animationDelay: `${350 + i * 120}ms` }}
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={() => void navigate({ to: '/dashboard' })}
        >
          Go to dashboard
        </Button>
        <Button
          size="lg"
          onClick={() =>
            void navigate({
              to: '/projects/$projectId',
              params: { projectId: projectId! },
            })
          }
        >
          Open project <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
