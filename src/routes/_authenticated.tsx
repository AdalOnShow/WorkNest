import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLayout } from '#/components/layout/app-layout'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
