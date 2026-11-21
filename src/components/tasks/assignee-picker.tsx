import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Label } from '#/components/ui/label'
import { listProjectMembers } from '#/server-functions/projects'
import { cn } from '#/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'

interface AssigneePickerProps {
  projectId: string
  value: Array<string>
  onChange: (ids: Array<string>) => void
  disabled?: boolean
  enabled?: boolean
}

const MAX_NAME_CHARS = 10

function shortName(name: string | null, email: string) {
  const base = (name?.trim() || email.split('@')[0] || '').split(/\s+/)[0] ?? ''
  const chars = Array.from(base)
  return chars.length > MAX_NAME_CHARS
    ? `${chars.slice(0, MAX_NAME_CHARS).join('')}…`
    : base
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Multi-select grid of a project's members, like a "share with friends" sheet. */
export function AssigneePicker({
  projectId,
  value,
  onChange,
  disabled,
  enabled = true,
}: AssigneePickerProps) {
  const { data } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => listProjectMembers({ data: { projectId } }),
    enabled,
  })
  const members = data?.items ?? []

  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...value, id] : value.filter((x) => x !== id))
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">
        Assignees{value.length > 0 && ` (${value.length})`}
      </Label>
      {members.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">No members found.</p>
      ) : (
        <div className="max-h-36 overflow-y-auto rounded-lg border border-border bg-background p-2">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-1 gap-y-2">
            {members.map((member) => {
              const selected = value.includes(member.userId)
              const label = member.name || member.email
              return (
                <button
                  key={member.userId}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  aria-label={label}
                  title={label}
                  disabled={disabled}
                  onClick={() => toggle(member.userId, !selected)}
                  className="flex flex-col items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative">
                    <Avatar
                      className={cn(
                        'size-11 border border-border transition-shadow',
                        selected &&
                          'ring-2 ring-primary ring-offset-2 ring-offset-background',
                      )}
                    >
                      <AvatarImage
                        src={member.image ?? undefined}
                        alt={label}
                      />
                      <AvatarFallback className="bg-accent text-card-foreground font-semibold text-sm">
                        {initials(label)}
                      </AvatarFallback>
                    </Avatar>
                    {selected && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-xs leading-tight text-center w-full',
                      selected
                        ? 'font-semibold text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {shortName(member.name, member.email)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
