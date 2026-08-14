export function AnimatedDots() {
  const dots = [
    { size: 120, top: '10%', left: '5%', delay: '0s', duration: '8s' },
    { size: 80, top: '20%', right: '10%', delay: '1s', duration: '10s' },
    { size: 100, top: '50%', left: '15%', delay: '2s', duration: '12s' },
    { size: 60, top: '60%', right: '20%', delay: '0.5s', duration: '9s' },
    { size: 90, top: '75%', left: '8%', delay: '1.5s', duration: '11s' },
    { size: 70, top: '40%', right: '5%', delay: '2.5s', duration: '10s' },
    { size: 110, top: '85%', right: '15%', delay: '1s', duration: '13s' },
    { size: 50, top: '30%', left: '50%', delay: '3s', duration: '9s' },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-primary opacity-[0.08] blur-xl"
          style={{
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            top: dot.top,
            left: dot.left,
            right: dot.right,
            animation: `float ${dot.duration} ease-in-out infinite`,
            animationDelay: dot.delay,
          }}
        />
      ))}
    </div>
  )
}
