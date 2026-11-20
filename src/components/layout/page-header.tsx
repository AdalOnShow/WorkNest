import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

/**
 * Page title block. `path` is the mono project path shown above the title
 * (e.g. `Projects / Website Relaunch`), the same signature the landing page
 * previews use. Pass links as nodes so callers keep typed router links.
 */
export function PageHeader({
  title,
  description,
  path,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  path?: Array<ReactNode>
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {path && path.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground"
          >
            {path.map((part, i) => (
              <Fragment key={i}>
                {i > 0 && <span aria-hidden="true">/</span>}
                <span className="truncate">{part}</span>
              </Fragment>
            ))}
          </nav>
        )}
        <h1 className="headline-sm text-foreground">{title}</h1>
        {description && (
          <p className="body-md mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

/** Shared class for links inside a PageHeader path. */
export const pathLinkClass =
  'rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
