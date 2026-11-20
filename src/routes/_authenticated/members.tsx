import { PageContainer } from '#/components/layout/page-container'
import { PageHeader } from '#/components/layout/page-header'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
import { LoadingState } from '#/components/ui/loading-state'
import { Pagination } from '#/components/ui/pagination-controls'
import { SearchInput } from '#/components/ui/search-input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { UserAvatar } from '#/components/ui/user-avatar'
import { InviteMemberDialog } from '#/components/projects/invite-member-dialog'
import { listMembers } from '#/server-functions/members'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/_authenticated/members')({
  component: MembersPage,
  head: () => ({
    meta: [{ title: 'Members — WorkNest' }],
  }),
})

const ROLE_LABELS = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  TEAM_MEMBER: 'Team Member',
} as const

function MembersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['members', debouncedSearch, page],
    queryFn: () =>
      listMembers({ data: { search: debouncedSearch, page, pageSize: 10 } }),
    placeholderData: keepPreviousData,
  })

  const items = data?.items || []
  const totalPages = data?.totalPages || 1

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Members"
          description="People in your projects. Open a project to manage its members."
          actions={
            <Button onClick={() => setInviteOpen(true)}>
              <Plus data-icon="inline-start" className="size-4" />
              Invite member
            </Button>
          }
        />

        <SearchInput
          placeholder="Search members"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-sm"
        />

        {isLoading ? (
          <LoadingState variant="table" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members found"
            description={
              search ? 'Try a different search term' : 'No members yet'
            }
          />
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-semibold">
                      Member
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold">
                      Email
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold">
                      Role
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((member) => (
                    <TableRow
                      key={member.id}
                      className="border-border/50 hover:bg-accent/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={member.name}
                            image={member.image || undefined}
                            size="sm"
                          />
                          <span className="text-foreground font-semibold">
                            {member.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-md border border-border px-2 py-0.5 text-xs font-semibold text-card-foreground">
                          {member.role === null
                            ? 'No role'
                            : ROLE_LABELS[member.role]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </PageContainer>
  )
}
