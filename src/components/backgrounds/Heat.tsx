import { useEffect, useRef, useState } from 'react';

interface MousePosition {
  x: number;
  y: number;
  isDown: boolean;
  trail: TrailPoint[];
}

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

interface HeatCell {
  temperature: number;
  prevTemperature: number;
}

interface HeatMap {
  grid: HeatCell[][];
  cols: number;
  rows: number;
}

interface Dimensions {
  width: number;
  height: number;
}

const Heat: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<MousePosition>({ x: 0, y: 0, isDown: false, trail: [] });
  const heatMapRef = useRef<HeatMap | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  
  const RESOLUTION = 3; // Heat map resolution (lower = higher quality)
  const COOLING_RATE = 0.98; // How fast heat dissipates
  const DIFFUSION_RATE = 0.15; // How fast heat spreads
  const MOUSE_HEAT = 100; // Heat intensity from mouse
  const AMBIENT_TEMP = 0; // Background temperature

  // Initialize heat map
  useEffect(() => {
    const initHeatMap = (): void => {
      const cols = Math.ceil(window.innerWidth / RESOLUTION);
      const rows = Math.ceil(window.innerHeight / RESOLUTION);
      const heatMap: HeatCell[][] = [];
      
      for (let y = 0; y < rows; y++) {
        const row: HeatCell[] = [];
        for (let x = 0; x < cols; x++) {
          row.push({
            temperature: AMBIENT_TEMP,
            prevTemperature: AMBIENT_TEMP
          });
        }
        heatMap.push(row);
      }
      
      heatMapRef.current = { grid: heatMap, cols, rows };
    };

    initHeatMap();
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

  // Mouse tracking with trail
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      const newPos: TrailPoint = { x: e.clientX, y: e.clientY, time: Date.now() };
      
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      
      // Add to trail
      mouseRef.current.trail.push(newPos);
      
      // Limit trail length and remove old points
      const now = Date.now();
      mouseRef.current.trail = mouseRef.current.trail
        .filter(point => now - point.time < 1000) // Keep trail for 1 second
        .slice(-50); // Max 50 points
    };

    const handleMouseDown = (): void => {
      mouseRef.current.isDown = true;
    };

    const handleMouseUp = (): void => {
      mouseRef.current.isDown = false;
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

  // Heat simulation and rendering
  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !heatMapRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(dimensions.width, dimensions.height);

    const animate = (): void => {
      if (!heatMapRef.current) return;

      const { grid, cols, rows } = heatMapRef.current;

      // Apply heat from mouse position and trail
      const mouseGridX = Math.floor(mouseRef.current.x / RESOLUTION);
      const mouseGridY = Math.floor(mouseRef.current.y / RESOLUTION);
      
      // Main mouse heat source
      if (mouseGridX >= 0 && mouseGridX < cols && mouseGridY >= 0 && mouseGridY < rows) {
        const heatRadius = mouseRef.current.isDown ? 8 : 4;
        const heatIntensity = mouseRef.current.isDown ? MOUSE_HEAT * 1.5 : MOUSE_HEAT;
        
        for (let dy = -heatRadius; dy <= heatRadius; dy++) {
          for (let dx = -heatRadius; dx <= heatRadius; dx++) {
            const x = mouseGridX + dx;
            const y = mouseGridY + dy;
            
            if (x >= 0 && x < cols && y >= 0 && y < rows) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance <= heatRadius) {
                const falloff = Math.max(0, (heatRadius - distance) / heatRadius);
                const heatToAdd = heatIntensity * falloff * falloff; // Quadratic falloff
                grid[y][x].temperature = Math.min(100, grid[y][x].temperature + heatToAdd);
              }
            }
          }
        }
      }

      // Apply heat from mouse trail
      mouseRef.current.trail.forEach((point: TrailPoint) => {
        const age = (Date.now() - point.time) / 1000; // Age in seconds
        const trailIntensity = MOUSE_HEAT * 0.3 * (1 - age); // Fade with age
        
        const trailGridX = Math.floor(point.x / RESOLUTION);
        const trailGridY = Math.floor(point.y / RESOLUTION);
        
        if (trailGridX >= 0 && trailGridX < cols && trailGridY >= 0 && trailGridY < rows) {
          const radius = 2;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const x = trailGridX + dx;
              const y = trailGridY + dy;
              
              if (x >= 0 && x < cols && y >= 0 && y < rows) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                  const falloff = (radius - distance) / radius;
                  grid[y][x].temperature = Math.min(100, 
                    grid[y][x].temperature + trailIntensity * falloff);
                }
              }
            }
          }
        }
      });

      // Heat diffusion and cooling
      const newGrid: HeatCell[][] = grid.map(row => row.map(cell => ({ ...cell })));
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let avgTemp = 0;
          let count = 0;
          
          // Sample surrounding cells for diffusion
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              
              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                avgTemp += grid[ny][nx].temperature;
                count++;
              }
            }
          }
          
          avgTemp /= count;
          
          // Apply diffusion and cooling
          let newTemp = grid[y][x].temperature;
          newTemp += (avgTemp - newTemp) * DIFFUSION_RATE; // Diffusion
          newTemp *= COOLING_RATE; // Cooling
          newTemp = Math.max(AMBIENT_TEMP, newTemp); // Don't go below ambient
          
          newGrid[y][x].temperature = newTemp;
          newGrid[y][x].prevTemperature = grid[y][x].temperature;
        }
      }
      
      if (!heatMapRef.current) return;
      heatMapRef.current.grid = newGrid;

      // Render heat map to canvas
      const data = imageData.data;
      
      for (let y = 0; y < dimensions.height; y++) {
        for (let x = 0; x < dimensions.width; x++) {
          const gridX = Math.floor(x / RESOLUTION);
          const gridY = Math.floor(y / RESOLUTION);
          
          if (gridX < cols && gridY < rows) {
            const temp = newGrid[gridY][gridX].temperature;
            const normalizedTemp = Math.min(1, temp / 100);
            
            // Heat color mapping (black -> red -> orange -> yellow -> white)
            let r: number, g: number, b: number;
            
            if (normalizedTemp < 0.25) {
              // Black to dark red
              const t = normalizedTemp * 4;
              r = Math.floor(t * 128);
              g = 0;
              b = 0;
            } else if (normalizedTemp < 0.5) {
              // Dark red to bright red
              const t = (normalizedTemp - 0.25) * 4;
              r = Math.floor(128 + t * 127);
              g = 0;
              b = 0;
            } else if (normalizedTemp < 0.75) {
              // Red to orange
              const t = (normalizedTemp - 0.5) * 4;
              r = 255;
              g = Math.floor(t * 165);
              b = 0;
            } else {
              // Orange to yellow-white
              const t = (normalizedTemp - 0.75) * 4;
              r = 255;
              g = Math.floor(165 + t * 90);
              b = Math.floor(t * 255);
            }
            
            const pixelIndex = (y * dimensions.width + x) * 4;
            data[pixelIndex] = r;     // Red
            data[pixelIndex + 1] = g; // Green
            data[pixelIndex + 2] = b; // Blue
            data[pixelIndex + 3] = Math.floor(255 * Math.min(1, normalizedTemp + 0.1)); // Alpha
          } else {
            // Fill with ambient color
            const pixelIndex = (y * dimensions.width + x) * 4;
            data[pixelIndex] = 10;
            data[pixelIndex + 1] = 15;
            data[pixelIndex + 2] = 25;
            data[pixelIndex + 3] = 255;
          }
        }
      }
      
      // Clear canvas and draw heat map
      ctx.fillStyle = 'rgb(10, 15, 25)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      ctx.putImageData(imageData, 0, 0);

      // Add heat distortion effect
      if (mouseRef.current.x && mouseRef.current.y) {
        const mouseTemp = mouseGridX >= 0 && mouseGridX < cols && mouseGridY >= 0 && mouseGridY < rows
          ? newGrid[mouseGridY][mouseGridX].temperature : 0;
        
        if (mouseTemp > 20) {
          // Heat shimmer effect
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = `rgba(255, 100, 0, ${Math.min(0.1, mouseTemp / 1000)})`;
          
          const shimmerRadius = 50 + mouseTemp;
          ctx.beginPath();
          ctx.arc(mouseRef.current.x, mouseRef.current.y, shimmerRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw mouse trail with heat glow
      if (mouseRef.current.trail.length > 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        for (let i = 1; i < mouseRef.current.trail.length; i++) {
          const current = mouseRef.current.trail[i];
          const prev = mouseRef.current.trail[i - 1];
          const age = (Date.now() - current.time) / 1000;
          const alpha = Math.max(0, (1 - age) * 0.3);
          
          ctx.strokeStyle = `rgba(255, 150, 0, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(current.x, current.y);
          ctx.stroke();
        }
        
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <div className="fixed inset-0 -z-10 bg-slate-900">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Heat simulation info */}
      <div className="absolute top-4 left-4 text-orange-400 font-mono text-xs opacity-50">
        <div>THERMAL SIMULATION</div>
        <div className="mt-1">DIFFUSION: {DIFFUSION_RATE}</div>
        <div>COOLING: {(1 - COOLING_RATE) * 100}%/frame</div>
        <div>MOUSE: HEAT SOURCE</div>
        <div className="mt-2 text-xs">
          <div>🖱️ MOVE: Generate Heat</div>
          <div>🖱️ CLICK: Intense Heat</div>
        </div>
      </div>
      
      {/* Temperature scale */}
      <div className="absolute bottom-4 right-4">
        <div className="text-white font-mono text-xs mb-2 opacity-60">TEMPERATURE</div>
        <div className="w-4 h-32 bg-gradient-to-t from-black via-red-600 via-orange-500 to-yellow-200 border border-white/20 rounded"></div>
        <div className="text-xs text-white/60 font-mono mt-1 text-center">°C</div>
      </div>
    </div>
  );
};

export default Heat;