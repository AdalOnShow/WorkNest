import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLayout } from '#/components/layout/app-layout'
import { getSession } from '#/server-functions/auth'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const session = await getSession()

    if (!session) {
      throw redirect({ to: '/login' })
    }

    return {
      session,
      user: session.user,
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext()
  return (
    <AppLayout user={user}>
      <Outlet />
    </AppLayout>
  )
}
