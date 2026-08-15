import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

export function CTA() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>()

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background to-accent/10 dark:to-accent/30">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div
          ref={ref}
          className={`bg-tertiary rounded-2xl p-12 md:p-16 text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ready to build better together?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using WorkNest to manage projects
            and ship faster
          </p>
          <Button size="lg" asChild>
            <Link to="/login">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
