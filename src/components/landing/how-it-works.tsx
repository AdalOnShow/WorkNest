import { useScrollAnimation } from '@/hooks/use-scroll-animation';

const steps = [
  {
    number: 1,
    title: 'Create a project',
    description: 'Set up your project with name, deadline, and description',
  },
  {
    number: 2,
    title: 'Invite your team',
    description: 'Add members via email and assign roles and tasks to get started',
  },
  {
    number: 3,
    title: 'Ship together',
    description: 'Collaborate in real time and deliver',
  },
];

function StepCard({ 
  number, 
  title, 
  description, 
  index,
  isLast 
}: { 
  number: number; 
  title: string; 
  description: string; 
  index: number;
  isLast: boolean;
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <div className="flex flex-col items-center relative">
      <div
        ref={ref}
        className={`flex flex-col items-center text-center transition-all duration-700 ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-6'
        }`}
        style={{ transitionDelay: `${index * 150}ms` }}
      >
        {/* Number Circle */}
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-6">
          {number}
        </div>

        {/* Title */}
        <h3 className="text-2xl font-semibold mb-3 text-foreground">{title}</h3>

        {/* Description */}
        <p className="text-muted-foreground max-w-xs">{description}</p>
      </div>

      {/* Connecting Line (hidden on mobile, shown on desktop between steps) */}
      {!isLast && (
        <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%)] h-0.5 bg-border" />
      )}
    </div>
  );
}

export function HowItWorks() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="how-it-works" className="py-24 bg-accent/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={ref}
          className={`text-center mb-20 transition-all duration-700 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our simple three-step process
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-8 relative">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
