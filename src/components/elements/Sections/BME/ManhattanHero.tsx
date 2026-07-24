import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../../../lib/motion';

gsap.registerPlugin(ScrollTrigger);

interface Particle {
  ix: number;
  iy: number;
  fx: number;
  fy: number;
  x: number;
  y: number;
  size: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  fa: number;
  fb: number;
  fc: number;
  pa: number;
  pb: number;
  pc: number;
  delay: number;
  heat: number;
}

const PAD_X = 18;
const PAD_T = 20;
const PAD_B = 28;
const DOT_SPACING = 4.7;
const THRESHOLD_T = 0.62;

type RoofStyle = 'flat' | 'crown' | 'needle' | 'pyramid' | 'setback' | 'spire';

interface BuildingSpec {
  left: number;
  width: number;
  heightT: number;
  roof: RoofStyle;
  antenna?: boolean;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function thresholdY(height: number) {
  return height - PAD_B - Math.max(1, height - PAD_T - PAD_B) * THRESHOLD_T;
}

function particleColor(finalY: number, signalY: number, rowT: number, buildingT: number): [number, number, number, number] {
  const isSignificant = finalY <= signalY;
  const heat = isSignificant ? clamp((signalY - finalY) / Math.max(1, signalY - PAD_T), 0, 1) : 0;

  if (isSignificant) {
    return [
      Math.round(lerp(215, 255, heat)),
      Math.round(lerp(54, 78, heat * 0.45)),
      Math.round(lerp(58, 72, heat * 0.35)),
      heat,
    ];
  }

  const lift = clamp(rowT * 0.45 + buildingT * 0.25, 0, 1);
  return [
    Math.round(lerp(46, 78, lift)),
    Math.round(lerp(112, 172, lift)),
    Math.round(lerp(226, 255, lift)),
    0,
  ];
}

function roofBounds(cols: number, rowT: number, roof: RoofStyle): [number, number] | null {
  const center = cols / 2;
  let inset = 0;

  if (roof === 'setback') {
    if (rowT > 0.84) inset = Math.floor(cols * 0.22);
    else if (rowT > 0.68) inset = Math.floor(cols * 0.12);
  }

  if (roof === 'crown' && rowT > 0.78) {
    inset = Math.floor(cols * 0.16);
    if (rowT > 0.92 && Math.abs(center - Math.round(center)) < 0.2) inset += 1;
  }

  if (roof === 'pyramid' && rowT > 0.56) {
    inset = Math.floor(((rowT - 0.56) / 0.44) * cols * 0.48);
  }

  if (roof === 'spire' && rowT > 0.7) {
    inset = Math.floor(((rowT - 0.7) / 0.3) * cols * 0.5);
  }

  if (roof === 'needle' && rowT > 0.68) {
    const shaftWidth = Math.max(1, Math.round(cols * (rowT > 0.88 ? 0.16 : 0.28)));
    const start = Math.max(0, Math.floor(center - shaftWidth / 2));
    return [start, Math.min(cols, start + shaftWidth)];
  }

  const start = Math.max(0, inset);
  const end = Math.min(cols, cols - inset);
  return start >= end ? null : [start, end];
}

function generateBuildings(width: number): BuildingSpec[] {
  const rng = mulberry32(89);
  const buildings: BuildingSpec[] = [];
  const cityWidth = Math.max(1, width - PAD_X * 2);
  const maxX = width - PAD_X;
  const roofChoices: RoofStyle[] = ['flat', 'flat', 'flat', 'crown', 'pyramid', 'setback'];
  const landmarks: BuildingSpec[] = ([
    { left: PAD_X + cityWidth * 0.27 - cityWidth * 0.03, width: clamp(cityWidth * 0.06, 20, 40), heightT: 0.78, roof: 'spire', antenna: true },
    { left: PAD_X + cityWidth * 0.48 - cityWidth * 0.045, width: clamp(cityWidth * 0.09, 28, 52), heightT: 0.94, roof: 'setback' },
    { left: PAD_X + cityWidth * 0.62 - cityWidth * 0.026, width: clamp(cityWidth * 0.052, 18, 34), heightT: 0.86, roof: 'needle', antenna: true },
    { left: PAD_X + cityWidth * 0.76 - cityWidth * 0.035, width: clamp(cityWidth * 0.07, 22, 42), heightT: 0.7, roof: 'crown' },
  ] satisfies BuildingSpec[]).map((building) => ({
    ...building,
    left: clamp(building.left, PAD_X, maxX - building.width),
  })).sort((a, b) => a.left - b.left);

  const fillGap = (from: number, to: number) => {
    let x = from;

    while (x < to - 5) {
      const remaining = to - x;
      const buildingWidth = Math.min(remaining, 7 + rng() * 15);
      const centerT = clamp((x + buildingWidth * 0.5 - PAD_X) / cityWidth, 0, 1);
      const downtownPull = Math.exp(-Math.pow((centerT - 0.54) / 0.24, 2));
      const roll = rng();
      let heightT = 0;

      if (roll < 0.72) heightT = 0.12 + rng() * 0.19 + downtownPull * 0.04;
      else if (roll < 0.96) heightT = 0.28 + rng() * 0.2 + downtownPull * 0.07;
      else heightT = 0.46 + rng() * 0.1 + downtownPull * 0.06;

      buildings.push({
        left: x,
        width: Math.max(5, buildingWidth),
        heightT: clamp(heightT, 0.1, 0.59),
        roof: roofChoices[Math.floor(rng() * roofChoices.length)],
      });

      x += buildingWidth + 1.2 + rng() * 2.4;
    }
  };

  let cursor = PAD_X;

  for (const landmark of landmarks) {
    fillGap(cursor, landmark.left - 2);
    buildings.push(landmark);
    cursor = landmark.left + landmark.width + 2;
  }

  fillGap(cursor, maxX);

  return buildings.sort((a, b) => a.left - b.left);
}

function buildSkylineParticles(width: number, height: number): Particle[] {
  const particleRng = mulberry32(233);
  const particles: Particle[] = [];
  const baseline = height - PAD_B;
  const usableHeight = Math.max(1, height - PAD_T - PAD_B);
  const signalY = thresholdY(height);
  const buildings = generateBuildings(width);

  const addParticle = (fx: number, fy: number, rowT: number, buildingT: number, delayBias = 0) => {
    const [r, g, b, heat] = particleColor(fy, signalY, rowT, buildingT);

    particles.push({
      ix: PAD_X + particleRng() * Math.max(1, width - PAD_X * 2),
      iy: PAD_T + particleRng() * Math.max(1, height - PAD_T - PAD_B),
      fx,
      fy,
      x: 0,
      y: 0,
      size: lerp(0.95, 1.75, clamp(buildingT * 0.45 + rowT * 0.34 + heat * 0.35, 0, 1)),
      r,
      g,
      b,
      alpha: heat > 0 ? 0.92 : 0.7,
      fa: 0.55 + particleRng() * 1.35,
      fb: 0.35 + particleRng() * 1.05,
      fc: 0.25 + particleRng() * 0.75,
      pa: particleRng() * Math.PI * 2,
      pb: particleRng() * Math.PI * 2,
      pc: particleRng() * Math.PI * 2,
      delay: particleRng() * 0.22 + delayBias,
      heat,
    });
  };

  for (const building of buildings) {
    const towerHeight = usableHeight * building.heightT;
    const cols = Math.max(1, Math.round(building.width / DOT_SPACING));
    const rows = Math.max(5, Math.round(towerHeight / DOT_SPACING));
    const dotStepX = building.width / cols;

    for (let row = 0; row < rows; row++) {
      const rowT = rows <= 1 ? 0 : row / (rows - 1);
      const bounds = roofBounds(cols, rowT, building.roof);
      if (!bounds) continue;
      const [minCol, maxCol] = bounds;

      for (let col = minCol; col < maxCol; col++) {
        if (particleRng() < 0.018 && rowT < 0.86) continue;

        const jitterX = (particleRng() - 0.5) * 0.65;
        const jitterY = (particleRng() - 0.5) * 0.65;
        const fx = building.left + (col + 0.5) * dotStepX + jitterX;
        const fy = baseline - row * DOT_SPACING + jitterY;
        addParticle(fx, fy, rowT, building.heightT, rowT * 0.08);
      }
    }

    if (building.antenna) {
      const antennaRows = Math.round(5 + building.heightT * 5);
      const antennaX = building.left + building.width * 0.5;
      const roofY = baseline - rows * DOT_SPACING;

      for (let row = 0; row < antennaRows; row++) {
        const rowT = clamp(0.88 + row / antennaRows * 0.12, 0, 1);
        addParticle(
          antennaX + (particleRng() - 0.5) * 1.2,
          roofY - row * (DOT_SPACING * 0.84),
          rowT,
          building.heightT,
          0.08,
        );
      }
    }
  }

  return particles;
}

export function ManhattanHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const progRef = useRef({ value: 0 });
  const ptRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 1;
    let H = 1;
    let rafId = 0;
    let refreshId = 0;

