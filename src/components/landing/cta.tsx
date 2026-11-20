import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Reveal } from './reveal'

export function CTA() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-8 rounded-xl border border-border bg-card p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div className="max-w-xl">
            <h2 className="font-headline text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Start your first project
            </h2>
            <p className="mt-4 text-lg text-description">
              Sign in with Google or GitHub, create a project and invite your
              team
            </p>
          </div>
          <Button size="lg" asChild className="w-full shrink-0 md:w-auto">
            <Link to="/login">Get started free</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
