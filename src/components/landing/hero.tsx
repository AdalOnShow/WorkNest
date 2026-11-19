import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { ProductMockup } from './product-mockup'

export function Hero() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-primary" />
            Projects, tasks and team chat in one place
          </span>

          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            The simple workspace for teams that ship
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            WorkNest gives every project its own task board, roles and chat
            room, so your team always knows who is doing what and what is due
            next.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/login">Get started free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('how-it-works')}
              className="w-full sm:w-auto"
            >
              See how it works
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Sign in with Google or GitHub. No credit card.
          </p>
        </div>

        <div className="mt-16 md:mt-20 max-w-5xl mx-auto animate-fade-in-up animation-delay-200">
          <ProductMockup />
        </div>
      </div>
    </section>
  )
}
