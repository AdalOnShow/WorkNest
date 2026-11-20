import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { ProductMockup } from './product-mockup'

export function Hero() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-32 md:pb-24 lg:flex lg:min-h-[min(100svh,960px)] lg:items-center">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8">
        <div className="animate-fade-in-up">
          <h1 className="font-headline text-foreground text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Tasks, roles and a chat room for every project
          </h1>

          <p className="mt-6 max-w-md text-lg text-description">
            WorkNest gives each project its own task board, member roles and
            real-time chat, so your team knows who is doing what and what is due
            next
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/login">Get started free</Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => scrollToSection('how-it-works')}
              className="w-full sm:w-auto"
            >
              See how it works
            </Button>
          </div>
        </div>

        <div className="animate-fade-in-up animation-delay-200 lg:w-[calc(100%+8rem)]">
          <ProductMockup />
        </div>
      </div>
    </section>
  )
}
