import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Container, Reveal } from './reveal'

export function CTA() {
  return (
    <section className="relative overflow-hidden border-t border-border/60">
      <Container>
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center py-28 text-center sm:py-36 lg:py-44">
          <h2 className="text-4xl leading-[1.08] text-balance text-foreground sm:text-5xl lg:text-[3.75rem]">
            Take control of every project your team runs
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Sign in with Google or GitHub, create a project and invite your
            team.
          </p>
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/login">Get started</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() =>
                document
                  .getElementById('platform')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Take the tour
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
