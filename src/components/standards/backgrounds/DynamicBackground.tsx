import { useEffect, useState, useRef, useMemo } from "react";

interface DynamicBackgroundProps {
  image: string;
  count?: number;
  gravity?: boolean;
  minSize?: number;
  maxSize?: number;
  minRotation?: number;
  maxRotation?: number;
  baseSpeed?: number;
  speedVariance?: number;
  rotationSpeed?: number;
}

interface GravityElement {
  startX: number;
  rotation: number;
  rotationAmount: number;
  speed: number;
  size: number;
}

interface FloatingElement {
  id: number;
  initialX: number;
  initialY: number;
  size: number;
  initialRotation: number;
  // CSS animation parameters
  driftX: number;
  driftY: number;
  driftDuration: number;
  rotateDuration: number;
  rotateAmount: number;
}

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  image,
  count = 20,
  gravity = false,
  minSize = 8,
  maxSize = 12,
  minRotation = 0,
  maxRotation = 360,
}) => {
  const [gravityElements, setGravityElements] = useState<GravityElement[]>([]);
  const styleSheetRef = useRef<HTMLStyleElement | null>(null);

  // Generate floating elements with CSS-based animation parameters
  const floatingElements = useMemo<FloatingElement[]>(() => {
    if (gravity) return [];
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      initialRotation: Math.random() * 360,
      // Random drift parameters for CSS animation
      driftX: (Math.random() - 0.5) * 30, // How far to drift in X
      driftY: (Math.random() - 0.5) * 30, // How far to drift in Y
      driftDuration: 8 + Math.random() * 12, // 8-20 seconds per cycle
      rotateDuration: 10 + Math.random() * 20, // 10-30 seconds per rotation
      rotateAmount: (Math.random() - 0.5) * 720, // -360 to 360 degrees
    }));
  }, [count, gravity, minSize, maxSize]);

  useEffect(() => {
    if (gravity) {
      const newElements: GravityElement[] = Array.from({ length: count }, () => {
        const size = minSize + Math.random() * (maxSize - minSize);
        return {
          startX: Math.random() * 100,
          rotation: Math.random() * (maxRotation - minRotation),
          rotationAmount: minRotation + Math.random() * (maxRotation - minRotation),
          speed: 2 + Math.random() * 2,
          size,
        };
      });

      const styleSheet = document.createElement("style");
      const keyframes = newElements
        .map(
          (el, index) => `
          @keyframes fall${index} {
            0% {
              transform: translate(${el.startX}vw, -25vh) rotate(${el.rotation}deg);
            }
            100% {
              transform: translate(${el.startX}vw, 115vh) rotate(${el.rotation + el.rotationAmount}deg);
            }
          }
        `
        )
        .join("\n");

      styleSheet.textContent = keyframes;
      document.head.appendChild(styleSheet);
      styleSheetRef.current = styleSheet;

      setGravityElements(newElements);

      return () => {
        if (styleSheetRef.current) {
          document.head.removeChild(styleSheetRef.current);
        }
      };
    } else {
      // Create CSS keyframes for floating elements
      const styleSheet = document.createElement("style");
      
      const keyframes = floatingElements
        .map(
          (el) => `
          @keyframes drift${el.id} {
            0%, 100% {
              transform: translate(0, 0) rotate(${el.initialRotation}deg);
            }
            25% {
              transform: translate(${el.driftX * 0.5}vw, ${el.driftY}vh) rotate(${el.initialRotation + el.rotateAmount * 0.25}deg);
            }
            50% {
              transform: translate(${el.driftX}vw, ${el.driftY * 0.3}vh) rotate(${el.initialRotation + el.rotateAmount * 0.5}deg);
            }
            75% {
              transform: translate(${el.driftX * 0.3}vw, ${-el.driftY * 0.5}vh) rotate(${el.initialRotation + el.rotateAmount * 0.75}deg);
            }
          }
        `
        )
        .join("\n");

      styleSheet.textContent = keyframes;
      document.head.appendChild(styleSheet);
      styleSheetRef.current = styleSheet;

      return () => {
        if (styleSheetRef.current) {
          document.head.removeChild(styleSheetRef.current);
        }
      };
    }
  }, [count, gravity, minSize, maxSize, minRotation, maxRotation, floatingElements]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {gravity
        ? gravityElements.map((el, index) => (
            <img
              key={index}
              src={image}
              alt=""
              style={{
                position: "absolute",
                width: `${el.size}vmin`,
                height: `${el.size}vmin`,
                animation: `fall${index} ${el.speed}s linear infinite`,
                willChange: "transform",
              }}
            />
          ))
        : floatingElements.map((el) => (
            <img
              key={el.id}
              src={image}
              alt=""
              style={{
                position: "absolute",
                left: `${el.initialX}%`,
                top: `${el.initialY}%`,
                width: `${el.size}vmin`,
                height: `${el.size}vmin`,
                animation: `drift${el.id} ${el.driftDuration}s ease-in-out infinite`,
                willChange: "transform",
              }}
            />
          ))}
    </div>
  );
};

export default DynamicBackground;