import React from 'react';
import Hero from './elements/Hero';
import Graphene from './elements/Projects/Graphene'
import Annuloplasty from './elements/Projects/Annuloplasty'
import RoverX from './elements/Projects/RoverX'
import Organoids from './elements/Projects/Organoids'
import AI from './elements/Projects/AI'
import MenuButton from './elements/Menu/MenuButton';

const Doux: React.FC = () => {
  return (
    <div>
      <Hero />
      
      <div id="organoids-section">
        <Organoids />
      </div>
      
      <div id="ai-section">
        <AI />
      </div>
      
      <div id="roverx-section">
        <RoverX />
      </div>
      
      <div id="annuloplasty-section">
        <Annuloplasty />
      </div>
      
      <div id="graphene-section">
        <Graphene />
      </div>
      
      <MenuButton />
    </div>
  );
};

export default Doux;