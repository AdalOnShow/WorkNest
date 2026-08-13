import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '#/components/layout/page-container'
import { UserAvatar } from '#/components/ui/user-avatar'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: 'Profile — WorkNest' }],
  }),
})

function ProfilePage() {
  return (
    <PageContainer>
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="headline-sm text-foreground">Profile</h1>
          <p className="body-md text-muted-foreground mt-1">Your public profile information</p>
        </div>

        <div className="bg-card border border-border rounded-[14px] p-6">
          <div className="flex items-center gap-4 mb-6">
            <UserAvatar name="John Doe" size="lg" showOnlineStatus isOnline />
            <div>
              <h2 className="text-xl font-semibold text-foreground">John Doe</h2>
              <p className="body-sm text-muted-foreground">john@example.com</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-sm text-muted-foreground block mb-1">Name</label>
                <p className="body-sm text-foreground">John Doe</p>
              </div>
              <div>
                <label className="label-sm text-muted-foreground block mb-1">Email</label>
                <p className="body-sm text-foreground">john@example.com</p>
              </div>
              <div>
                <label className="label-sm text-muted-foreground block mb-1">Role</label>
                <p className="body-sm text-foreground">Admin</p>
              </div>
              <div>
                <label className="label-sm text-muted-foreground block mb-1">Joined</label>
                <p className="body-sm text-foreground">Jan 15, 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
