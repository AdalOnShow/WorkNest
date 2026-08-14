import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { AnimatedDots } from './animated-dots'

export function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <AnimatedDots />

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-6 animate-fade-in-up">
            Manage Projects.
            <br />
            Ship Faster.
          </h1>

          {/* Subtext */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200">
            The modern collaboration platform for teams that move fast.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => scrollToSection('how-it-works')}
              className="w-full sm:w-auto"
            >
              See How It Works
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}
