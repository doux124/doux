import { useRef, useEffect } from 'react';
import { prefersReducedMotion } from '../../../lib/motion';

// Type definitions
interface LatticeNode {
  x: number;
  y: number;
  connections: number[];
  conductivity: number;
  baseX: number;
  baseY: number;
}

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

const Semiconductor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, isActive: false });
  const nodesRef = useRef<LatticeNode[]>([]);
  const electronsRef = useRef<Electron[]>([]);
  const isVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);
  
  // Performance settings
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  // Lattice parameters - reduced for performance
  const LATTICE_SIZE: number = 30; // Increased from 25
  const NODE_RADIUS: number = 2;
  const ELECTRON_RADIUS: number = 3;
  const CONDUCTIVITY_RADIUS: number = 120;
  const ELECTRON_SPEED: number = 2;
  const MAX_ELECTRONS: number = 100; // Reduced from 200

  // Hexagonal lattice structure
  const createLatticeNodes = (width: number, height: number): LatticeNode[] => {
    const nodes: LatticeNode[] = [];
    const rows: number = Math.ceil(height / (LATTICE_SIZE * Math.sqrt(3) / 2)) + 2;
    const cols: number = Math.ceil(width / LATTICE_SIZE) + 2;

    let i: number = 0;
    for (let row = 0; row < rows; row++) {
      i++;
      i %= 2;
      for (let col = 0; col < cols; col++) {
        if ((col + i) % 3 === 0) continue;

        const x: number = col * LATTICE_SIZE + (row % 2) * (LATTICE_SIZE / 2) - LATTICE_SIZE;
        const y: number = row * (LATTICE_SIZE * Math.sqrt(3) / 2) - LATTICE_SIZE;
        
        nodes.push({
          x,
          y,
          connections: [],
          conductivity: 0,
          baseX: x,
          baseY: y
        });
      }
    }

    // Create hexagonal connections
    const CONNECTION_RADIUS = LATTICE_SIZE * 1.1;
    nodes.forEach((node, i) => {
      node.connections = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const other = nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < CONNECTION_RADIUS) {
          node.connections.push(j);
        }
      }
    });

    return nodes;
  };

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

    let prevW = -1;
    let prevH = -1;
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      // Skip the expensive O(n^2) lattice rebuild when the size hasn't actually changed
      // (ResizeObserver fires on every mobile URL-bar collapse and scroll reflow).
      if (w === prevW && h === prevH) return;
      prevW = w;
      prevH = h;
      canvas.width = w;
      canvas.height = h;
      nodesRef.current = createLatticeNodes(w, h);
      electronsRef.current = createElectrons(w, h);
    };

    updateSize();

    // Respect the user's motion preference: paint one static frame, skip the rAF loop.
    if (prefersReducedMotion()) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const handleMouseMove = (e: MouseEvent): void => {
      if (!isVisibleRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouseRef.current.x = x;
        mouseRef.current.y = y;
        mouseRef.current.isActive = true;
      } else {
        mouseRef.current.isActive = false;
      }
    };

    const handleMouseLeave = (): void => {
      mouseRef.current.isActive = false;
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

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

      const nodes = nodesRef.current;
      const electrons = electronsRef.current;
      
      // Slightly stronger fade for performance
      ctx.fillStyle = 'rgba(5, 15, 25, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentMouse: MouseState = mouseRef.current;

      // Update node conductivity based on mouse proximity
      nodes.forEach((node: LatticeNode) => {
        const distance: number = Math.sqrt(
          Math.pow(node.x - currentMouse.x, 2) + Math.pow(node.y - currentMouse.y, 2)
        );
        
        if (currentMouse.isActive && distance < CONDUCTIVITY_RADIUS) {
          node.conductivity = Math.max(0, 1 - distance / CONDUCTIVITY_RADIUS);
        } else {
          node.conductivity *= 0.95;
        }

        if (node.conductivity > 0.3) {
          node.x = node.baseX + Math.sin(Date.now() * 0.01 + node.baseX * 0.01) * node.conductivity * 2;
          node.y = node.baseY + Math.cos(Date.now() * 0.01 + node.baseY * 0.01) * node.conductivity * 2;
        } else {
          node.x = node.baseX;
          node.y = node.baseY;
        }
      });

      // Draw lattice connections - only draw if conductivity is significant
      nodes.forEach((node: LatticeNode) => {
        node.connections.forEach((connIndex: number) => {
          if (connIndex < nodes.length) {
            const connNode: LatticeNode = nodes[connIndex];
            const avgConductivity: number = (node.conductivity + connNode.conductivity) / 2;
            
            // Increased threshold for drawing
            if (avgConductivity > 0.1) {
              const gradient: CanvasGradient = ctx.createLinearGradient(node.x, node.y, connNode.x, connNode.y);
              const intensity: number = Math.min(avgConductivity * 255, 255);
              
              gradient.addColorStop(0, `rgba(0, ${intensity}, ${intensity * 1.5}, ${avgConductivity})`);
              gradient.addColorStop(0.5, `rgba(${intensity * 0.5}, ${intensity * 1.2}, 255, ${avgConductivity * 1.2})`);
              gradient.addColorStop(1, `rgba(0, ${intensity}, ${intensity * 1.5}, ${avgConductivity})`);
              
              ctx.strokeStyle = gradient;
              ctx.lineWidth = 1 + avgConductivity * 2;
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(connNode.x, connNode.y);
              ctx.stroke();

              // Reduced spark frequency
              if (avgConductivity > 0.8 && Math.random() < 0.05) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = `rgba(100, 200, 255, ${avgConductivity})`;
                ctx.strokeStyle = `rgba(255, 255, 255, ${avgConductivity * 0.8})`;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.shadowBlur = 0;
              }
            }
          }
        });
      });

      // Draw lattice nodes - only if conductivity is significant
      nodes.forEach((node: LatticeNode) => {
        if (node.conductivity > 0.15) {
          const gradient: CanvasGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, NODE_RADIUS * 3);
          const intensity: number = Math.min(node.conductivity * 255, 255);
          
          gradient.addColorStop(0, `rgba(255, 255, 255, ${node.conductivity})`);
          gradient.addColorStop(0.5, `rgba(100, ${intensity * 1.5}, 255, ${node.conductivity * 0.8})`);
          gradient.addColorStop(1, `rgba(0, ${intensity}, ${intensity}, 0)`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_RADIUS + node.conductivity * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Update and draw electrons
      electrons.forEach((electron: Electron, index: number) => {
        if (currentMouse.isActive) {
          const dx: number = currentMouse.x - electron.x;
          const dy: number = currentMouse.y - electron.y;
          const distance: number = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < CONDUCTIVITY_RADIUS && distance > 10) {
            const force: number = (CONDUCTIVITY_RADIUS - distance) / CONDUCTIVITY_RADIUS * 0.1;
            electron.vx += (dx / distance) * force;
            electron.vy += (dy / distance) * force;
          }
        }

        // Only check nearby nodes for attraction (simplified)
        nodes.forEach((node: LatticeNode) => {
          if (node.conductivity > 0.3) {
            const dx: number = node.x - electron.x;
            const dy: number = node.y - electron.y;
            const distSq: number = dx * dx + dy * dy;
            
            if (distSq < 900) { // 30^2
              const distance = Math.sqrt(distSq);
              const attraction: number = node.conductivity * 0.05;
              electron.vx += (dx / distance) * attraction;
              electron.vy += (dy / distance) * attraction;
            }
          }
        });

        electron.vx *= 0.98;
        electron.vy *= 0.98;
        electron.x += electron.vx * ELECTRON_SPEED;
        electron.y += electron.vy * ELECTRON_SPEED;

        let wrapped: boolean = false;
        if (electron.x < 0) { electron.x = canvas.width; wrapped = true; }
        if (electron.x > canvas.width) { electron.x = 0; wrapped = true; }
        if (electron.y < 0) { electron.y = canvas.height; wrapped = true; }
        if (electron.y > canvas.height) { electron.y = 0; wrapped = true; }

        if (wrapped) {
          electron.trail = [];
        } else {
          electron.trail.push({ x: electron.x, y: electron.y });
          if (electron.trail.length > 6) electron.trail.shift(); // Shorter trails
        }

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

        // Simplified trail drawing
        if (electron.trail.length > 1) {
          ctx.strokeStyle = `rgba(100, 200, 255, ${electron.life / electron.maxLife * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(electron.trail[0].x, electron.trail[0].y);
          for (let i = 1; i < electron.trail.length; i++) {
            ctx.lineTo(electron.trail[i].x, electron.trail[i].y);
          }
          ctx.stroke();
        }

        const alpha: number = electron.life / electron.maxLife;
        const gradient: CanvasGradient = ctx.createRadialGradient(electron.x, electron.y, 0, electron.x, electron.y, ELECTRON_RADIUS * 2);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.6, `rgba(100, 200, 255, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(0, 100, 200, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(electron.x, electron.y, ELECTRON_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mouse influence visualization
      if (currentMouse.isActive) {
        const gradient: CanvasGradient = ctx.createRadialGradient(currentMouse.x, currentMouse.y, 0, currentMouse.x, currentMouse.y, CONDUCTIVITY_RADIUS);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, CONDUCTIVITY_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        const pulse: number = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, 5 + pulse * 10, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Coalesce bursts of ResizeObserver fires into a single rAF-timed updateSize.
    let resizeRaf = 0;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(updateSize);
    });
    resizeObserver.observe(container);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      cancelAnimationFrame(resizeRaf);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
      />
    </div>
  );
};

export default Semiconductor;