import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FolderKanban, Hash } from 'lucide-react'
import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/utils'
import { listProjects } from '#/server-functions/projects'

interface ChatProjectListProps {
  selectedProjectId?: string
}

/** Projects the user belongs to; each one is a chat room. */
export function ChatProjectList({ selectedProjectId }: ChatProjectListProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects', 'chat-rooms'],
    queryFn: () => listProjects({ data: { pageSize: 100 } }),
  })
  const projects = data?.items ?? []

  return (
    <nav aria-label="Project chats" className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-xl font-semibold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground">One chat per project</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="px-2 py-6 text-sm text-muted-foreground">
            Couldn't load projects.{' '}
            <button
              type="button"
              onClick={() => void refetch()}
              className="font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <FolderKanban className="mb-3 size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Join or create a project to start chatting
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => {
              const selected = project.id === selectedProjectId
              return (
                <li key={project.id}>
                  <Link
                    to="/messages"
                    search={{ projectId: project.id }}
                    aria-current={selected ? 'page' : undefined}
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'bg-accent font-semibold text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                    )}
                  >
                    <Hash
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="truncate">{project.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </nav>
  )
}
