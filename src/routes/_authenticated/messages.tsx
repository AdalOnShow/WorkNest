import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'
import { ChatProjectList } from '#/components/chat/chat-project-list'
import { ChatRoomPanel } from '#/components/chat/chat-room-panel'
import { cn } from '#/lib/utils'

interface MessagesSearch {
  projectId?: string
}

export const Route = createFileRoute('/_authenticated/messages')({
  // The open room lives in the URL so it survives reloads and can be linked.
  validateSearch: (search: Record<string, unknown>): MessagesSearch => ({
    projectId:
      typeof search.projectId === 'string' && search.projectId.length > 0
        ? search.projectId
        : undefined,
  }),
  component: MessagesPage,
  head: () => ({
    meta: [{ title: 'Messages — WorkNest' }],
  }),
})

function MessagesPage() {
  const { projectId } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    // Fill the viewport below the 4rem header (and above the 4rem mobile nav).
    <div className="flex h-[calc(100dvh-8rem)] min-h-0 md:h-[calc(100dvh-4rem)]">
      {/* On mobile, show either the list or the open room. */}
      <aside
        className={cn(
          'min-h-0 w-full shrink-0 flex-col border-border md:flex md:w-60 md:border-r lg:w-72 xl:w-80',
          projectId ? 'hidden' : 'flex',
        )}
      >
        <ChatProjectList selectedProjectId={projectId} />
      </aside>

      <div
        className={cn(
          'min-h-0 min-w-0 flex-1',
          projectId ? 'flex' : 'hidden md:flex',
        )}
      >
        {projectId ? (
          // Keyed so drafts, scroll position and the socket reset per room.
          <ChatRoomPanel
            key={projectId}
            projectId={projectId}
            onBack={() => void navigate({ search: {} })}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <MessageSquare className="h-7 w-7 text-accent-foreground" />
            </div>
            <h2 className="mb-1 text-lg font-bold text-foreground">
              Pick a project
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Every project has its own chat room. Choose one on the left to
              start talking with its members.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
