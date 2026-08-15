import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { UserAvatar } from '#/components/ui/user-avatar'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Send, Trash2, Upload } from 'lucide-react'
import { useId, useState } from 'react'

export const Route = createFileRoute('/_authenticated/tasks/$taskId')({
  component: TaskDetailPage,
  head: () => ({
    meta: [{ title: 'Task — WorkNest' }],
  }),
})

const MOCK_TASK = {
  id: '1',
  title: 'Fix login bug',
  description:
    'Users are unable to log in when using special characters in their password. The authentication service is not properly sanitizing input before hashing.',
  status: 'IN_PROGRESS' as const,
  priority: 'HIGH' as const,
  assignee: 'John D.',
  due: 'Feb 20',
}

const MOCK_ATTACHMENTS = [
  { id: '1', name: 'screenshot.png', size: '245 KB' },
  { id: '2', name: 'design-v2.jpg', size: '1.2 MB' },
]

const MOCK_COMMENTS = [
  {
    id: '1',
    author: 'John D.',
    text: 'Working on this now...',
    time: '2 hours ago',
    isOwn: false,
  },
  {
    id: '2',
    author: 'Jane S.',
    text: 'Looks good!',
    time: '1 hour ago',
    isOwn: false,
  },
]

function TaskDetailPage() {
  const { taskId } = Route.useParams()
  const [comment, setComment] = useState('')
  const statusLabelId = useId()
  const priorityLabelId = useId()

  return (
    <PageContainer>
      <div className="space-y-6">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>

        <div className="flex items-start justify-between">
          <h1 className="headline-sm text-foreground">{MOCK_TASK.title}</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-card-foreground hover:bg-accent"
            >
              <Pencil data-icon="inline-start" className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-destructive hover:bg-destructive/10"
            >
              <Trash2 data-icon="inline-start" className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info */}
            <div className="bg-card border border-border rounded-[14px] p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    id={statusLabelId}
                    className="label-sm text-muted-foreground block mb-2"
                  >
                    Status
                  </label>
                  <Select defaultValue={MOCK_TASK.status}>
                    <SelectTrigger
                      aria-labelledby={statusLabelId}
                      className="bg-background border-border text-foreground rounded-lg"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectGroup>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    id={priorityLabelId}
                    className="label-sm text-muted-foreground block mb-2"
                  >
                    Priority
                  </label>
                  <Select defaultValue={MOCK_TASK.priority}>
                    <SelectTrigger
                      aria-labelledby={priorityLabelId}
                      className="bg-background border-border text-foreground rounded-lg"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectGroup>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="label-sm text-muted-foreground block mb-2">
                    Assignee
                  </label>
                  <p className="body-sm text-foreground">
                    {MOCK_TASK.assignee}
                  </p>
                </div>
                <div>
                  <label className="label-sm text-muted-foreground block mb-2">
                    Due Date
                  </label>
                  <p className="body-sm text-foreground">{MOCK_TASK.due}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card border border-border rounded-[14px] p-6">
              <h3 className="label-lg text-foreground mb-3">Description</h3>
              <p className="body-md text-card-foreground leading-relaxed">
                {MOCK_TASK.description}
              </p>
            </div>

            {/* Comments */}
            <div className="bg-card border border-border rounded-[14px] p-6">
              <h3 className="label-lg text-foreground mb-4">
                Comments ({MOCK_COMMENTS.length})
              </h3>
              <div className="space-y-4">
                {MOCK_COMMENTS.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <UserAvatar name={c.author} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="label-sm text-foreground">
                          {c.author}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {c.time}
                        </span>
                      </div>
                      <p className="body-sm text-card-foreground mt-1">
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                <UserAvatar name="You" size="sm" />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    aria-label={`Comment on ${MOCK_TASK.title}`}
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-1 h-10 px-4 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  <Button
                    size="icon"
                    aria-label="Send comment"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-[14px] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="label-lg text-foreground">Attachments</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-card-foreground hover:bg-accent"
                >
                  <Upload data-icon="inline-start" className="w-4 h-4" />
                  Upload
                </Button>
              </div>
              <div className="space-y-2">
                {MOCK_ATTACHMENTS.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                        <span className="text-xs text-muted-foreground">
                          📄
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.size}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete attachment ${file.name}`}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-accent shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
