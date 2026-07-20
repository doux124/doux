import React from 'react';
import Hero from './elements/Hero';
import MenuButton from './elements/Menu/MenuButton';
import ProjectSection from './elements/Sections/ProjectSection';
import Highlights from './elements/Sections/Highlights/Highlights';
import { sections } from '../content/siteContent';

const Doux: React.FC = () => {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>

      <main id="main-content">
        <Hero />

        {sections.map((section) => (
          <div id={section.id} key={section.id}>
            {section.kind === 'projects' ? (
              <ProjectSection section={section} />
            ) : (
              <Highlights section={section} />
            )}
          </div>
        ))}
      </main>

      <MenuButton />
    </>
  );
};

export default Doux;
