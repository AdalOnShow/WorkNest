import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { ProductMockup } from './product-mockup'
import { Container } from './reveal'

export function Hero() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40">
      <div aria-hidden="true" className="hero-spotlight">
        <div className="hero-spotlight-beam hero-spotlight-beam--left" />
        <div className="hero-spotlight-beam hero-spotlight-beam--right" />
      </div>
      <Container className="relative">
        <div className="animate-fade-in-up mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="eyebrow mb-6">Project workspace for small teams</p>
          <h1 className="text-4xl leading-[1.1] text-balance text-foreground sm:text-5xl lg:text-[3.5rem]">
            Run every project from one quiet workspace
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[17px]">
            Tasks, per-project roles and a real-time chat room for each project,
            with a dashboard that shows what is moving and what is late.
          </p>
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/login">Get started</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => scrollToSection('platform')}
              className="w-full sm:w-auto"
            >
              See the platform
            </Button>
          </div>
        </div>

        <div className="animate-fade-in-up animation-delay-200 mx-auto mt-16 max-w-[1200px] sm:mt-20">
          <ProductMockup />
        </div>
      </Container>
    </section>
  )
}
