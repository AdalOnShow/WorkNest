import { Link } from '@tanstack/react-router'

export interface ProjectProgressItem {
  id: string
  name: string
  total: number
  completed: number
  percent: number
}

/**
 * Completion per project. A meter list rather than a plotted chart: every
 * value is a part of a fixed whole (100%), so each row is labelled directly
 * and needs no axis, legend or hover layer.
 */
export function ProjectProgress({
  items,
}: {
  items: Array<ProjectProgressItem>
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No projects yet
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {items.map((p) => (
        <li key={p.id}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <Link
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              className="body-sm truncate font-semibold text-foreground hover:underline"
            >
              {p.name}
            </Link>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {p.total === 0
                ? 'No tasks'
                : `${p.completed}/${p.total} · ${p.percent}%`}
            </span>
          </div>
          <div
            role="meter"
            aria-label={`${p.name} completion`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={p.percent}
            aria-valuetext={`${p.percent}% — ${p.completed} of ${p.total} tasks completed`}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-chart-series transition-[width]"
              style={{ width: `${p.percent}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
