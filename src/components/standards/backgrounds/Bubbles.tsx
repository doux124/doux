import React, { useState, useEffect, useRef } from 'react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

const Bubbles: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pastelColors = [
    'bg-pink-200/30',
    'bg-purple-200/30', 
    'bg-blue-200/30',
    'bg-green-200/30',
    'bg-yellow-200/30',
    'bg-indigo-200/30',
    'bg-cyan-200/30',
    'bg-rose-200/30'
  ];

  const createBubble = (id: number): Bubble => ({
    id,
    x: Math.random() * 95,
    y: -5,
    size: Math.random() * 80 + 30,
    speed: Math.random() * 0.5 + 0.3,
    opacity: Math.random() * 0.15 + 0.4,
    color: pastelColors[Math.floor(Math.random() * pastelColors.length)]
  });

  useEffect(() => {
    // Initialize bubbles (half the original amount)
    const initialBubbles = Array.from({ length: 8 }, (_, i) => ({
      ...createBubble(i),
      y: Math.random() * 100
    }));
    setBubbles(initialBubbles);

    const interval = setInterval(() => {
      setBubbles(prev => {
        const updated = prev.map(bubble => ({
          ...bubble,
          y: bubble.y + bubble.speed
        })).filter(bubble => bubble.y < 110);

        // Add new bubbles from bottom (maintain max 10 instead of 20)
        while (updated.length < 10) {
          updated.push(createBubble(Date.now() + Math.random()));
        }

        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Add CSS animations to document head
    const style = document.createElement('style');
    style.textContent = `
      @keyframes sway-0 {
        0%, 100% { transform: translateX(0px) rotate(0deg); }
        25% { transform: translateX(8px) rotate(1deg); }
        75% { transform: translateX(-8px) rotate(-1deg); }
      }
      @keyframes sway-1 {
        0%, 100% { transform: translateX(0px) rotate(0deg); }
        33% { transform: translateX(-6px) rotate(-0.5deg); }
        66% { transform: translateX(10px) rotate(1.5deg); }
      }
      @keyframes sway-2 {
        0%, 100% { transform: translateX(0px) rotate(0deg); }
        50% { transform: translateX(5px) rotate(0.8deg); }
      }
      @keyframes sway-3 {
        0%, 100% { transform: translateX(0px) rotate(0deg); }
        20% { transform: translateX(-4px) rotate(-0.3deg); }
        80% { transform: translateX(7px) rotate(1.2deg); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drawPattern = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw subtle pattern overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawPattern();
    const patternInterval = setInterval(drawPattern, 2000);

    return () => clearInterval(patternInterval);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-screen overflow-hidden">
      {/* Background div with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-50 via-blue-50 to-cyan-100">
        {/* Secondary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-100/50 via-transparent to-rose-100/50"></div>
      </div>

      {/* Canvas overlay */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      
      {/* Bubbles with realistic refraction */}
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute transition-all duration-75 ease-linear"
          style={{
            left: `${bubble.x}%`,
            bottom: `${bubble.y}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            opacity: bubble.opacity,
            animation: `sway-${bubble.id % 4} ${4 + (bubble.id % 3)}s ease-in-out infinite`
          }}
        >
          {/* Main bubble body with sophisticated styling */}
          <div 
            className="w-full h-full rounded-full relative"
            style={{
              background: `radial-gradient(circle at 30% 30%, 
                hsla(${200 + (bubble.id % 120)}, 50%, 90%, ${bubble.opacity * 0.8}), 
                hsla(${200 + (bubble.id % 120)}, 60%, 80%, ${bubble.opacity * 0.6}) 40%,
                hsla(${200 + (bubble.id % 120)}, 70%, 70%, ${bubble.opacity * 0.4}) 70%,
                hsla(${200 + (bubble.id % 120)}, 60%, 60%, ${bubble.opacity * 0.8}))`,
              border: `1px solid hsla(${200 + (bubble.id % 120)}, 40%, 60%, ${bubble.opacity * 0.6})`,
              boxShadow: `
                inset -2px -2px 6px hsla(${200 + (bubble.id % 120)}, 30%, 50%, ${bubble.opacity * 0.3}),
                inset 2px 2px 6px hsla(${200 + (bubble.id % 120)}, 80%, 95%, ${bubble.opacity * 0.7}),
                0 0 20px hsla(${200 + (bubble.id % 120)}, 60%, 70%, ${bubble.opacity * 0.3})
              `,
              backdropFilter: 'blur(1px)'
            }}
          >
            {/* Highlight spot */}
            <div
              className="absolute rounded-full bg-white"
              style={{
                width: bubble.size * 0.2,
                height: bubble.size * 0.15,
                top: bubble.size * 0.15,
                left: bubble.size * 0.25,
                opacity: bubble.opacity * 0.8,
                filter: 'blur(1px)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Bubbles;