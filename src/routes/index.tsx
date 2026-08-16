import { createFileRoute, redirect } from '@tanstack/react-router'
import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Testimonials } from '@/components/landing/testimonials'
import { CTA } from '@/components/landing/cta'
import { Footer } from '@/components/landing/footer'
import { getSession } from '#/server-functions/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      const session = await getSession()
      if (session) {
        throw redirect({ to: '/dashboard' })
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'to' in e) throw e
    }
  },
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
