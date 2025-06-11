import { useState, useRef } from 'react';
import Menu from './Menu';
import { gsap } from 'gsap';
import './action.css';

const MenuButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const clickSound = useRef<HTMLAudioElement>(
    new Audio("/jordan/audio/sound_effects/infographic-button.mp3")
  );

  const toggleMenu = (): void => {
    clickSound.current.currentTime = 0;
    clickSound.current.play();

    setIsMenuOpen(!isMenuOpen);

    if (menuRef.current) {
      if (!isMenuOpen) {
        gsap.fromTo(
          menuRef.current,
          { x: '100%', opacity: 0 },
          { x: '0%', opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
      } else {
        gsap.to(menuRef.current, { x: '100%', opacity: 0, duration: 0.5, ease: 'power3.in' });
      }
    }
  };

  return (
    <div className="social-container bg-black dark:bg-white">
      <div className="social-link dark:text-white dark:bg-black" onClick={toggleMenu}>
        <svg
          className={`hamburger-icon ${isMenuOpen ? 'open' : ''}`}
          viewBox="0 0 100 100"
          width="40"
          height="40"
        >
          <rect className="line top" width="80" height="10" x="10" y="30" rx="6" />
          <rect className="line bottom" width="80" height="10" x="10" y="60" rx="6" />
        </svg>
      </div>
      <Menu
        isMenuOpen={isMenuOpen}
       />
    </div>
  );
};

export default MenuButton;