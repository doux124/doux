import { useEffect, useRef, useState } from 'react';

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  activation: number;
  baseActivation: number;
  pulsePhase: number;
  layer: number;
  mouseDistance: number;
  isActive: boolean;
  lastActivation: number;
}

interface Connection {
  nodeA: number;
  nodeB: number;
  distance: number;
  maxDistance: number;
  strength: number;
  baseStrength: number;
  weight: number;
  signalPosition: number;
  hasSignal: boolean;
  signalDirection: number;
  lastSignalTime: number;
}

interface Network {
  nodes: Node[];
  connections: Connection[];
}

const NeuralNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const networkRef = useRef<Network>({ nodes: [], connections: [] });
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const initNetwork = () => {
      const nodes: Node[] = [];
      const connections: Connection[] = [];
      const numNodes = 80;
      const connectionRadius = 120;

      for (let i = 0; i < numNodes; i++) {
        const node: Node = {
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: 2 + Math.random() * 4,
          baseRadius: 2 + Math.random() * 4,
          activation: Math.random(),
          baseActivation: Math.random(),
          pulsePhase: Math.random() * Math.PI * 2,
          layer: Math.floor(Math.random() * 4),
          mouseDistance: Infinity,
          isActive: false,
          lastActivation: 0,
        };
        nodes.push(node);
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionRadius) {
            connections.push({
              nodeA: i,
              nodeB: j,
              distance: distance,
              maxDistance: connectionRadius,
              strength: (connectionRadius - distance) / connectionRadius,
              baseStrength: (connectionRadius - distance) / connectionRadius,
              weight: Math.random() * 0.8 + 0.2,
              signalPosition: 0,
              hasSignal: false,
              signalDirection: Math.random() > 0.5 ? 1 : -1,
              lastSignalTime: 0,
            });
          }
        }
      }

      networkRef.current = { nodes, connections };
    };

    initNetwork();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
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
      if (!ctx) return;
      ctx.fillStyle = 'rgba(5, 10, 20, 0.08)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const { nodes, connections } = networkRef.current;

      nodes.forEach((node, index) => {
        const dx = mouseRef.current.x - node.x;
        const dy = mouseRef.current.y - node.y;
        node.mouseDistance = Math.sqrt(dx * dx + dy * dy);

        const mouseInfluence = Math.max(0, (150 - node.mouseDistance) / 150);
        const targetActivation =
          node.baseActivation +
          mouseInfluence * 0.8 +
          Math.sin(time * 0.02 + node.pulsePhase) * 0.2;

        node.activation += (targetActivation - node.activation) * 0.1;
        node.radius =
          node.baseRadius +
          mouseInfluence * 3 +
          Math.sin(time * 0.03 + node.pulsePhase) * 0.5;

        node.x += node.vx + (Math.random() - 0.5) * 0.1;
        node.y += node.vy + (Math.random() - 0.5) * 0.1;

        if (mouseInfluence > 0) {
          const attractionStrength = mouseInfluence * 0.3;
          node.vx += dx * attractionStrength * 0.001;
          node.vy += dy * attractionStrength * 0.001;
        }

        node.vx *= 0.98;
        node.vy *= 0.98;

        if (node.x < 0) node.x = dimensions.width;
        if (node.x > dimensions.width) node.x = 0;
        if (node.y < 0) node.y = dimensions.height;
        if (node.y > dimensions.height) node.y = 0;

        if (mouseInfluence > 0.7 && !node.isActive) {
          node.isActive = true;
          node.lastActivation = time;

          connections.forEach((conn) => {
            if (conn.nodeA === index || conn.nodeB === index) {
              if (!conn.hasSignal && Math.random() > 0.7) {
                conn.hasSignal = true;
                conn.signalPosition = conn.nodeA === index ? 0 : 1;
                conn.signalDirection = conn.nodeA === index ? 1 : -1;
                conn.lastSignalTime = time;
              }
            }
          });
        }

        if (node.isActive && time - node.lastActivation > 60) {
          node.isActive = false;
        }
      });

      connections.forEach((conn) => {
        const nodeA = nodes[conn.nodeA];
        const nodeB = nodes[conn.nodeB];
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;

        conn.distance = Math.sqrt(dx * dx + dy * dy);
        conn.strength = Math.max(0, (conn.maxDistance - conn.distance) / conn.maxDistance);

        if (conn.hasSignal) {
          conn.signalPosition += conn.signalDirection * 0.02;
          if (conn.signalPosition <= 0 || conn.signalPosition >= 1) {
            conn.hasSignal = false;
            const targetNode = conn.signalDirection > 0 ? nodeB : nodeA;
            targetNode.isActive = true;
            targetNode.lastActivation = time;
          }
        }
      });

      connections.forEach((conn) => {
        if (conn.strength > 0.1) {
          const nodeA = nodes[conn.nodeA];
          const nodeB = nodes[conn.nodeB];
          const opacity = conn.strength * conn.weight * 0.4;
          const mouseBoost = Math.min(nodeA.mouseDistance, nodeB.mouseDistance) < 100 ? 0.3 : 0;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(100, 150, 255, ${opacity + mouseBoost})`;
          ctx.lineWidth = 0.5 + conn.strength * 1.5 + mouseBoost;
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.stroke();

          if (conn.hasSignal) {
            const signalX = nodeA.x + (nodeB.x - nodeA.x) * conn.signalPosition;
            const signalY = nodeA.y + (nodeB.y - nodeA.y) * conn.signalPosition;

            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
            ctx.arc(signalX, signalY, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
            ctx.arc(signalX, signalY, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      nodes.forEach((node) => {
        const layerColors = [
          [100, 150, 255],
          [150, 100, 255],
          [255, 100, 150],
          [100, 255, 150],
        ];

        const [r, g, b] = layerColors[node.layer];
        const alpha = 0.3 + node.activation * 0.7;
        const glowAlpha = node.isActive ? 0.8 : alpha * 0.5;

        if (node.mouseDistance < 100 || node.isActive) {
          const gradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, node.radius * 3
          );
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowAlpha})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

          ctx.beginPath();
          ctx.fillStyle = gradient;
          ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        if (node.isActive) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1;
          ctx.arc(node.x, node.y, node.radius + 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      if (mouseRef.current.x && mouseRef.current.y) {
        const gradient = ctx.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, 100
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.02)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 100, 0, Math.PI * 2);
        ctx.fill();
      }

      time += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions]);

  return (
    <div className="relative inset-0 -z-10 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      <div className="absolute top-4 left-4 text-cyan-400 font-mono text-xs opacity-40">
        <div>NEURAL NETWORK</div>
        <div className="mt-1">NODES: 80</div>
        <div>LAYERS: 4</div>
        <div>STATUS: ACTIVE</div>
      </div>
    </div>
  );
};

export default NeuralNetwork;
