import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
import { Reveal, SectionHeading } from './reveal'

const faqs = [
  {
    q: 'Is WorkNest free?',
    a: 'Yes. You can sign up, create projects and invite your team at no cost.',
  },
  {
    q: 'How do I sign in?',
    a: 'With your Google or GitHub account. WorkNest has no separate password to manage.',
  },
  {
    q: 'How do roles work?',
    a: 'Roles are set per project. Admins manage the project and its members, Project Managers plan and assign work, and Team Members work on their tasks. A Project Manager can invite people but cannot make anyone an Admin.',
  },
  {
    q: 'Who can see my projects?',
    a: 'Only the members of a project. If you are not on a project, you cannot see its tasks, comments or chat.',
  },
  {
    q: 'How do invitations work?',
    a: 'An admin or project manager enters an email address and picks a role. WorkNest creates an invite link that is valid for 7 days. Share it with them, and they join the project when they accept it.',
  },
  {
    q: 'Is the chat real time?',
    a: 'Yes. Every project has its own chat room where messages arrive instantly, and the full history is saved so new members can catch up.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-24 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <Reveal className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible>
            {faqs.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
