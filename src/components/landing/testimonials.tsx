import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { User } from 'lucide-react';

const testimonials = [
  {
    quote: 'WorkNest changed how we ship products.',
    author: 'Sarah K.',
    role: 'CTO, Acme',
  },
  {
    quote: 'Our team\'s productivity increased by 40%.',
    author: 'Mike R.',
    role: 'PM, TechCo',
  },
  {
    quote: 'The best project tool I\'ve used. Period.',
    author: 'Jane D.',
    role: 'Lead, DevCo',
  },
];

function TestimonialCard({ 
  quote, 
  author, 
  role, 
  index 
}: { 
  quote: string; 
  author: string; 
  role: string; 
  index: number;
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`bg-card border border-border rounded-lg p-8 transition-all duration-700 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* Quote Icon */}
      <div className="text-primary text-5xl mb-4 leading-none">"</div>

      {/* Quote Text */}
      <p className="text-lg text-foreground mb-6 italic">{quote}</p>

      {/* Author Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <User className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="testimonials" className="py-24 bg-background">
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
            Loved by teams everywhere
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of teams already using WorkNest to build better products
          </p>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
