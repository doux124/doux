import { useRef } from 'react';
import DNA from '../../standards/backgrounds/DNA';
import { useReveal } from '../../../lib/useReveal';
import Semiconductor from '../../standards/backgrounds/Semiconductor';
import Standard from '../../standards/backgrounds/Standard';
import { ManhattanHero } from './BME/ManhattanHero';
import type { BackgroundKey, ProjectCard, Section } from '../../../content/siteContent';

type ProjectsSection = Extract<Section, { kind: 'projects' }>;

function Background({ kind }: { kind: BackgroundKey }) {
  switch (kind) {
    case 'dna':
      return <DNA />;
    case 'semiconductor':
      return <Semiconductor />;
    case 'standard':
      return <Standard />;
    default:
      return null;
  }
}

function ProjectCardView({
  card,
  index,
  featuresLabel,
}: {
  card: ProjectCard;
  index: number;
  featuresLabel: string;
}) {
  return (
    <div
      data-reveal
      className="rounded-3xl overflow-hidden border border-pink-500/30 shadow-2xl shadow-pink-500/10 bg-gradient-to-br from-pink-900/40 to-purple-900/30 backdrop-blur-md"
    >
      {/* min-h (not a fixed h) lets tall cards grow instead of clipping their text */}
      <div
        className={`flex flex-col lg:flex-row lg:min-h-[400px] ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
      >
        {/* Visual / image — stretches to match the text column on large screens */}
        <div className="lg:w-1/2 h-64 sm:h-80 lg:h-auto lg:min-h-[400px] relative overflow-hidden">
          {card.visual === 'manhattan' ? (
            <ManhattanHero />
          ) : (
            <>
              {/* Gradient placeholder — base layer, shown when no image or on error */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-40`} />
              {card.image && (
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 w-full h-full ${
                    card.imagePlate ? 'object-contain' : 'object-cover'
                  }`}
                  style={card.imagePlate ? { backgroundColor: card.imagePlate } : undefined}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Details */}
        <div className="lg:w-1/2 p-8 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">{card.title}</h2>
            <p className="text-gray-400 text-lg">{card.subtitle}</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-pink-100 mb-4">{featuresLabel}</h3>
            <ul className="space-y-3 text-gray-300 text-base leading-relaxed">
              {card.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-pink-400 mt-1">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {card.link && (
              <a
                href={card.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-5 text-pink-300 hover:text-pink-200 transition-colors underline underline-offset-4"
              >
                {card.link.label} <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ProjectSection: React.FC<{ section: ProjectsSection }> = ({ section }) => {
  const scopeRef = useRef<HTMLDivElement>(null);
  useReveal(scopeRef, '[data-reveal]', { y: 40, start: 'top 82%' });

  return (
    <div
      ref={scopeRef}
      className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black"
    >
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <Background kind={section.background} />
      </div>

      {/* Content */}
      <div className="relative z-10 py-20 px-6">
        <div className="text-center mb-12">
          <h1
            data-reveal
            className="pb-3 text-5xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent"
          >
            {section.title}
          </h1>
        </div>

        <div className="max-w-6xl mx-auto space-y-12">
          {section.cards.map((card, index) => (
            <ProjectCardView
              key={card.id}
              card={card}
              index={index}
              featuresLabel={section.featuresLabel ?? 'Key Features'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectSection;
