import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { ArrowRight, Rocket, Users, Zap } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Create a project',
    description: 'Set up your project with name, deadline, and description',
    icon: Rocket,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    number: 2,
    title: 'Invite your team',
    description: 'Add members via email and assign roles and tasks to get started',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    number: 3,
    title: 'Ship together',
    description: 'Collaborate in real time and deliver',
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
  },
];

function StepCard({ 
  number, 
  title, 
  description, 
  icon: Icon,
  color,
  bgColor,
  borderColor,
  index,
  isLast 
}: { 
  number: number; 
  title: string; 
  description: string; 
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  index: number;
  isLast: boolean;
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <div className="relative flex flex-col items-center h-full">
      <div
        ref={ref}
        className={`w-full h-full transition-all duration-700 ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-6'
        }`}
        style={{ transitionDelay: `${index * 150}ms` }}
      >
        {/* Card Container */}
        <div className={`relative bg-card border ${borderColor} rounded-2xl p-8 h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:scale-105 group`}>
          {/* Number Badge */}
          <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full ${bgColor} border-2 ${borderColor} flex items-center justify-center backdrop-blur-sm`}>
            <span className={`text-xl font-bold ${color}`}>{number}</span>
          </div>

          {/* Icon */}
          <div className={`mb-6 ${bgColor} ${color} w-16 h-16 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-8 h-8" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold mb-3 text-foreground text-center">{title}</h3>

          {/* Description */}
          <p className="text-muted-foreground text-center leading-relaxed flex-1">{description}</p>
        </div>
      </div>

      {/* Animated Arrow Connector - Desktop Only */}
      {!isLast && (
        <div className={`hidden lg:flex absolute top-1/2 left-[calc(50%+10rem)] -translate-y-1/2 items-center gap-2 w-32 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        }`}
        style={{ transitionDelay: `${index * 150 + 300}ms` }}
        >
          <div className="flex-1 h-px bg-gradient-to-r from-border to-primary/50" />
          <ArrowRight className="w-6 h-6 text-primary animate-pulse" />
          <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent" />
        </div>
      )}
    </div>
  );
}

export function HowItWorks() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-gradient-to-b from-background via-accent/20 to-background dark:via-accent/30">
      {/* Background Decorations */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Title */}
        <div
          ref={ref}
          className={`text-center mb-20 transition-all duration-700 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="inline-block mb-4">
            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider">
              Simple Process
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our simple three-step process. No complex setup required.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-8 relative max-w-6xl mx-auto items-stretch">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              color={step.color}
              bgColor={step.bgColor}
              borderColor={step.borderColor}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className={`text-center mt-16 transition-all duration-700 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionDelay: '600ms' }}
        >
          <p className="text-muted-foreground mb-4">
            Ready to streamline your workflow?
          </p>
          <div className="flex items-center justify-center gap-2 text-primary font-semibold group cursor-pointer">
            <span>Get started now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </section>
  );
}
