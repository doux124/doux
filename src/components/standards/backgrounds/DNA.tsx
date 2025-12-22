import React, { useEffect, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
  z: number;
  separation: number;
  flattenFactor: number;
}

interface BasePairColor {
  a: string;
  b: string;
}

interface RibbonSegment {
  type: 'ribbon';
  p0: Point;
  p1: Point;
  z: number;
  color: string;
  width: number;
}

interface BasePairSegment {
  type: 'basepair';
  p1: Point;
  p2: Point;
  z: number;
  colors: BasePairColor;
  opacity: number;
}

type Segment = RibbonSegment | BasePairSegment;

const DNA: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const isVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);
  const TARGET_FPS = 30; // Throttle to 30 FPS
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

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
    const container = containerRef.current;
    
    const updateDimensions = () => {
      if (container) {
        const rect = container.getBoundingClientRect();
        setDimensions({ 
          width: rect.width || window.innerWidth, 
          height: rect.height || window.innerHeight 
        });
      } else {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (container) {
      resizeObserver.observe(container);
    }
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisibleRef.current) return;
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const basePairColors: BasePairColor[] = [
      { a: '#FF6B9D', b: '#4ECDC4' },
      { a: '#45B7D1', b: '#F7DC6F' },
      { a: '#BB8FCE', b: '#82E0AA' },
      { a: '#F1948A', b: '#85C1E9' },
    ];

    const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

    const drawRibbon = (
      ctx: CanvasRenderingContext2D,
      p0: Point,
      p1: Point,
      z: number,
      color: string,
      w: number
    ) => {
      const maxZ = 80;
      const f = Math.max(0.1, Math.abs(z) / maxZ);
      const ribbonW = w * (0.3 + f * 0.7);
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const px = (-dy / len) * ribbonW;
      const py = (dx / len) * ribbonW;

      ctx.beginPath();
      ctx.moveTo(p0.x - px, p0.y - py);
      ctx.lineTo(p0.x + px, p0.y + py);
      ctx.lineTo(p1.x + px, p1.y + py);
      ctx.lineTo(p1.x - px, p1.y - py);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.4 + f * 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawBasePair = (
      ctx: CanvasRenderingContext2D,
      p1: Point,
      p2: Point,
      c: BasePairColor,
      opacity: number = 1
    ) => {
      const g = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      g.addColorStop(0, c.a);
      g.addColorStop(0.5, '#fff');
      g.addColorStop(1, c.b);
      ctx.strokeStyle = g;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7 * opacity;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const draw = (timestamp: number) => {
      // Skip if not visible
      if (!isVisibleRef.current) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Frame rate throttling
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed < FRAME_INTERVAL) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastFrameTimeRef.current = timestamp - (elapsed % FRAME_INTERVAL);

      const { width, height } = dimensions;
      
      // Use solid background instead of clearRect for better performance
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Reduced particle count (25 instead of 50)
      for (let i = 0; i < 25; i++) {
        const s = i * 1.618;
        const x = (Math.sin(time * 0.0002 + s * 2) * 0.5 + 0.5) * width;
        const baseY = (s * 47.4) % height; // Adjusted for fewer particles
        ctx.beginPath();
        ctx.arc(x, baseY, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,120,200,${
          Math.sin(time * 0.001 + i) * 0.1 + 0.06
        })`;
        ctx.fill();
      }

      const centerX = width / 2;
      const forkY = mouseRef.current.y;
      const forkActive = forkY > 0 && forkY < height;

      const radius = 80;
      const step = 2.5; // Increased step for fewer calculations
      const twist = 0.025;
      const spin = 0.006;
      const grooveOffset = Math.PI * 0.35;

      const transitionZone = 120;
      const unwoundHalfHeight = 80;
      const maxSeparation = 140;

      const s1: Point[] = [];
      const s2: Point[] = [];

      const buffer = 200; // Reduced buffer
      const startIndex = Math.floor(-buffer / step);
      const endIndex = Math.ceil((height + buffer) / step);

      for (let i = startIndex; i < endIndex; i++) {
        const y = i * step;
        const theta = i * twist + time * spin;

        const baseX1 = centerX + Math.sin(theta) * radius;
        const baseZ1 = Math.cos(theta) * radius;
        
        const baseX2 = centerX + Math.sin(theta + Math.PI + grooveOffset) * radius;
        const baseZ2 = Math.cos(theta + Math.PI + grooveOffset) * radius;

        let separation = 0;
        let flattenFactor = 1;

        if (forkActive) {
          const distFromFork = y - forkY;
          
          if (Math.abs(distFromFork) <= unwoundHalfHeight) {
            separation = maxSeparation;
            flattenFactor = 0.05;
          } else if (distFromFork > unwoundHalfHeight && distFromFork < unwoundHalfHeight + transitionZone) {
            const t = (distFromFork - unwoundHalfHeight) / transitionZone;
            const eased = easeInOutSine(t);
            separation = maxSeparation * (1 - eased);
            flattenFactor = 0.05 + eased * 0.95;
          } else if (distFromFork < -unwoundHalfHeight && distFromFork > -unwoundHalfHeight - transitionZone) {
            const t = (-distFromFork - unwoundHalfHeight) / transitionZone;
            const eased = easeInOutSine(t);
            separation = maxSeparation * (1 - eased);
            flattenFactor = 0.05 + eased * 0.95;
          }
        }

        s1.push({
          x: baseX1 - separation,
          y,
          z: baseZ1 * flattenFactor,
          separation,
          flattenFactor,
        });

        s2.push({
          x: baseX2 + separation,
          y,
          z: baseZ2 * flattenFactor,
          separation,
          flattenFactor,
        });
      }

      const ribbonWidth = 4;
      const baseInterval = 12; // Reduced interval for fewer base pairs

      const segments: Segment[] = [];

      for (let i = 1; i < s1.length; i++) {
        const a0 = s1[i - 1];
        const a1 = s1[i];
        const b0 = s2[i - 1];
        const b1 = s2[i];

        if (a1.y < -50 || a1.y > height + 50) continue;

        const zA = (a0.z + a1.z) / 2;
        const zB = (b0.z + b1.z) / 2;
        const separation = a1.separation;

        segments.push({
          type: 'ribbon',
          p0: a0,
          p1: a1,
          z: zA,
          color: '#FF6B9D',
          width: ribbonWidth,
        });

        segments.push({
          type: 'ribbon',
          p0: b0,
          p1: b1,
          z: zB,
          color: '#4ECDC4',
          width: ribbonWidth,
        });

        const absIndex = startIndex + i;
        if (absIndex % baseInterval === 0 && separation < maxSeparation * 0.3) {
          const colorIndex = Math.abs(Math.floor(absIndex / baseInterval)) % basePairColors.length;
          const c = basePairColors[colorIndex];
          const basePairOpacity = Math.max(0, 1 - (separation / (maxSeparation * 0.3)));
          if (basePairOpacity > 0.05) {
            segments.push({
              type: 'basepair',
              p1: a1,
              p2: b1,
              z: Math.min(zA, zB) - 1,
              colors: c,
              opacity: basePairOpacity,
            });
          }
        }
      }

      segments.sort((a, b) => a.z - b.z);

      for (const seg of segments) {
        if (seg.type === 'ribbon') {
          drawRibbon(ctx, seg.p0, seg.p1, seg.z, seg.color, seg.width);
        } else if (seg.type === 'basepair') {
          drawBasePair(ctx, seg.p1, seg.p2, seg.colors, seg.opacity);
        }
      }

      if (forkActive) {
        const glow = ctx.createRadialGradient(
          centerX, forkY, 0,
          centerX, forkY, 180
        );
        glow.addColorStop(0, 'rgba(0,255,200,0.25)');
        glow.addColorStop(0.4, 'rgba(0,200,255,0.1)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        // Reduced particle count for fork effect (6 instead of 10)
        for (let i = 0; i < 6; i++) {
          const a = time * 0.04 + (i * Math.PI * 2) / 6;
          const r = 22 + Math.sin(time * 0.025 + i) * 6;
          ctx.beginPath();
          ctx.arc(
            centerX + Math.cos(a) * r,
            forkY + Math.sin(a) * r * 0.35,
            2.5,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(0,255,200,${0.5 + Math.sin(time * 0.03 + i) * 0.3})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(centerX, forkY, 6 + Math.sin(time * 0.06) * 2, 0, Math.PI * 2);
        const coreGrad = ctx.createRadialGradient(centerX, forkY, 0, centerX, forkY, 8);
        coreGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
        coreGrad.addColorStop(1, 'rgba(0,255,200,0.3)');
        ctx.fillStyle = coreGrad;
        ctx.fill();
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [dimensions]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default DNA;