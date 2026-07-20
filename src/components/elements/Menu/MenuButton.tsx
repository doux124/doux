import { useState } from 'react';
import Menu from './Menu';
import { playSound } from '../../../lib/sound';
import './action.css';

const MenuButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const toggleMenu = (): void => {
    playSound('audio/sound_effects/infographic-button.mp3');
    setIsMenuOpen((open) => !open);
  };

  const closeMenu = (): void => setIsMenuOpen(false);

  return (
    <div className="social-container bg-black dark:bg-white">
      <button
        type="button"
        className="social-link dark:text-white dark:bg-black"
        onClick={toggleMenu}
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMenuOpen}
        aria-controls="main-menu"
      >
        <svg
          className={`hamburger-icon ${isMenuOpen ? 'open' : ''}`}
          viewBox="0 0 100 100"
          width="40"
          height="40"
          aria-hidden="true"
        >
          <rect className="line top" width="80" height="10" x="10" y="30" rx="6" />
          <rect className="line bottom" width="80" height="10" x="10" y="60" rx="6" />
        </svg>
      </button>
      <Menu isMenuOpen={isMenuOpen} onMenuClose={closeMenu} />
    </div>
  );
};

export default MenuButton;
