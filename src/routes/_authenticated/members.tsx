import { PageContainer } from '#/components/layout/page-container'
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
import { listMembers } from '#/server-functions/members'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/_authenticated/members')({
  component: MembersPage,
  head: () => ({
    meta: [{ title: 'Members — WorkNest' }],
  }),
})

function MembersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="headline-sm text-foreground">Members</h1>
            <p className="body-md text-muted-foreground mt-1">
              Manage team members
            </p>
          </div>
          <Button className="rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90">
            <Plus data-icon="inline-start" className="w-4 h-4" />
            Add Member
          </Button>
        </div>

        <SearchInput
          placeholder="Search members..."
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
                    <TableHead className="text-muted-foreground font-medium text-right">
                      Actions
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
                          style={
                            member.role === 'PROJECT_MANAGER'
                              ? { color: 'var(--color-status-in-progress)' }
                              : undefined
                          }
                          className={`label-sm ${member.role === 'ADMIN'
                              ? 'text-primary'
                              : 'text-card-foreground'
                            }`}
                        >
                          {member.role === null
                            ? 'No role'
                            : member.role === 'PROJECT_MANAGER'
                              ? 'PM'
                              : member.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${member.name}`}
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
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </PageContainer>
  )
}
