import { UserAvatar } from '#/components/ui/user-avatar'
import type { TaskAssignee } from '#/server-functions/tasks'

/** Overlapping avatars for a task's assignees, or an em dash when none. */
export function AssigneeStack({
  assignees,
  max = 3,
}: {
  assignees: Array<TaskAssignee>
  max?: number
}) {
  if (assignees.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }
  const shown = assignees.slice(0, max)
  const extra = assignees.length - shown.length
  return (
    <div
      className="flex items-center -space-x-2"
      title={assignees.map((a) => a.name).join(', ')}
    >
      {shown.map((a) => (
        <UserAvatar
          key={a.id}
          name={a.name}
          image={a.image ?? undefined}
          size="sm"
        />
      ))}
      {extra > 0 && (
        <span className="w-8 h-8 rounded-full border border-border bg-accent text-xs font-semibold flex items-center justify-center text-card-foreground">
          +{extra}
        </span>
      )}
    </div>
  )
}
