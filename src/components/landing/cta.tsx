import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Reveal } from './reveal'

export function CTA() {
  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="relative max-w-3xl mx-auto overflow-hidden rounded-xl border border-border bg-card px-6 py-14 md:px-12 text-center">
          <div className="relative">
            <h2 className="font-headline text-foreground text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Start your first project today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Sign in, create a project and invite your team. It takes about a
              minute.
            </p>
            <Button size="lg" asChild>
              <Link to="/login">Get started free</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
