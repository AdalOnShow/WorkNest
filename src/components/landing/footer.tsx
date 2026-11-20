import { Link } from '@tanstack/react-router'

const sections = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'features', label: 'Features' },
  { id: 'faq', label: 'FAQ' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div>
          <Link
            to="/"
            className="font-headline text-lg font-semibold text-foreground"
          >
            WorkNest
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Tasks, roles and chat for every project
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                document
                  .getElementById(s.id)
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {s.label}
            </button>
          ))}
          <Link
            to="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <p className="border-t border-border pt-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} WorkNest
        </p>
      </div>
    </footer>
  )
}
