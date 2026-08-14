import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Pencil, Trash2, Plus } from 'lucide-react'
import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import { StatusBadge } from '#/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { SearchInput } from '#/components/ui/search-input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Pagination } from '#/components/ui/pagination-controls'

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  component: ProjectDetailPage,
  head: () => ({
    meta: [{ title: 'Project — WorkNest' }],
  }),
})

const MOCK_PROJECT = {
  id: '1',
  name: 'Website Redesign',
  description:
    'Complete redesign of the company website with new branding and improved UX.',
  status: 'ACTIVE' as const,
  deadline: 'Mar 15',
}

const MOCK_TASKS = [
  {
    id: '1',
    title: 'Fix login bug',
    assignee: 'John D.',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    due: 'Feb 20',
  },
  {
    id: '2',
    title: 'Add tests',
    assignee: 'Jane S.',
    status: 'TODO' as const,
    priority: 'MEDIUM' as const,
    due: 'Feb 25',
  },
  {
    id: '3',
    title: 'Design UI',
    assignee: 'Mike R.',
    status: 'COMPLETED' as const,
    priority: 'LOW' as const,
    due: '—',
  },
]

const MOCK_MEMBERS = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'ADMIN' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'PM' },
  { id: '3', name: 'Mike Ross', email: 'mike@example.com', role: 'MEMBER' },
]

const MOCK_MESSAGES = [
  {
    id: '1',
    author: 'John D.',
    text: 'Hey team, ready to start?',
    time: '10:30 AM',
    isOwn: false,
  },
  {
    id: '2',
    author: 'Jane S.',
    text: "Yes! Let's go.",
    time: '10:32 AM',
    isOwn: false,
  },
  {
    id: '3',
    author: 'You',
    text: "I'll handle the frontend.",
    time: '10:35 AM',
    isOwn: true,
  },
]

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const [taskSearch, setTaskSearch] = useState('')
  const [taskPage, setTaskPage] = useState(1)

  return (
    <PageContainer>
      <div className="space-y-6">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="headline-sm text-foreground">{MOCK_PROJECT.name}</h1>
            <p className="body-md text-muted-foreground mt-1 max-w-2xl">
              {MOCK_PROJECT.description}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <StatusBadge status={MOCK_PROJECT.status} />
              <span className="body-sm text-muted-foreground">
                Deadline: {MOCK_PROJECT.deadline}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-card-foreground hover:bg-accent"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="bg-card border border-border p-1 rounded-lg w-fit">
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-accent data-[state=active]:text-primary rounded-md px-6"
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="data-[state=active]:bg-accent data-[state=active]:text-primary rounded-md px-6"
            >
              Members
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-accent data-[state=active]:text-primary rounded-md px-6"
            >
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Button className="rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                New Task
              </Button>
              <SearchInput
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="max-w-sm"
              />
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] bg-card border-border text-foreground rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-card border border-border rounded-[14px] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">
                      Title
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Assignee
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Priority
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Due
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_TASKS.map((task) => (
                    <TableRow
                      key={task.id}
                      className="border-border/50 hover:bg-accent/30"
                    >
                      <TableCell>
                        <Link
                          to="/tasks/$taskId"
                          params={{ taskId: task.id }}
                          className="text-foreground font-medium hover:text-primary transition-colors"
                        >
                          {task.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-card-foreground">
                        {task.assignee}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`label-sm ${
                            task.priority === 'HIGH'
                              ? 'text-destructive'
                              : task.priority === 'MEDIUM'
                                ? 'text-[var(--color-status-on-hold)]'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </TableCell>
                      <TableCell className="text-card-foreground">
                        {task.due}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-accent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-center">
              <Pagination
                currentPage={taskPage}
                totalPages={2}
                onPageChange={setTaskPage}
              />
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-6 space-y-4">
            <Button className="rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Add Member
            </Button>

            <div className="bg-card border border-border rounded-[14px] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Email
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Role
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_MEMBERS.map((member) => (
                    <TableRow
                      key={member.id}
                      className="border-border/50 hover:bg-accent/30"
                    >
                      <TableCell className="text-foreground font-medium">
                        {member.name}
                      </TableCell>
                      <TableCell className="text-card-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`label-sm ${
                            member.role === 'ADMIN'
                              ? 'text-primary'
                              : member.role === 'PM'
                                ? 'text-[var(--color-status-in-progress)]'
                                : 'text-card-foreground'
                          }`}
                        >
                          {member.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-accent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <div className="bg-card border border-border rounded-[14px] overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="label-lg text-foreground">
                  Chat — {MOCK_PROJECT.name}
                </h3>
              </div>

              <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                {MOCK_MESSAGES.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-foreground'
                      }`}
                    >
                      {!msg.isOwn && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {msg.author}
                        </p>
                      )}
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-[10px] mt-1 ${msg.isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 h-10 px-4 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  <Button className="rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 px-6">
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}
