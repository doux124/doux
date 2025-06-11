import { useRef, useEffect, useState } from 'react';

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

const Graphene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, isActive: false });
  const [isActive, setIsActive] = useState<boolean>(false);

  // Lattice parameters
  const LATTICE_SIZE: number = 25;
  const NODE_RADIUS: number = 2;
  const ELECTRON_RADIUS: number = 3;
  const CONDUCTIVITY_RADIUS: number = 120;
  const ELECTRON_SPEED: number = 2; // Back to original speed
  const MAX_ELECTRONS: number = 200;

  // Hexagonal lattice structure
  const createLatticeNodes = (width: number, height: number): LatticeNode[] => {
    const nodes: LatticeNode[] = [];
    const rows: number = Math.ceil(height / (LATTICE_SIZE * Math.sqrt(3) / 2)) + 2;
    const cols: number = Math.ceil(width / LATTICE_SIZE) + 2;

    var i: number = 0;
    for (let row = 0; row < rows; row++) {
        i++;
        i%=2;
      for (let col = 0; col < cols; col++) {
        if ((col+i) % 3 === 0) continue;

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
    const CONNECTION_RADIUS = LATTICE_SIZE * 1.1; // Slightly more than LATTICE_SIZE
    nodes.forEach((node, i) => {
        node.connections = [];

        for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;

            const other = nodes[j];
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Connect if within bond length (approx one hop in hex lattice)
            if (dist > 0 && dist < CONNECTION_RADIUS) {
            node.connections.push(j);
            }
        }
    });

    return nodes;
  };

  // Electron particle system
  const createElectrons = (): Electron[] => {
    return Array.from({ length: MAX_ELECTRONS }, (): Electron => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2, // Back to original velocity
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

    let nodes: LatticeNode[] = createLatticeNodes(canvas.width, canvas.height);
    let electrons: Electron[] = createElectrons();

    const handleMouseMove = (e: MouseEvent): void => {
      const rect: DOMRect = canvas.getBoundingClientRect();
      // Update mouse position using ref to avoid re-renders
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.isActive = true;
      setIsActive(true);
    };

    const handleMouseLeave = (): void => {
      mouseRef.current.isActive = false;
      setIsActive(false);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const animate = (): void => {
      ctx.fillStyle = 'rgba(5, 15, 25, 0.1)';
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
          node.conductivity *= 0.95; // Gradual decay
        }

        // Add subtle vibration to highly conductive nodes
        if (node.conductivity > 0.3) {
          node.x = node.baseX + Math.sin(Date.now() * 0.01 + node.baseX * 0.01) * node.conductivity * 2;
          node.y = node.baseY + Math.cos(Date.now() * 0.01 + node.baseY * 0.01) * node.conductivity * 2;
        } else {
          node.x = node.baseX;
          node.y = node.baseY;
        }
      });

      // Draw lattice connections
      nodes.forEach((node: LatticeNode) => {
        node.connections.forEach((connIndex: number) => {
          if (connIndex < nodes.length) {
            const connNode: LatticeNode = nodes[connIndex];
            const avgConductivity: number = (node.conductivity + connNode.conductivity) / 2;
            
            if (avgConductivity > 0.05) {
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

              // Add electrical spark effects for high conductivity
              if (avgConductivity > 0.7 && Math.random() < 0.1) {
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

      // Draw lattice nodes
      nodes.forEach((node: LatticeNode) => {
        if (node.conductivity > 0.1) {
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
        // Apply electromagnetic field from mouse with original force
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

        // Apply lattice influence
        nodes.forEach((node: LatticeNode) => {
          if (node.conductivity > 0.3) {
            const dx: number = node.x - electron.x;
            const dy: number = node.y - electron.y;
            const distance: number = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {
              const attraction: number = node.conductivity * 0.05;
              electron.vx += (dx / distance) * attraction;
              electron.vy += (dy / distance) * attraction;
            }
          }
        });

        // Update position with original damping
        electron.vx *= 0.98;
        electron.vy *= 0.98;
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
          if (electron.trail.length > 8) electron.trail.shift(); // Back to original trail length
        }

        // Update life
        electron.life--;
        if (electron.life <= 0) {
          electrons[index] = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2, // Back to original velocity
            vy: (Math.random() - 0.5) * 2,
            life: electron.maxLife,
            maxLife: 150,
            trail: []
          };
        }

        // Draw electron trail
        if (electron.trail.length > 1) {
          ctx.strokeStyle = `rgba(100, 200, 255, ${electron.life / electron.maxLife * 0.6})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(electron.trail[0].x, electron.trail[0].y);
          electron.trail.forEach((point: { x: number; y: number }, i: number) => {
            if (i > 0) {
              const alpha: number = (i / electron.trail.length) * (electron.life / electron.maxLife);
              ctx.globalAlpha = alpha;
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Draw electron
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

      // Draw mouse influence zone
      if (currentMouse.isActive) {
        const gradient: CanvasGradient = ctx.createRadialGradient(currentMouse.x, currentMouse.y, 0, currentMouse.x, currentMouse.y, CONDUCTIVITY_RADIUS);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, CONDUCTIVITY_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Draw pulsing center
        const pulse: number = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, 5 + pulse * 10, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      nodes = createLatticeNodes(canvas.width, canvas.height);
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
  }, []); // Removed dependencies to prevent re-initialization

  return (
    <div className="relative inset-0 bg-gray-900">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
      />
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 text-white/70 text-sm font-mono">
        <div className="bg-black/20 backdrop-blur-sm p-3 rounded-lg border border-white/10">
          <div>Graphene Lattice</div>
          <div className="text-xs mt-1 text-blue-300">
            Move mouse or touch to create electrical fields
          </div>
          <div className="text-xs text-cyan-300">
            {isActive ? 'Conducting' : 'Idle'} | Electrons: {MAX_ELECTRONS}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Graphene;