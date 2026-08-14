import { Navbar } from '@/components/landing/navbar'

export function Header() {
  // TODO: Get actual user data from auth context
  const userName = "John Doe"
  const userImage = undefined

  return (
    <Navbar 
      isAuthenticated={true} 
      userName={userName}
      userImage={userImage}
    />
  )
}
