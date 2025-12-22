/**
 * Usage Guide for NeuralUI Components
 * 
 * 1. GlowCard
 *    - Use as a reusable card container with glowing borders.
 *    - Props:
 *      - glowColor (string): color of the glow effect (e.g., "cyan", "blue")
 *      - className (string): additional CSS classes
 *    - Wrap any content inside <GlowCard>...</GlowCard>
 * 
 * 2. NeuralButton
 *    - Gradient button with icon support and variants.
 *    - Props:
 *      - active (boolean): highlight the button if true
 *      - onClick (function): click handler
 *      - icon (React component): icon to display on button
 *      - variant (string): "primary" | "secondary" | "success" | "danger"
 *    - Example:
 *      <NeuralButton active icon={SomeIcon} variant="primary" onClick={handleClick}>
 *        Click Me
 *      </NeuralButton>
 * 
 * 3. StatusIndicator
 *    - Shows a small pulsing colored dot with a label and status text.
 *    - Props:
 *      - status (string): status text
 *      - label (string): label text
 *      - color (string): color for the dot and text (default: "green")
 *    - Example:
 *      <StatusIndicator status="ONLINE" label="Network" color="green" />
 */

import type { ReactNode } from 'react';
import { Code } from 'lucide-react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'blue' | 'purple' | 'green' | 'yellow' | 'red';
}
export const GlowCard = ({ children, className = "", glowColor = "cyan" }: GlowCardProps) => (
  <div className={`
    relative bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-lg
    before:absolute before:inset-0 before:rounded-lg before:p-[1px]
    before:bg-gradient-to-r before:from-${glowColor}-500/20 before:via-transparent before:to-${glowColor}-500/20
    before:-z-10 hover:before:from-${glowColor}-400/30 hover:before:to-${glowColor}-400/30
    transition-all duration-300 hover:shadow-lg hover:shadow-${glowColor}-500/10
    ${className}
  `}>
    {children}
  </div>
);

interface NeuralButtonProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

export const NeuralButton = ({
  children,
  active = false,
  onClick,
  icon: Icon,
  variant = "primary"
}: NeuralButtonProps) => {
  const variants = {
    primary: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300 hover:text-cyan-100",
    secondary: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 hover:text-purple-100",
    success: "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300 hover:text-green-100",
    danger: "from-red-500/20 to-orange-500/20 border-red-500/30 text-red-300 hover:text-red-100"
  };

  const RenderIcon = Icon ?? Code;

  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300
        bg-gradient-to-r border backdrop-blur-sm
        ${active ? 'shadow-lg shadow-current/20 scale-105' : ''}
        ${variants[variant]}
        hover:scale-105 hover:shadow-lg hover:shadow-current/20
        active:scale-95
        group
      `}
    >
      <div className="flex items-center gap-2">
        <RenderIcon size={16} className="transition-transform group-hover:rotate-12" />
        {children}
      </div>
      {active && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-current/10 to-transparent animate-pulse" />
      )}
    </button>
  );
};


interface StatusIndicatorProps {
  status: string;
  label: string;
  color?: 'green' | 'cyan' | 'yellow' | 'red' | 'purple' | 'blue';
}
export const StatusIndicator = ({ status, label, color = "green" }: StatusIndicatorProps) => (
  <div className="flex items-center gap-2 text-xs font-mono">
    <div className={`w-2 h-2 rounded-full bg-${color}-400 animate-pulse shadow-lg shadow-${color}-400/50`} />
    <span className="text-slate-300">{label}:</span>
    <span className={`text-${color}-300 font-semibold`}>{status}</span>
  </div>
);