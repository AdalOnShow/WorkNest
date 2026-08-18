import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/messages')({
  component: MessagesPage,
})

function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Messages
      </h2>
      <p className="text-muted-foreground max-w-md">
        Real-time messaging between team members is coming soon. Stay tuned for direct and group conversations.
      </p>
    </div>
  )
}
