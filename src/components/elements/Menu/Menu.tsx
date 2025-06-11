import { useEffect, useRef } from 'react';
import { Github, Linkedin, Mail, GraduationCap } from 'lucide-react';
import { gsap } from 'gsap';
import './action.css';
import '../../standards/buttons.css';

import Bubbles from "../../standards/backgrounds/Bubbles"

interface MenuProps {
  isMenuOpen: boolean;
  onMenuClose?: () => void; // Optional callback to close menu after scrolling
}

const Menu: React.FC<MenuProps> = ({ isMenuOpen, onMenuClose }) => { 
  const menuRef = useRef<HTMLDivElement>(null);
  const clickSound = useRef<HTMLAudioElement>(
    new Audio("/jordan/audio/sound_effects/infographic-button.mp3")
  );
  const coolSound = useRef<HTMLAudioElement>(
    new Audio("/jordan/audio/sound_effects/click.mp3")
  );

  const playSound = (): void => {
    clickSound.current.currentTime = 0;
    clickSound.current.play();
  };

  const playCoolSound = (): void => {
    coolSound.current.currentTime = 0;
    coolSound.current.play();
  };

  // Function to scroll to a specific section
  const scrollToSection = (sectionId: string): void => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start' 
      });
      // Close menu after scrolling (optional)
      if (onMenuClose) {
        setTimeout(() => onMenuClose(), 500); // Delay to allow scroll to start
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

  return (
    <div className="page__style">
      <div className='menu' ref={menuRef} style={{ transform: 'translateX(100%)', opacity: 0 }}>
          <Bubbles />
          <h2 className="flex items-center justify-center font-semibold pt-5 md:pb-5 text-black text-3xl transition-colors duration-300 z-50">
              Menu Page
          </h2>
          <div className="flex flex-col items-center justify-center space-y-4">
              <button 
                className="button-57 w-[200px] md:w-[300px] transition-colors duration-300" 
                data-content="Click to Scroll" 
                onClick={() => { playCoolSound(); scrollToSection('organoids-section'); }}
              >
                Organoids
              </button>
              <button 
                className="button-57 w-[200px] md:w-[300px] transition-colors duration-300" 
                data-content="Click to Scroll" 
                onClick={() => { playCoolSound(); scrollToSection('ai-section'); }}
              >
                AI
              </button>
              <button
                className="button-57 w-[200px] md:w-[300px] transition-colors duration-300" 
                data-content="Click to Scroll" 
                onClick={() => { playCoolSound(); scrollToSection('roverx-section'); }}
              >
                RoverX
              </button>
              <button 
                className="button-57 w-[200px] md:w-[300px] transition-colors duration-300" 
                data-content="Click to Scroll" 
                onClick={() => { playCoolSound(); scrollToSection('annuloplasty-section'); }}
              >
                Annuloplasty
              </button>
              <button 
                className="button-57 w-[200px] md:w-[300px] transition-colors duration-300" 
                data-content="Click to Scroll" 
                onClick={() => { playCoolSound(); scrollToSection('graphene-section'); }}
              >
                Graphene
              </button>
          </div>

          <div className='flex items-center justify-center space-x-4 z-80'>
              <div
                  className="social-link"
                  onClick={() => { 
                    playSound(); 
                    window.open('https://github.com/doux124', '_blank'); 
                  }}
              >
                  <Github size={20} />
              </div>
              <div
                  className="social-link"
                  onClick={() => { 
                    playSound(); 
                    window.open('https://www.linkedin.com/in/jordan-low-jun-yi-69a150279/', '_blank'); 
                  }}
              >
                  <Linkedin size={20} />
              </div>
              <div
                  className="social-link"
                  onClick={() => { 
                    playSound(); 
                    window.open('mailto:onezeroten124@gmail.com?subject=Contact%20from%20Website&body=Hi%20Jordan,', '_blank'); 
                  }}
              >
                  <Mail size={20} />
              </div>
              <div
                  className="social-link"
                  onClick={() => { 
                    playSound(); 
                    window.open('https://scholar.google.com/citations?hl=en&user=O6M8clAAAAAJ', '_blank'); 
                  }}
              >
                  <GraduationCap size={20} />
              </div>
          </div>
          <p className='flex items-center justify-center text-black transition-colors duration-300 z-80'>
            Coded by Jordan Low Jun Yi
          </p>
      </div>
    </div>
  );
};

export default Menu;