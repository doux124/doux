import { useRef, useEffect } from 'react';

// Type definitions
interface RedBloodCell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  life: number;
  maxLife: number;
  opacity: number;
}

interface MouseState {
  x: number;
  y: number;
  isActive: boolean;
}

const RedBloodCells: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, isActive: false });

  // Blood cell parameters
  const MAX_CELLS: number = 150;
  const CELL_SIZE_MIN: number = 8;
  const CELL_SIZE_MAX: number = 14;
  const FLOW_SPEED: number = 0.8;
  const INFLUENCE_RADIUS: number = 120;

  // Create red blood cells
  const createRedBloodCells = (): RedBloodCell[] => {
    return Array.from({ length: MAX_CELLS }, (): RedBloodCell => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      size: CELL_SIZE_MIN + Math.random() * (CELL_SIZE_MAX - CELL_SIZE_MIN),
      life: Math.random() * 300 + 200,
      maxLife: 500,
      opacity: 0.7 + Math.random() * 0.3
    }));
  };

  // Draw anatomically accurate biconcave red blood cell
  const drawBiconcaveCell = (ctx: CanvasRenderingContext2D, cell: RedBloodCell): void => {
    ctx.save();
    ctx.translate(cell.x, cell.y);
    ctx.rotate(cell.rotation);

    const alpha = (cell.life / cell.maxLife) * cell.opacity;
    const radius = cell.size;
    
    // Create the biconcave disc shape using a custom path
    // This mimics the actual biconcave shape with thicker edges and thin center
    ctx.beginPath();
    
    // Main outer elliptical shape
    ctx.ellipse(0, 0, radius, radius * 0.85, 0, 0, Math.PI * 2);
    
    // Create gradient that represents the biconcave thickness
    const mainGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    mainGradient.addColorStop(0, `rgba(120, 20, 20, ${alpha * 0.3})`); // Thin center
    mainGradient.addColorStop(0.3, `rgba(180, 40, 40, ${alpha * 0.7})`); // Building thickness
    mainGradient.addColorStop(0.65, `rgba(220, 60, 60, ${alpha})`); // Thick rim
    mainGradient.addColorStop(0.85, `rgba(200, 45, 45, ${alpha * 0.9})`); // Edge fade
    mainGradient.addColorStop(1, `rgba(160, 25, 25, ${alpha * 0.4})`); // Soft outer edge
    
    ctx.fillStyle = mainGradient;
    ctx.fill();

    // Add the characteristic central depression (biconcave dip)
    // This represents the thinnest part of the cell
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.4, radius * 0.35, 0, 0, Math.PI * 2);
    
    const depressionGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.4);
    depressionGradient.addColorStop(0, `rgba(80, 12, 12, ${alpha * 0.8})`); // Deep center
    depressionGradient.addColorStop(0.7, `rgba(100, 18, 18, ${alpha * 0.4})`);
    depressionGradient.addColorStop(1, `rgba(100, 18, 18, 0)`); // Transparent edge
    
    ctx.fillStyle = depressionGradient;
    ctx.fill();

    // Add rim highlights to enhance the 3D biconcave effect
    // Top rim highlight
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.2, radius * 0.7, radius * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 120, 120, ${alpha * 0.25})`;
    ctx.fill();

    // Bottom rim highlight
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.2, radius * 0.7, radius * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 120, 120, ${alpha * 0.25})`;
    ctx.fill();

    // Outer edge definition stroke
    ctx.strokeStyle = `rgba(255, 80, 80, ${alpha * 0.3})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.95, radius * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Add subtle texture lines to simulate the cell membrane flexibility
    if (alpha > 0.5) {
      ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.15})`;
      ctx.lineWidth = 0.3;
      
      // Draw a few subtle curved lines across the cell
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const startX = Math.cos(angle) * radius * 0.3;
        const startY = Math.sin(angle) * radius * 0.25;
        const endX = Math.cos(angle + Math.PI) * radius * 0.3;
        const endY = Math.sin(angle + Math.PI) * radius * 0.25;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(0, 0, endX, endY);
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let bloodCells: RedBloodCell[] = createRedBloodCells();

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
      // Dark blood-like background with subtle fade
      ctx.fillStyle = 'rgba(8, 2, 2, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentMouse: MouseState = mouseRef.current;

      // Update and draw blood cells
      bloodCells.forEach((cell: RedBloodCell, index: number) => {
        // Mouse influence - creates flow currents
        if (currentMouse.isActive) {
          const dx: number = currentMouse.x - cell.x;
          const dy: number = currentMouse.y - cell.y;
          const distance: number = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < INFLUENCE_RADIUS && distance > 5) {
            const force: number = (INFLUENCE_RADIUS - distance) / INFLUENCE_RADIUS * 0.03;
            cell.vx += (dx / distance) * force;
            cell.vy += (dy / distance) * force;
            
            // Increase rotation speed when influenced
            cell.rotationSpeed += force * 0.5;
          }
        }

        // Natural floating behavior
        cell.vx += (Math.random() - 0.5) * 0.01;
        cell.vy += (Math.random() - 0.5) * 0.01;

        // Apply gentle damping (blood viscosity)
        cell.vx *= 0.98;
        cell.vy *= 0.98;
        
        // Update position
        cell.x += cell.vx * FLOW_SPEED;
        cell.y += cell.vy * FLOW_SPEED;

        // Update rotation
        cell.rotation += cell.rotationSpeed;
        cell.rotationSpeed *= 0.99; // Gradual rotation decay

        // Boundary wrapping
        if (cell.x < -cell.size) cell.x = canvas.width + cell.size;
        if (cell.x > canvas.width + cell.size) cell.x = -cell.size;
        if (cell.y < -cell.size) cell.y = canvas.height + cell.size;
        if (cell.y > canvas.height + cell.size) cell.y = -cell.size;

        // Update life
        cell.life--;
        if (cell.life <= 0) {
          // Regenerate cell
          bloodCells[index] = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            size: CELL_SIZE_MIN + Math.random() * (CELL_SIZE_MAX - CELL_SIZE_MIN),
            life: cell.maxLife,
            maxLife: 500,
            opacity: 0.7 + Math.random() * 0.3
          };
        }

        // Draw the anatomically accurate biconcave red blood cell
        drawBiconcaveCell(ctx, cell);
      });

      // Draw mouse influence area
      if (currentMouse.isActive) {
        const gradient: CanvasGradient = ctx.createRadialGradient(
          currentMouse.x, currentMouse.y, 0, 
          currentMouse.x, currentMouse.y, INFLUENCE_RADIUS
        );
        
        gradient.addColorStop(0, 'rgba(200, 50, 50, 0.05)');
        gradient.addColorStop(0.5, 'rgba(150, 30, 30, 0.02)');
        gradient.addColorStop(1, 'rgba(100, 20, 20, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, INFLUENCE_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Central pulse
        const pulse: number = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 100, 100, ${pulse * 0.1})`;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      bloodCells = createRedBloodCells();
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
    <div className="relative inset-0 bg-gray-900">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{ background: 'linear-gradient(135deg, #0a0202 0%, #1a0505 50%, #0a0202 100%)' }}
      />
      
      {/* Info overlay */}
      {/* <div className="absolute top-4 left-4 text-white/70 text-sm font-mono">
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded-lg border border-red-500/20">
          <div className="text-red-300">Anatomically Accurate Red Blood Cells</div>
          <div className="text-xs mt-1 text-red-200">
            Move cursor to create flow currents
          </div>
          <div className="text-xs text-pink-300">
            {isActive ? 'Flow: Active' : 'Flow: Idle'} | Cells: {MAX_CELLS}
          </div>
          <div className="text-xs text-red-400 mt-1">
            Biconcave disc • Thick rim, thin center • 7-8 μm diameter
          </div>
          <div className="text-xs text-orange-300 mt-1">
            Enhanced: Elliptical shape • Central depression • Rim highlights
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default RedBloodCells;