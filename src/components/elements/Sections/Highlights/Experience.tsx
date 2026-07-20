import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileText } from 'lucide-react';
import { prefersReducedMotion } from '../../../../lib/motion';
import TestimonialPanel from './TestimonialPanel';
import type { Testimonial } from './TestimonialPanel';
import type { ExperienceOrg, ExperienceRole } from '../../../../content/siteContent';

gsap.registerPlugin(ScrollTrigger);

function Role({
  role,
  onOpenTestimonial,
}: {
  role: ExperienceRole;
  onOpenTestimonial: (t: Testimonial) => void;
}) {
  return (
    <li data-exp-role className="relative pl-7 pb-5 last:pb-0">
      {/* Marker sits on the connector line running through the roles */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-[6px] h-3.5 w-3.5 rounded-full border-2 border-amber-400/70 bg-gray-900 shadow-[0_0_10px_rgba(245,158,11,0.35)]"
      />

      <p className="font-semibold text-white">
        {role.href ? (
          <a
            href={role.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-200 transition-colors underline underline-offset-4 decoration-white/25"
          >
            {role.title}
          </a>
        ) : (
          role.title
        )}
      </p>

      {/* One subheader line: dates and where, nothing more */}
      {(role.dates || role.location) && (
        <p className="text-sm mt-0.5">
          {role.dates && <span className="text-amber-300/80">{role.dates}</span>}
          {role.dates && role.location && <span className="text-gray-600"> · </span>}
          {role.location && <span className="text-gray-400">{role.location}</span>}
        </p>
      )}

      {role.testimonial && (
        <button
          type="button"
          onClick={() => onOpenTestimonial(role.testimonial!)}
          className="inline-flex items-center gap-2 mt-3 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-400/20 hover:border-amber-400/60 transition-colors"
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
          {role.testimonial.label}
        </button>
      )}
    </li>
  );
}

const Experience: React.FC<{ orgs: ExperienceOrg[] }> = ({ orgs }) => {
  const rootRef = useRef<HTMLOListElement>(null);
  const [openTestimonial, setOpenTestimonial] = useState<Testimonial | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    // Reduced motion: leave the markup in its natural, fully visible state.
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-exp-org]').forEach((org) => {
        const line = org.querySelector<HTMLElement>('[data-exp-line]');
        const roles = org.querySelectorAll<HTMLElement>('[data-exp-role]');

        gsap.set(org, { opacity: 0, y: 24 });
        gsap.set(roles, { opacity: 0, x: -8 });
        if (line) gsap.set(line, { scaleY: 0, transformOrigin: 'top center' });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: org,
            start: 'top 88%',
            // play on the way down; on the way back up run the same timeline
            // backwards so it fades out instead of snapping off, then it plays
            // forward again on the next pass
            toggleActions: 'play none none reverse',
          },
        });
        tl.to(org, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
        if (line) tl.to(line, { scaleY: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3');
        tl.to(roles, { opacity: 1, x: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out' }, '-=0.35');
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <ol ref={rootRef} className="space-y-8">
        {orgs.map((item) => {
          const connected = item.roles.length > 1;
          return (
            <li
              data-exp-org
              key={item.org}
              className="lg:grid lg:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] lg:gap-5"
            >
              {/* Sidebar label. Same type size as the roles and as the neighbouring
                  Leadership card, so the whole row reads as one system. */}
              <div className="mb-2 lg:mb-0">
                <h3 className="font-bold leading-snug text-white">{item.org}</h3>
                {item.meta && <p className="text-sm text-gray-400 mt-0.5">{item.meta}</p>}
              </div>

              <div className="relative">
                {/* The line that ties multiple roles at one organisation together */}
                {connected && (
                  <span
                    data-exp-line
                    aria-hidden="true"
                    className="absolute left-[6px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-amber-400/50 via-amber-400/25 to-transparent"
                  />
                )}
                <ol>
                  {item.roles.map((role, i) => (
                    <Role
                      key={`${role.title}-${i}`}
                      role={role}
                      onOpenTestimonial={setOpenTestimonial}
                    />
                  ))}
                </ol>
              </div>
            </li>
          );
        })}
      </ol>

      <TestimonialPanel item={openTestimonial} onClose={() => setOpenTestimonial(null)} />
    </>
  );
};

export default Experience;
