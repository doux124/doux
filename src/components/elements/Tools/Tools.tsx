import { Suspense } from "react";
import ToggleSection from "./ToggleSection";
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tools: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string): void => {
    navigate(path);
  };

  return (
    <div className="w-screen min-h-screen bg-gray-50 p-4">
      {/* Navigation */}
      <nav className="flex justify-end mb-8">
        <a
          className="navLink p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          onClick={() => handleNavigation('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigation('/')}
        >
          <Home size={30} className="text-gray-700 hover:text-gray-900" />
        </a>
      </nav>

      {/* Header */}
      <h1 className="section-heading text-center text-4xl font-bold text-gray-800 -mt-16 -mb-8">
        Games
      </h1>

      {/* Tools Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mapper */}
          <div className="w-full cursor-pointer transform hover:scale-105 transition-transform"
            onClick={() => navigate('/Tools/Map')}
          >
            <ToggleSection title="Mapper">
              <Suspense fallback={<div className="text-center py-4">Loading...</div>}></Suspense>
            </ToggleSection>
          </div>
        </div>
      </div>

      <h1 className="section-heading text-center text-4xl font-bold text-gray-800 mt-24 -mb-8">
        Archived Games (Old Website)
      </h1>

      {/* Tools Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Undertale */}
          <div className="w-full cursor-pointer transform hover:scale-105 transition-transform"
            onClick={() => window.location.href = 'https://doux124.github.io/jordan'}
          >
            <ToggleSection title="Undertale (Scroll down)">
              <Suspense fallback={<div className="text-center py-4">Loading...</div>}></Suspense>
            </ToggleSection>
          </div>


          {/* 2048 Tool */}
          <div className="w-full cursor-pointer transform hover:scale-105 transition-transform"
            onClick={() => window.location.href = 'https://doux124.github.io/jordan/2048'}
          >
            <ToggleSection title="2048">
              <Suspense fallback={<div className="text-center py-4">Loading...</div>}></Suspense>
            </ToggleSection>
          </div>

          {/* Word Search Tool */}
          <div className="w-full cursor-pointer transform hover:scale-105 transition-transform"
            onClick={() => window.location.href = 'https://doux124.github.io/jordan/wordgame'}
          >
            <ToggleSection title="Word Search">
              <Suspense fallback={<div className="text-center py-4">Loading...</div>}></Suspense>
            </ToggleSection>
          </div>
        </div>

        {/* Piano Tool */}
          <div className="w-full cursor-pointer transform hover:scale-105 transition-transform"
            onClick={() => window.location.href = 'https://doux124.github.io/jordan/piano'}
          >
            <ToggleSection title="Piano">
              <Suspense fallback={<div className="text-center py-4">Loading...</div>}></Suspense>
            </ToggleSection>
          </div>
      </div>
    </div>
  );
};

export default Tools;