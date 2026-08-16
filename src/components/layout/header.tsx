import { Navbar } from '@/components/landing/navbar'

interface HeaderProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

export function Header({ user }: HeaderProps) {
  const userName = user?.name ?? 'Account'
  const userImage = user?.image ?? undefined

  return (
    <Navbar isAuthenticated={true} userName={userName} userImage={userImage} />
  )
}