    const rebuild = () => {
      const rect = wrap.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ptRef.current = buildSkylineParticles(W, H);

      cancelAnimationFrame(refreshId);
      refreshId = requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    rebuild();

    const drawGuides = (formed: number) => {
      const alpha = clamp((formed - 0.18) / 0.72, 0, 1);
      if (alpha <= 0) return;

      const baseline = H - PAD_B + 0.5;
      const signalLine = thresholdY(H) + 0.5;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(79, 140, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD_X, baseline);
      ctx.lineTo(W - PAD_X, baseline);
      ctx.stroke();

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(255, 76, 78, 0.46)';
      ctx.setLineDash([6, 7]);
      ctx.beginPath();
      ctx.moveTo(PAD_X, signalLine);
      ctx.lineTo(W - PAD_X, signalLine);
      ctx.stroke();
      ctx.restore();
    };

    const renderFrame = (now: number) => {
      const t = now / 1000;
      const progress = clamp(progRef.current.value, 0, 1);
      const formed = easeInOutCubic(progress);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#06101F';
      ctx.fillRect(0, 0, W, H);

      const vignette = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.78);
      vignette.addColorStop(0, 'rgba(16, 36, 65, 0.52)');
      vignette.addColorStop(1, 'rgba(2, 5, 12, 0.92)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      drawGuides(formed);

      for (const p of ptRef.current) {
        const pp = clamp((progress - p.delay) / (1 - p.delay), 0, 1);
        const ep = easeInOutCubic(pp);
        const amp = lerp(24, 0.22, ep);
        const driftX =
          Math.sin(t * p.fa + p.pa) * amp +
          Math.sin(t * (p.fb + 0.38) + p.pb) * amp * 0.52 +
          Math.cos(t * p.fc + p.pc) * amp * 0.28;
        const driftY =
          Math.cos(t * (p.fa * 0.9) + p.pb) * amp +
          Math.sin(t * (p.fb * 1.18) + p.pc) * amp * 0.48 +
          Math.cos(t * (p.fc + 0.24) + p.pa) * amp * 0.24;
        const brownianX = p.ix + driftX;
        const brownianY = p.iy + driftY;

        p.x = lerp(brownianX, p.fx, ep);
        p.y = lerp(brownianY, p.fy, ep);

        if (p.heat > 0.2 && ep > 0.36) {
          const glowAlpha = (ep - 0.36) / 0.64 * p.heat * 0.22;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5.6);
          grad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${glowAlpha})`);
          grad.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 5.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = lerp(0.45, p.alpha, ep);
        ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    // Reduced motion: render the completed plot once, no scroll-scrubbed animation or loop.
    if (prefersReducedMotion()) {
      progRef.current.value = 1;
      renderFrame(0);
      const ro = new ResizeObserver(() => {
        rebuild();
        progRef.current.value = 1;
        renderFrame(0);
      });
      ro.observe(wrap);
      return () => {
        cancelAnimationFrame(refreshId);
        ro.disconnect();
      };
    }

    const gsapContext = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: 'top 88%',
          end: 'center center',
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      }).to(progRef.current, {
        value: 1,
        ease: 'none',
      });
    }, wrap);

    // Throttle to 30fps — the scroll-scrubbed formation is smooth well below 60fps.
    const FRAME_INTERVAL = 1000 / 30;
    let lastFrame = 0;
    let visible = true;

    // Fully stop the loop while off-screen (rafId = 0) rather than rescheduling a
    // no-op frame. When this canvas is placed in the projects carousel, react-slick
    // clones it for the infinite loop, so several copies exist; only the on-screen
    // one should spend any frames. The IntersectionObserver re-arms the loop when a
    // copy scrolls back into view.
    const tick = (now: number) => {
      if (!visible) {
        rafId = 0;
        return;
      }
      if (now - lastFrame >= FRAME_INTERVAL) {
        lastFrame = now;
        renderFrame(now);
      }
      rafId = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && rafId === 0) {
          lastFrame = 0;
          rafId = requestAnimationFrame(tick);
        }
      },
      { threshold: 0 }
    );
    io.observe(wrap);

    rafId = requestAnimationFrame(tick);

    const resizeObserver = new ResizeObserver(rebuild);
    resizeObserver.observe(wrap);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(refreshId);
      io.disconnect();
      resizeObserver.disconnect();
      gsapContext.revert();
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden" style={{ background: '#06101F' }}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

export default ManhattanHero;
