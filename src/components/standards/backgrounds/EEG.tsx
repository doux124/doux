import { useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };

type Waveform = {
  id: number;
  frequency: number;
  amplitude: number;
  phase: number;
  yOffset: number;
  color: string;
  points: Point[];
  mouseInfluence: number;
  noiseOffset: number;
};

const EEG: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const waveformsRef = useRef<Waveform[]>([]);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const initWaveforms = () => {
      const numWaveforms = 8;
      const waveforms: Waveform[] = [];

      for (let i = 0; i < numWaveforms; i++) {
        waveforms.push({
          id: i,
          frequency: 0.02 + Math.random() * 0.04,
          amplitude: 20 + Math.random() * 40,
          phase: Math.random() * Math.PI * 2,
          yOffset: (window.innerHeight / (numWaveforms + 1)) * (i + 1),
          color: `hsl(${180 + i * 15}, 70%, ${50 + i * 5}%)`,
          points: [],
          mouseInfluence: 0,
          noiseOffset: Math.random() * 1000
        });
      }

      waveformsRef.current = waveforms;
    };

    initWaveforms();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(5, 15, 25, 0.05)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      waveformsRef.current.forEach((waveform) => {
        const mouseDistance = Math.abs(mouseRef.current.y - waveform.yOffset);
        const maxInfluence = 150;
        waveform.mouseInfluence = Math.max(0, (maxInfluence - mouseDistance) / maxInfluence);

        waveform.points = [];
        const resolution = 3;

        for (let x = 0; x <= dimensions.width; x += resolution) {
          let y = 0;
          y += Math.sin((x * waveform.frequency) + (time * 0.01) + waveform.phase) * waveform.amplitude;
          y += Math.sin((x * waveform.frequency * 2.3) + (time * 0.015) + waveform.phase) * (waveform.amplitude * 0.3);
          y += Math.sin((x * waveform.frequency * 0.7) + (time * 0.008) + waveform.phase) * (waveform.amplitude * 0.5);

          const noiseFreq = 0.1;
          const noise = (Math.sin((x * noiseFreq) + waveform.noiseOffset + (time * 0.02)) * 5) +
                        (Math.sin((x * noiseFreq * 3) + waveform.noiseOffset + (time * 0.03)) * 2);
          y += noise;

          if (waveform.mouseInfluence > 0) {
            const mouseEffect = waveform.mouseInfluence * 30;
            const distanceFromMouse = Math.abs(x - mouseRef.current.x);
            const localInfluence = Math.max(0, (200 - distanceFromMouse) / 200);
            y += mouseEffect * localInfluence * Math.sin(x * 0.02 + time * 0.05);
          }

          waveform.points.push({ x, y: waveform.yOffset + y });
        }

        if (waveform.points.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = waveform.color;
          ctx.lineWidth = 1.5 + (waveform.mouseInfluence * 1.5);
          ctx.globalAlpha = 0.6 + (waveform.mouseInfluence * 0.4);

          ctx.moveTo(waveform.points[0].x, waveform.points[0].y);

          for (let i = 1; i < waveform.points.length - 1; i++) {
            const current = waveform.points[i];
            const next = waveform.points[i + 1];
            const controlX = (current.x + next.x) / 2;
            const controlY = (current.y + next.y) / 2;
            ctx.quadraticCurveTo(current.x, current.y, controlX, controlY);
          }

          const lastPoint = waveform.points[waveform.points.length - 1];
          ctx.lineTo(lastPoint.x, lastPoint.y);
          ctx.stroke();

          if (waveform.mouseInfluence > 0.3) {
            ctx.shadowColor = waveform.color;
            ctx.shadowBlur = 10 * waveform.mouseInfluence;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      });

      if (mouseRef.current.x && mouseRef.current.y) {
        const gradient = ctx.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, 80
        );
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(mouseRef.current.x - 80, mouseRef.current.y - 80, 160, 160);
      }

      time += 1;
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
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />

      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(100, 200, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 200, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="absolute top-4 left-4 text-cyan-400 font-mono text-xs opacity-40">
        <div>NEURAL ACTIVITY MONITOR</div>
        <div className="mt-1">FREQ: 0.5-50 Hz</div>
        <div>AMP: ±100 μV</div>
      </div>
    </div>
  );
};

export default EEG;
