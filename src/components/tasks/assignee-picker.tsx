import { Checkbox } from '#/components/ui/checkbox'
import { Label } from '#/components/ui/label'
import { UserAvatar } from '#/components/ui/user-avatar'
import { listProjectMembers } from '#/server-functions/projects'
import { useQuery } from '@tanstack/react-query'

interface AssigneePickerProps {
  projectId: string
  value: Array<string>
  onChange: (ids: Array<string>) => void
  disabled?: boolean
  enabled?: boolean
}

/** Multi-select list of a project's members. */
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
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">
        Assignees{value.length > 0 && ` (${value.length})`}
      </Label>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-background divide-y divide-border">
        {members.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No members found.</p>
        ) : (
          members.map((member) => (
            <label
              key={member.userId}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent"
            >
              <Checkbox
                checked={value.includes(member.userId)}
                disabled={disabled}
                onCheckedChange={(c) => toggle(member.userId, c === true)}
              />
              <UserAvatar
                name={member.name || member.email}
                image={member.image ?? undefined}
                size="sm"
              />
              <span className="text-sm text-foreground truncate">
                {member.name || member.email}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}
