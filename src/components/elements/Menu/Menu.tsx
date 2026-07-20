import { useEffect, useMemo, useRef, useState } from 'react';
import { Github, Linkedin, Mail, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { playSound } from '../../../lib/sound';
import { sections } from '../../../content/siteContent';
import './action.css';

interface MenuProps {
  isMenuOpen: boolean;
  onMenuClose?: () => void;
}

interface BookProps {
  title: string;
  color: string;
  glowColor: string;
  onClick: () => void;
  delay: number;
  thickness?: number;
}

const Book: React.FC<BookProps> = ({ title, color, glowColor, onClick, delay, thickness = 60 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const bookRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (bookRef.current) {
      gsap.fromTo(
        bookRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, delay, ease: 'power3.out' }
      );
    }
  }, [delay]);

  return (
    <button
      type="button"
      ref={bookRef}
      aria-label={title}
      className="book-btn relative block cursor-pointer select-none border-0 bg-transparent p-0 text-left"
      style={{
        height: `${thickness}px`,
        width: '100%',
        maxWidth: '280px',
        opacity: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Book body */}
      <div
        className="absolute inset-0 rounded-sm transition-all duration-300"
        style={{
          background: `linear-gradient(180deg, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`,
          boxShadow: isHovered
            ? `0 0 30px ${glowColor}80, 0 0 60px ${glowColor}40, inset 0 2px 4px rgba(255,255,255,0.3)`
            : `0 4px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)`,
          transform: isHovered ? 'translateX(20px) scale(1.02)' : 'translateX(0)',
          borderLeft: `4px solid ${color}66`,
          borderRight: `4px solid ${color}cc`,
        }}
      >
        {/* Spine detail lines */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 opacity-30"
          style={{ background: 'linear-gradient(180deg, transparent, white, transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1 opacity-20"
          style={{ background: 'linear-gradient(180deg, transparent, black, transparent)' }}
        />
        
        {/* Holographic scan line effect */}
        {isHovered && (
          <div
            className="absolute inset-0 overflow-hidden rounded-sm"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
              style={{
                animation: 'scanLine 1s ease-in-out infinite',
              }}
            />
          </div>
        )}

        {/* Book title */}
        <div className="absolute inset-0 flex items-center justify-center px-4 select-none pointer-events-none">
          <span
            className="font-bold text-sm md:text-base tracking-wider transition-all duration-300 text-center"
            style={{
              color: isHovered ? '#ffffff' : 'rgba(255,255,255,0.9)',
              textShadow: isHovered ? `0 0 10px ${glowColor}, 0 0 20px ${glowColor}` : 'none',
            }}
          >
            {title}
          </span>
        </div>

        {/* Page edges (right side) */}
        <div
          className="absolute right-0 top-1 bottom-1 w-2 rounded-r-sm"
          style={{
            background: 'repeating-linear-gradient(180deg, #f0f0f0 0px, #f0f0f0 1px, #e0e0e0 1px, #e0e0e0 2px)',
            opacity: 0.8,
          }}
        />
      </div>
    </button>
  );
};

const Menu: React.FC<MenuProps> = ({ isMenuOpen, onMenuClose }) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Generated once so particles don't reshuffle on every render.
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 2,
      })),
    []
  );

  const scrollToSection = (sectionId: string): void => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      // Make the section shareable/bookmarkable without triggering the router.
      window.history.replaceState(null, '', `#${sectionId}`);
      if (onMenuClose) {
        setTimeout(() => onMenuClose(), 500);
      }
    }
  };

  useEffect(() => {
    if (menuRef.current) {
      if (isMenuOpen) {
        gsap.fromTo(
          menuRef.current,
          { x: '100%', opacity: 0 },
          { x: '0%', opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
      } else {
        gsap.to(menuRef.current, { x: '100%', opacity: 0, duration: 0.5, ease: 'power3.in' });
      }
    }
  }, [isMenuOpen]);

  const clickSfx = () => playSound('audio/sound_effects/click.mp3');

  // One book per page section (in config order), then the standalone Games entry.
  const books = [
    ...sections.map((section) => ({
      title: section.nav.label,
      color: section.nav.color,
      glowColor: section.nav.glow,
      onClick: () => { clickSfx(); scrollToSection(section.id); },
    })),
    {
      title: 'GAMES',
      color: '#06b6d4',
      glowColor: '#22d3ee',
      onClick: () => { clickSfx(); navigate('/Tools'); },
    },
  ];

  return (
    <div className="page__style">
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-4px); }
          100% { transform: translateY(59px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <div
        id="main-menu"
        className="menu"
        ref={menuRef}
        role="dialog"
        aria-label="Site navigation"
        inert={!isMenuOpen}
        style={{ transform: 'translateX(100%)', opacity: 0 }}
      >
        {/* Dark sci-fi background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 30%, #16213e 70%, #0f0f1a 100%)',
            zIndex: 0,
          }}
        />

        {/* Animated grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            zIndex: 1,
          }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden z-1">
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                background: `radial-gradient(circle, ${['#ec4899', '#8b5cf6', '#06b6d4'][i % 3]} 0%, transparent 70%)`,
                animation: `float ${p.duration}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* Ambient glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            animation: 'glowPulse 4s ease-in-out infinite',
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-full py-8 px-4">
          {/* Title */}
          <h2
            className="font-bold text-2xl md:text-3xl mb-8 tracking-widest select-none"
            style={{
              color: '#e0e0ff',
              textShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)',
            }}
          >
            MENU
          </h2>

          {/* Bookshelf */}
          <div className="relative w-full max-w-[220px] md:max-w-[300px]">
            {/* Top shelf line */}
            <div
              className="absolute -top-4 left-0 right-0 h-1 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, #8b5cf6, #ec4899, #06b6d4, transparent)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
              }}
            />

            {/* Books stack */}
            <div className="flex flex-col items-center gap-3 py-6">
              {books.map((book, index) => (
                <Book
                  key={index}
                  {...book}
                  delay={0.1 + index * 0.15}
                  thickness={55}
                />
              ))}
            </div>

            {/* Bottom shelf line */}
            <div
              className="absolute -bottom-4 left-0 right-0 h-1 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, #06b6d4, #ec4899, #8b5cf6, transparent)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
              }}
            />
          </div>

          {/* Social buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {[
              { icon: Github, label: 'GitHub', url: 'https://github.com/doux124', color: '#6e5494' },
              { icon: Linkedin, label: 'LinkedIn', url: 'https://www.linkedin.com/in/jordan-low-jun-yi-69a150279/', color: '#0077b5' },
              { icon: Mail, label: 'Email', url: 'mailto:onezeroten124@gmail.com?subject=Contact%20from%20Website&body=Hi%20Jordan,', color: '#ea4335' },
              { icon: GraduationCap, label: 'Google Scholar', url: 'https://scholar.google.com/citations?hl=en&user=O6M8clAAAAAJ', color: '#4285f4' },
            ].map(({ icon: Icon, label, url, color }, index) => (
              <button
                key={index}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => {
                  playSound('audio/sound_effects/infographic-button.mp3');
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="social-icon-btn relative p-1 rounded-full transition-all duration-300 cursor-pointer hover:scale-125"
                style={{
                  background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
                  boxShadow: `0 0 15px ${color}60`,
                }}
              >
                <Icon
                  size={20}
                  aria-hidden="true"
                  className="transition-all duration-300"
                  style={{
                    color: '#ffffff',
                    filter: `drop-shadow(0 0 6px ${color})`,
                  }}
                />
              </button>
            ))}
          </div>

          {/* Footer */}
          <p
            className="mt-8 text-sm tracking-wider select-none"
            style={{
              color: 'rgba(224, 224, 255, 0.7)',
            }}
          >
            Coded by Jordan Low Jun Yi
          </p>
        </div>
      </div>
    </div>
  );
};

export default Menu;