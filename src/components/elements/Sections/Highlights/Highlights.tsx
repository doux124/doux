import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import Standard from '../../../standards/backgrounds/Standard';
import Experience from './Experience';
import { useReveal } from '../../../../lib/useReveal';
import type { Section } from '../../../../content/siteContent';

type HighlightsSection = Extract<Section, { kind: 'highlights' }>;

// Written out in full so Tailwind's scanner sees each class literally — a
// template-built `md:col-span-${n}` would never be generated.
const SPAN_CLASS: Record<number, string> = {
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  12: 'md:col-span-12',
};

const Highlights: React.FC<{ section: HighlightsSection }> = ({ section }) => {
  const scopeRef = useRef<HTMLDivElement>(null);
  useReveal(scopeRef, '[data-reveal]', { y: 36, start: 'top 85%' });

  return (
    <div
      ref={scopeRef}
      className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black"
    >
      {/* Background: optional animated canvas, plus a lightweight CSS grid overlay */}
      <div className="absolute inset-0 z-0">
        {section.background === 'standard' && <Standard />}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(244,114,182,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 py-20 px-6">
        <div className="text-center mb-12">
          <h1
            data-reveal
            className="pb-3 text-5xl font-bold bg-gradient-to-r from-orange-300 via-pink-300 to-purple-300 bg-clip-text text-transparent"
          >
            {section.title}
          </h1>
        </div>

        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-12">
          {section.groups.map((group) => (
            <div
              key={group.heading}
              data-reveal
              className={`rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 shadow-xl shadow-black/20 ${
                SPAN_CLASS[group.span ?? (group.wide ? 12 : 6)]
              }`}
            >
              <h2 className="text-2xl font-bold text-white mb-5">{group.heading}</h2>

              {group.experience && <Experience orgs={group.experience} />}

              <ul className={group.wide ? 'space-y-4 md:columns-2 md:gap-x-8' : 'space-y-4'}>
                {(group.entries ?? []).map((entry, idx) => (
                  <li
                    key={idx}
                    className={`border-l-2 border-pink-500/40 pl-4 ${
                      group.wide ? 'break-inside-avoid mb-4' : ''
                    }`}
                  >
                    {entry.href ? (
                      <a
                        href={entry.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link inline-flex items-baseline gap-1.5 font-semibold text-white hover:text-pink-200 transition-colors underline underline-offset-4 decoration-pink-400/40 hover:decoration-pink-300"
                      >
                        {entry.title}
                        <ExternalLink
                          className="h-3.5 w-3.5 shrink-0 self-center opacity-60 group-hover/link:opacity-100 transition-opacity"
                          aria-hidden="true"
                        />
                      </a>
                    ) : (
                      <p className="font-semibold text-white">{entry.title}</p>
                    )}

                    {/* For a linked entry the meta is the address, so make it clickable too */}
                    {entry.meta &&
                      (entry.href ? (
                        <a
                          href={entry.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-pink-300/80 hover:text-pink-200 transition-colors mt-0.5 w-fit"
                        >
                          {entry.meta}
                        </a>
                      ) : (
                        <p className="text-sm text-pink-300/80 mt-0.5">{entry.meta}</p>
                      ))}

                    {entry.doi && (
                      <a
                        href={`https://doi.org/${entry.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-1.5 text-sm text-cyan-300/90 hover:text-cyan-200 transition-colors underline underline-offset-4 decoration-cyan-400/40 break-all"
                      >
                        doi.org/{entry.doi}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    )}

                    {entry.note && <p className="text-sm text-gray-400 mt-1">{entry.note}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Highlights;
