import { useRef, useEffect } from 'react';

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
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, isActive: false });

  // Electron parameters
  const ELECTRON_RADIUS: number = 3;
  const INFLUENCE_RADIUS: number = 150;
  const ELECTRON_SPEED: number = 2;
  const MAX_ELECTRONS: number = 300;

  // Electron particle system
  const createElectrons = (): Electron[] => {
    return Array.from({ length: MAX_ELECTRONS }, (): Electron => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: Math.random() * 100 + 50,
      maxLife: 150,
      trail: []
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let electrons: Electron[] = createElectrons();

    const handleMouseMove = (e: MouseEvent): void => {
      const rect: DOMRect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.isActive = true;
    };

    const handleMouseLeave = (): void => {
      mouseRef.current.isActive = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const animate = (): void => {
      // Clear canvas with slight fade effect to prevent permanent staining
      ctx.fillStyle = 'rgba(5, 15, 25, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentMouse: MouseState = mouseRef.current;

      // Update and draw electrons
      electrons.forEach((electron: Electron, index: number) => {
        // Apply electromagnetic field from mouse
        if (currentMouse.isActive) {
          const dx: number = currentMouse.x - electron.x;
          const dy: number = currentMouse.y - electron.y;
          const distance: number = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < INFLUENCE_RADIUS && distance > 10) {
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
        if (electron.x < 0) {
          electron.x = canvas.width;
          wrapped = true;
        }
        if (electron.x > canvas.width) {
          electron.x = 0;
          wrapped = true;
        }
        if (electron.y < 0) {
          electron.y = canvas.height;
          wrapped = true;
        }
        if (electron.y > canvas.height) {
          electron.y = 0;
          wrapped = true;
        }

        // Clear trail if electron wrapped to prevent laser lines
        if (wrapped) {
          electron.trail = [];
        } else {
          // Update trail only if not wrapped
          electron.trail.push({ x: electron.x, y: electron.y });
          if (electron.trail.length > 12) electron.trail.shift();
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

        // Draw electron trail with gradient
        if (electron.trail.length > 1) {
          for (let i = 1; i < electron.trail.length; i++) {
            const alpha: number = (i / electron.trail.length) * (electron.life / electron.maxLife) * 0.8;
            const prevPoint = electron.trail[i - 1];
            const currentPoint = electron.trail[i];
            
            // Create gradient for each trail segment
            const gradient: CanvasGradient = ctx.createLinearGradient(
              prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y
            );
            gradient.addColorStop(0, `rgba(100, 200, 255, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(150, 220, 255, ${alpha})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1 + alpha * 2;
            ctx.beginPath();
            ctx.moveTo(prevPoint.x, prevPoint.y);
            ctx.lineTo(currentPoint.x, currentPoint.y);
            ctx.stroke();
          }
        }

        // Draw electron with enhanced glow
        const alpha: number = electron.life / electron.maxLife;
        const speed: number = Math.sqrt(electron.vx * electron.vx + electron.vy * electron.vy);
        const intensity: number = Math.min(speed * 0.5 + 0.5, 1);
        
        // Outer glow
        const outerGradient: CanvasGradient = ctx.createRadialGradient(
          electron.x, electron.y, 0, electron.x, electron.y, ELECTRON_RADIUS * 4
        );
        outerGradient.addColorStop(0, `rgba(100, 200, 255, ${alpha * intensity * 0.6})`);
        outerGradient.addColorStop(0.5, `rgba(50, 150, 255, ${alpha * intensity * 0.3})`);
        outerGradient.addColorStop(1, 'rgba(0, 100, 200, 0)');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(electron.x, electron.y, ELECTRON_RADIUS * 4, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        const coreGradient: CanvasGradient = ctx.createRadialGradient(
          electron.x, electron.y, 0, electron.x, electron.y, ELECTRON_RADIUS
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * intensity})`);
        coreGradient.addColorStop(0.3, `rgba(200, 230, 255, ${alpha * intensity * 0.8})`);
        coreGradient.addColorStop(1, `rgba(100, 200, 255, ${alpha * intensity * 0.4})`);
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(electron.x, electron.y, ELECTRON_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw mouse influence field with smoother gradient
      if (currentMouse.isActive) {
        // Large outer influence zone with more gradient stops
        const outerGradient: CanvasGradient = ctx.createRadialGradient(
          currentMouse.x, currentMouse.y, 0, currentMouse.x, currentMouse.y, INFLUENCE_RADIUS
        );
        outerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        outerGradient.addColorStop(0.1, 'rgba(200, 230, 255, 0.08)');
        outerGradient.addColorStop(0.25, 'rgba(150, 210, 255, 0.06)');
        outerGradient.addColorStop(0.4, 'rgba(100, 180, 255, 0.04)');
        outerGradient.addColorStop(0.6, 'rgba(50, 150, 255, 0.02)');
        outerGradient.addColorStop(0.8, 'rgba(25, 125, 200, 0.01)');
        outerGradient.addColorStop(1, 'rgba(0, 100, 200, 0)');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, INFLUENCE_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Smaller central core with smoother gradient
        const coreGradient: CanvasGradient = ctx.createRadialGradient(
          currentMouse.x, currentMouse.y, 0, currentMouse.x, currentMouse.y, 8
        );
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        coreGradient.addColorStop(0.2, 'rgba(240, 248, 255, 0.6)');
        coreGradient.addColorStop(0.4, 'rgba(200, 230, 255, 0.4)');
        coreGradient.addColorStop(0.7, 'rgba(150, 200, 255, 0.2)');
        coreGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Tiny bright center
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      electrons = createElectrons();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{ background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1f3a 50%, #0a0f1c 100%)' }}
      />
    </div>
  );
};

export default Standard;