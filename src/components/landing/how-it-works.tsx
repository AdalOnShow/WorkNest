import { Reveal, SectionHeading } from './reveal'

const steps = [
  {
    title: 'Sign in',
    description:
      'Use your Google or GitHub account. There are no passwords to create or remember.',
  },
  {
    title: 'Create a project',
    description:
      'Give it a name, a description and a deadline. You become the project admin.',
  },
  {
    title: 'Invite your team',
    description:
      'Send an invite link by email and choose a role: Admin, Project Manager or Team Member.',
  },
  {
    title: 'Plan the work',
    description:
      'Add tasks with a priority, a due date and an assignee. Move them from To do to Completed.',
  },
  {
    title: 'Stay in sync',
    description:
      'Talk in the project chat, comment on tasks and follow progress on your dashboard.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From sign-in to shipped in five steps"
          description="No setup and no configuration. Most teams are working inside a project within a few minutes."
        />

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Reveal
                delay={i * 80}
                className="h-full rounded-2xl border border-border bg-card p-6"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full border border-border text-sm font-medium text-foreground mb-5">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
