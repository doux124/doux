import { useRef } from 'react';
import Standard from '../standards/backgrounds/Standard';
import { useReveal } from '../../lib/useReveal';
import { hero, sections } from '../../content/siteContent';

const Hero: React.FC = () => {
  // Scroll target for the down-arrow = the first section on the page.
  const firstSectionId = sections[0]?.id ?? 'main-content';

  // The hero is above the fold, so these fire straight away on load.
  const scopeRef = useRef<HTMLDivElement>(null);
  useReveal(scopeRef, '[data-reveal]', { y: 28, stagger: 0.12, start: 'top 95%' });

  return (
    <div
      ref={scopeRef}
      className="w-full min-h-dvh relative flex items-center justify-center py-24"
    >
      <Standard />

      <div className="relative z-10 max-w-5xl w-full mx-auto px-6 pointer-events-none">
        <div className="text-center text-white backdrop-blur-sm bg-black/20 rounded-2xl p-6 md:p-12 border border-white/10 pointer-events-none">
          {/* Name Section */}
          <h1
            data-reveal
            className="text-3xl md:text-6xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400"
          >
            {hero.name}
          </h1>

          {/* Bio Section */}
          <div data-reveal className="mb-4 md:mb-8">
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed">{hero.tagline}</p>
            {/* text-balance: the line now wraps, so even out the two lines
                instead of leaving "Minor in Design" orphaned on its own */}
            <p className="text-base md:text-lg text-gray-300 mt-2 text-balance">{hero.majors}</p>
          </div>

          {/* Contact Section */}
          <div data-reveal className="space-y-6">
            <div className="grid gap-2 md:gap-4 text-base md:text-xl">
              {hero.contacts.map((contact) => (
                <div
                  key={contact.label}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2"
                >
                  <span className="text-gray-300 font-medium">{contact.label}:</span>
                  <a
                    href={contact.href}
                    {...(contact.external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    className="pointer-events-auto text-orange-300 hover:text-orange-200 transition-colors underline underline-offset-4"
                  >
                    {contact.display}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Down Arrow */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 mb-10 pointer-events-none">
        <button
          type="button"
          aria-label="Scroll to projects"
          onClick={() =>
            document.getElementById(firstSectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          className="flex flex-col items-center border-0 bg-transparent text-white/70 hover:text-white transition-colors cursor-pointer pointer-events-auto"
        >
          <span className="animate-bounce">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};

export default Hero;
