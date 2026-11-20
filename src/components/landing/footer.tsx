import { Link } from '@tanstack/react-router'
import { Sprout } from 'lucide-react'
import { Container } from './reveal'

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

const PRODUCT = [
  { id: 'platform', label: 'Platform' },
  { id: 'features', label: 'Features' },
  { id: 'faq', label: 'FAQ' },
]

const linkClass =
  'text-sm text-muted-foreground transition-colors hover:text-foreground'

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="chamfer flex size-6 items-center justify-center bg-foreground [--cut:5px]">
              <Sprout className="size-3.5 text-background" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              WorkNest
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Tasks, roles and real-time chat for every project.
          </p>
        </div>

        <nav aria-label="Product">
          <p className="eyebrow mb-4">Product</p>
          <ul className="space-y-2.5">
            {PRODUCT.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={linkClass}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Account">
          <p className="eyebrow mb-4">Account</p>
          <ul className="space-y-2.5">
            <li>
              <Link to="/login" className={linkClass}>
                Sign in
              </Link>
            </li>
            <li>
              <Link to="/login" className={linkClass}>
                Get started
              </Link>
            </li>
          </ul>
        </nav>
      </Container>
      <Container>
        <p className="border-t border-border/60 py-8 text-[13px] text-muted-foreground">
          © {new Date().getFullYear()} WorkNest. All rights reserved.
        </p>
      </Container>
    </footer>
  )
}
