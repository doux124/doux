import { useEffect, useRef, useState, useCallback } from 'react';

// Type definitions
interface Cell {
  state: number;
  type: 'empty' | 'core' | 'stem' | 'progenitor' | 'differentiated';
  age: number;
  energy: number;
  organoidId: number | null;
}

interface OrganoidCenter {
  x: number;
  y: number;
  radius: number;
  age: number;
  id: number;
}

interface MouseState {
  x: number;
  y: number;
  clicked: boolean;
}

interface Dimensions {
  width: number;
  height: number;
}

interface NeighborTypes {
  stem: number;
  progenitor: number;
  differentiated: number;
  core: number;
}

type Grid = Cell[][];

const CellularAutomata: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, clicked: false });
  const gridRef = useRef<Grid | null>(null);
  const organoidCentersRef = useRef<OrganoidCenter[]>([]);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  
  const CELL_SIZE = 3;
  const UPDATE_INTERVAL = 6;
  const MAX_ORGANOIDS = 8;
  
  // Organoid-specific cellular automata rules
  const updateCell = useCallback((grid: Grid, x: number, y: number, cols: number, rows: number): Cell => {
    const current = grid[y][x];
    let neighbors = 0;
    let neighborTypes: NeighborTypes = { stem: 0, progenitor: 0, differentiated: 0, core: 0 };
    let nearestCenter: OrganoidCenter | null = null;
    let minDist = Infinity;
    
    // Find nearest organoid center and calculate distance
    organoidCentersRef.current.forEach((center: OrganoidCenter) => {
      const dist = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearestCenter = center;
      }
    });
    
    // Count neighbors and their types
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = (x + dx + cols) % cols;
        const ny = (y + dy + rows) % rows;
        
        if (grid[ny][nx].state > 0) {
          neighbors++;
          const type = grid[ny][nx].type;
          if (type !== 'empty') {
            neighborTypes[type]++;
          }
        }
      }
    }
    
    const newCell: Cell = { ...current };
    
    // Mouse influence for new organoid formation
    const mouseX = Math.floor(mouseRef.current.x / CELL_SIZE);
    const mouseY = Math.floor(mouseRef.current.y / CELL_SIZE);
    const distanceToMouse = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
    const mouseInfluence = Math.max(0, (25 - distanceToMouse) / 25);
    
    // Organoid growth rules
    if (current.state === 0) { // Empty cell
      // Growth occurs in radial patterns from organoid centers
      if (nearestCenter && minDist < (nearestCenter as OrganoidCenter).radius + 10) {
        const growthProbability = Math.max(0, ((nearestCenter as OrganoidCenter).radius + 10 - minDist) / 20);
        
        if (neighbors >= 2 && neighbors <= 5 && Math.random() < growthProbability * 0.3) {
          // Cell type based on distance from center (organoid layering)
          if (minDist < 8) {
            newCell.type = 'core'; // Inner core
          } else if (minDist < 16) {
            newCell.type = 'stem'; // Stem cell zone
          } else if (minDist < 28) {
            newCell.type = 'progenitor'; // Progenitor zone
          } else {
            newCell.type = 'differentiated'; // Outer differentiated layer
          }
          
          newCell.state = 1;
          newCell.age = 0;
          newCell.energy = 0.9 + Math.random() * 0.1;
          newCell.organoidId = (nearestCenter as OrganoidCenter).id;
        }
      }
      
      // Mouse creates new organoid centers
      if (mouseInfluence > 0.7 && Math.random() < mouseInfluence * 0.05) {
        if (organoidCentersRef.current.length < MAX_ORGANOIDS) {
          const newCenter: OrganoidCenter = {
            x: mouseX,
            y: mouseY,
            radius: 5,
            age: 0,
            id: Date.now()
          };
          organoidCentersRef.current.push(newCenter);
        }
        
        newCell.state = 1;
        newCell.type = 'core';
        newCell.age = 0;
        newCell.energy = 1.0;
      }
    } else { // Living cell
      // Aging and energy management
      newCell.age += 0.8 + Math.random() * 0.4;
      newCell.energy -= 0.001 + Math.random() * 0.0005;
      
      // Mouse rejuvenation
      if (mouseInfluence > 0.2) {
        newCell.energy += mouseInfluence * 0.03;
        newCell.energy = Math.min(newCell.energy, 1.0);
      }
      
      // Organoid-specific cell type transitions
      if (nearestCenter && current.organoidId === (nearestCenter as OrganoidCenter).id) {
        const distanceFromCenter = minDist;
        
        // Core cells remain stable longer
        if (current.type === 'core') {
          if (newCell.age > 150 + Math.random() * 50 && distanceFromCenter > 12) {
            newCell.type = 'stem';
          }
        }
        // Stem cells differentiate based on position and neighbors
        else if (current.type === 'stem') {
          if (newCell.age > 80 + Math.random() * 40) {
            if (distanceFromCenter > 20 || neighborTypes.differentiated > 2) {
              newCell.type = 'progenitor';
            }
          }
        }
        // Progenitors become differentiated
        else if (current.type === 'progenitor') {
          if (newCell.age > 60 + Math.random() * 30) {
            newCell.type = 'differentiated';
          }
        }
      }
      
      // Death conditions - organoids maintain better survival
      const survivalBonus = nearestCenter && current.organoidId === (nearestCenter as OrganoidCenter).id ? 0.1 : 0;
      
      if (newCell.energy < (0.05 - survivalBonus)) {
        newCell.state = 0;
        newCell.type = 'empty';
        newCell.age = 0;
        newCell.energy = 0;
        newCell.organoidId = null;
      }
      
      // Overcrowding in outer regions
      if (neighbors > 6 && current.type === 'differentiated' && Math.random() < 0.3) {
        newCell.state = 0;
        newCell.type = 'empty';
        newCell.age = 0;
        newCell.energy = 0;
        newCell.organoidId = null;
      }
      
      // Isolation death (organoids need connectivity)
      if (neighbors < 1 && Math.random() < 0.8) {
        newCell.state = 0;
        newCell.type = 'empty';
        newCell.age = 0;
        newCell.energy = 0;
        newCell.organoidId = null;
      }
    }
    
    return newCell;
  }, []);

  // Initialize grid and organoid centers
  useEffect(() => {
    const initGrid = (): void => {
      const cols = Math.ceil(window.innerWidth / CELL_SIZE);
      const rows = Math.ceil(window.innerHeight / CELL_SIZE);
      const grid: Grid = [];
      
      // Create initial organoid centers
      organoidCentersRef.current = [];
      const numInitialOrganoids = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numInitialOrganoids; i++) {
        organoidCentersRef.current.push({
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows),
          radius: 8 + Math.random() * 12,
          age: Math.random() * 100,
          id: i
        });
      }
      
      for (let y = 0; y < rows; y++) {
        const row: Cell[] = [];
        for (let x = 0; x < cols; x++) {
          let cellData: Cell = {
            state: 0,
            type: 'empty',
            age: 0,
            energy: 0,
            organoidId: null
          };
          
          // Initialize cells around organoid centers
          organoidCentersRef.current.forEach((center: OrganoidCenter, id: number) => {
            const dist = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
            if (dist < center.radius && Math.random() < (center.radius - dist) / center.radius * 0.8) {
              cellData = {
                state: 1,
                type: dist < 4 ? 'core' : dist < 8 ? 'stem' : dist < 14 ? 'progenitor' : 'differentiated',
                age: Math.random() * 50,
                energy: 0.7 + Math.random() * 0.3,
                organoidId: id
              };
            }
          });
          
          row.push(cellData);
        }
        grid.push(row);
      }
      
      gridRef.current = grid;
    };

    initGrid();
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = (): void => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseDown = (): void => {
      mouseRef.current.clicked = true;
    };

    const handleMouseUp = (): void => {
      mouseRef.current.clicked = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !gridRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const animate = (): void => {
      const grid = gridRef.current!;
      const cols = grid[0].length;
      const rows = grid.length;

      // Update cellular automata
      if (frameCount % UPDATE_INTERVAL === 0) {
        const newGrid: Grid = grid.map(row => [...row]);
        
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            newGrid[y][x] = updateCell(grid, x, y, cols, rows);
          }
        }
        
        // Update organoid centers (slow growth)
        organoidCentersRef.current.forEach((center: OrganoidCenter) => {
          center.age += 1;
          if (center.age % 100 === 0 && center.radius < 35) {
            center.radius += 0.5;
          }
        });
        
        // Remove old organoids occasionally
        if (Math.random() < 0.001 && organoidCentersRef.current.length > 2) {
          organoidCentersRef.current.splice(0, 1);
        }
        
        gridRef.current = newGrid;
      }

      // Clear canvas with darker background for better contrast
      ctx.fillStyle = 'rgba(5, 8, 12, 1)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw cells with organoid-appropriate colors
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = grid[y][x];
          
          if (cell.state > 0) {
            const pixelX = x * CELL_SIZE;
            const pixelY = y * CELL_SIZE;
            
            let color: string;
            let alpha = Math.min(cell.energy * 0.9, 0.85); // Reduced max opacity for better text contrast
            
            switch (cell.type) {
              case 'core':
                // Deep red-orange for organoid core
                color = `rgba(180, 60, 40, ${alpha})`;
                break;
              case 'stem':
                // Bright yellow-green for stem cells
                color = `rgba(120, 180, 60, ${alpha})`;
                break;
              case 'progenitor':
                // Blue-cyan for progenitor cells
                color = `rgba(60, 140, 200, ${alpha})`;
                break;
              case 'differentiated':
                // Purple for differentiated cells
                color = `rgba(140, 80, 180, ${alpha})`;
                break;
              default:
                color = `rgba(100, 100, 100, ${alpha})`;
            }
            
            // Draw cell
            ctx.fillStyle = color;
            ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
            
            // Add subtle glow for active core cells
            if (cell.type === 'core' && cell.energy > 0.8) {
              ctx.fillStyle = `rgba(255, 120, 80, ${(cell.energy - 0.8) * 0.2})`;
              ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
            }
          }
        }
      }

      // Draw organoid center indicators (subtle)
      organoidCentersRef.current.forEach((center: OrganoidCenter) => {
        const centerX = center.x * CELL_SIZE;
        const centerY = center.y * CELL_SIZE;
        
        // Very subtle center marker
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 180, 120, 0.1)';
        ctx.lineWidth = 1;
        ctx.arc(centerX, centerY, center.radius * CELL_SIZE * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw mouse influence area
      if (mouseRef.current.x && mouseRef.current.y) {
        const gradient = ctx.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, 75
        );
        gradient.addColorStop(0, 'rgba(200, 150, 100, 0.03)');
        gradient.addColorStop(0.5, 'rgba(180, 120, 60, 0.02)');
        gradient.addColorStop(1, 'rgba(180, 120, 60, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          mouseRef.current.x - 75, mouseRef.current.y - 75,
          150, 150
        );
      }

      frameCount++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, updateCell]);

  return (
    <div className="relative inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Organoid simulation info */}
      <div className="absolute top-4 left-4 text-orange-300 font-mono text-xs opacity-30">
        <div>ORGANOID SIMULATION</div>
        <div className="mt-1">CELL SIZE: {CELL_SIZE}px</div>
        <div>GROWTH: RADIAL</div>
        <div>MOUSE: ORGANOID SEEDING</div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 text-xs opacity-50">
        <div className="flex items-center gap-4 text-white font-mono">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-600 rounded"></div>
            <span>Core</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Stem</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded"></div>
            <span>Progenitor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>Differentiated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CellularAutomata;