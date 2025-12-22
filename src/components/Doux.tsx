import React from 'react';
import Hero from './elements/Hero';
import BME from './elements/Sections/BME/BME'
import CS from './elements/Sections/CS/CS'
import MenuButton from './elements/Menu/MenuButton'

const Doux: React.FC = () => {
  return (
    <div>
      <Hero />

      <div id="bme-section">
        <BME />
      </div>
      <div id="cs-section">
        <CS />
      </div>
      
      <MenuButton />
    </div>
  );
};

export default Doux;