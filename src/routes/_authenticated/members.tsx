import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '#/components/layout/page-container'
import { Button } from '#/components/ui/button'
import { SearchInput } from '#/components/ui/search-input'
import { UserAvatar } from '#/components/ui/user-avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Pagination } from '#/components/ui/pagination-controls'

export const Route = createFileRoute('/_authenticated/members')({
  component: MembersPage,
  head: () => ({
    meta: [{ title: 'Members — WorkNest' }],
  }),
})

const MOCK_MEMBERS = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'ADMIN',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'PM',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Mike Ross',
    email: 'mike@example.com',
    role: 'MEMBER',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Sarah Lee',
    email: 'sarah@example.com',
    role: 'MEMBER',
    isOnline: false,
  },
]

function MembersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="headline-sm text-foreground">Members</h1>
            <p className="body-md text-muted-foreground mt-1">
              Manage team members
            </p>
          </div>
          <Button className="rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        </div>

        <SearchInput
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <div className="bg-card border border-border rounded-[14px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">
                  Member
                </TableHead>
                <TableHead className="text-muted-foreground font-medium">
                  Email
                </TableHead>
                <TableHead className="text-muted-foreground font-medium">
                  Role
                </TableHead>
                <TableHead className="text-muted-foreground font-medium">
                  Status
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
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={member.name}
                        size="sm"
                        showOnlineStatus
                        isOnline={member.isOnline}
                      />
                      <span className="text-foreground font-medium">
                        {member.name}
                      </span>
                    </div>
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
                  <TableCell>
                    <span
                      className={`text-sm ${member.isOnline ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {member.isOnline ? 'Online' : 'Offline'}
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

        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={2}
            onPageChange={setPage}
          />
        </div>
      </div>
    </PageContainer>
  )
}
