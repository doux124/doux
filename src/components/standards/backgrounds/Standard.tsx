import { useRef, useEffect } from 'react';
import { prefersReducedMotion } from '../../../lib/motion';

// Type definitions
interface Electron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number }[];
}

interface MouseState {
  x: number;
  y: number;
  isActive: boolean;
}

const Standard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, isActive: false });
  const electronsRef = useRef<Electron[]>([]);
  const isVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);

  // Performance settings
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  // Electron parameters - reduced for performance
  const ELECTRON_RADIUS: number = 3;
  const INFLUENCE_RADIUS: number = 150;
  const ELECTRON_SPEED: number = 2;
  const MAX_ELECTRONS: number = 100; // Reduced from 300

  // Electron particle system
  const createElectrons = (width: number, height: number): Electron[] => {
    return Array.from({ length: MAX_ELECTRONS }, (): Electron => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: Math.random() * 100 + 50,
      maxLife: 150,
      trail: []
    }));
  };

  // Visibility detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width || window.innerWidth;
      canvas.height = rect.height || window.innerHeight;
      electronsRef.current = createElectrons(canvas.width, canvas.height);
    };

    updateSize();

    // Respect the user's motion preference: paint one static frame, skip the rAF loop.
    if (prefersReducedMotion()) {
      ctx.fillStyle = '#0a0f1c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const handleMouseMove = (e: MouseEvent): void => {
      if (!isVisibleRef.current) return;
      const rect: DOMRect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.isActive = true;
    };

    const handleMouseLeave = (): void => {
      mouseRef.current.isActive = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const animate = (timestamp: number): void => {
      // Skip if not visible
      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Frame rate throttling
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed < FRAME_INTERVAL) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTimeRef.current = timestamp - (elapsed % FRAME_INTERVAL);

      const electrons = electronsRef.current;

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(5, 15, 25, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentMouse: MouseState = mouseRef.current;

      // Update and draw electrons
      electrons.forEach((electron: Electron, index: number) => {
        // Apply electromagnetic field from mouse
        if (currentMouse.isActive) {
          const dx: number = currentMouse.x - electron.x;
          const dy: number = currentMouse.y - electron.y;
          const distSq: number = dx * dx + dy * dy;
          
          if (distSq < INFLUENCE_RADIUS * INFLUENCE_RADIUS && distSq > 100) {
            const distance = Math.sqrt(distSq);
            const force: number = (INFLUENCE_RADIUS - distance) / INFLUENCE_RADIUS * 0.15;
            electron.vx += (dx / distance) * force;
            electron.vy += (dy / distance) * force;
          }
        }

        // Add some natural drift and randomness
        electron.vx += (Math.random() - 0.5) * 0.02;
        electron.vy += (Math.random() - 0.5) * 0.02;

        // Update position with damping
        electron.vx *= 0.985;
        electron.vy *= 0.985;
        electron.x += electron.vx * ELECTRON_SPEED;
        electron.y += electron.vy * ELECTRON_SPEED;

        // Boundary wrapping with trail management
        let wrapped: boolean = false;
        if (electron.x < 0) { electron.x = canvas.width; wrapped = true; }
        if (electron.x > canvas.width) { electron.x = 0; wrapped = true; }
        if (electron.y < 0) { electron.y = canvas.height; wrapped = true; }
        if (electron.y > canvas.height) { electron.y = 0; wrapped = true; }

        // Clear trail if electron wrapped
        if (wrapped) {
          electron.trail = [];
        } else {
          electron.trail.push({ x: electron.x, y: electron.y });
          if (electron.trail.length > 8) electron.trail.shift(); // Shorter trails
        }

        // Update life
        electron.life--;
        if (electron.life <= 0) {
          electrons[index] = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: electron.maxLife,
            maxLife: 150,
            trail: []
          };
        }

        const alpha: number = electron.life / electron.maxLife;

        // Simplified trail drawing - single path instead of per-segment gradients
        if (electron.trail.length > 1) {
          ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(electron.trail[0].x, electron.trail[0].y);
          for (let i = 1; i < electron.trail.length; i++) {
            ctx.lineTo(electron.trail[i].x, electron.trail[i].y);
          }
          ctx.stroke();
        }

        // Simplified electron rendering - fewer gradient stops
        const speed: number = Math.sqrt(electron.vx * electron.vx + electron.vy * electron.vy);
        const intensity: number = Math.min(speed * 0.5 + 0.5, 1);
        
        // Combined glow (simplified from separate outer/inner)
        const gradient: CanvasGradient = ctx.createRadialGradient(
          electron.x, electron.y, 0, electron.x, electron.y, ELECTRON_RADIUS * 3
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * intensity})`);
        gradient.addColorStop(0.3, `rgba(150, 220, 255, ${alpha * intensity * 0.7})`);
        gradient.addColorStop(1, 'rgba(50, 150, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(electron.x, electron.y, ELECTRON_RADIUS * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Simplified mouse influence field
      if (currentMouse.isActive) {
        const gradient: CanvasGradient = ctx.createRadialGradient(
          currentMouse.x, currentMouse.y, 0, currentMouse.x, currentMouse.y, INFLUENCE_RADIUS
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        gradient.addColorStop(0.3, 'rgba(150, 210, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, INFLUENCE_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Simple center dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-gray-900">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{ background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1f3a 50%, #0a0f1c 100%)' }}
      />
    </div>
  );
};

export default Standard;