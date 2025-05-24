import React from 'react';
import Heat from './backgrounds/Heat';

const Doux: React.FC = () => {
  const handlePortfolioClick = (): void => {
    // Add your portfolio navigation logic here
    console.log('Portfolio clicked');
  };

  const handleContactClick = (): void => {
    // Add your contact navigation logic here
    console.log('Contact clicked');
  };

  return (
    <div className="min-h-screen relative">
      <Heat />
      
      {/* Your website content goes here */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center text-white backdrop-blur-sm bg-black/20 rounded-2xl p-8 border border-white/10">
          <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400">
            Your Name
          </h1>
          <p className="text-xl text-orange-200 mb-8">
            Biomedical Engineering Student
          </p>
          <div className="space-x-4">
            <button 
              onClick={handlePortfolioClick}
              className="px-6 py-3 bg-orange-600/20 border border-orange-400/30 rounded-lg hover:bg-orange-600/30 transition-all duration-300 backdrop-blur-sm"
            >
              Portfolio
            </button>
            <button 
              onClick={handleContactClick}
              className="px-6 py-3 bg-red-600/20 border border-red-400/30 rounded-lg hover:bg-red-600/30 transition-all duration-300 backdrop-blur-sm"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doux;