import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { FolderKanban, CheckSquare, MessageSquare, LayoutDashboard, type LucideIcon } from 'lucide-react';

const features: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: FolderKanban,
    title: 'Projects',
    description: 'Organize all your projects in one place',
  },
  {
    icon: CheckSquare,
    title: 'Tasks',
    description: 'Track progress and meet deadlines',
  },
  {
    icon: MessageSquare,
    title: 'Chat',
    description: 'Discuss in real time with your team',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Monitor progress and team performance',
  },
];

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  index 
}: { 
  icon: LucideIcon; 
  title: string; 
  description: string; 
  index: number;
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`bg-card border border-border rounded-lg p-6 transition-all duration-700 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="mb-4 text-primary">
        <Icon className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export function Features() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything your team needs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for modern teams who want to collaborate without the complexity
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
