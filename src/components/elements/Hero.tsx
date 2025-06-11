import Standard from '../standards/backgrounds/Standard';

const Hero: React.FC = () => {
  return (
    <div className="w-screen h-screen relative flex items-center justify-center">
      <Standard />
      
      <div className="relative z-10 max-w-5xl w-full mx-auto px-6 pointer-events-none">
        <div className="text-center text-white backdrop-blur-sm bg-black/20 rounded-2xl p-6 md:p-12 border border-white/10 pointer-events-none">
          {/* Name Section */}
          <p className="text-3xl md:text-6xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400">
            Jordan Low Jun Yi
          </p>
          
          {/* Bio Section */}
          <div className="mb-4 md:mb-8">
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
              Biomedical Engineering at NUS
            </p>
            <p className="text-base md:text-lg text-gray-300 mt-2">
              Second Major in Computing • Specialization in Tissue Engineering
            </p>
          </div>
          
          {/* Contact Section */}
          <div className="space-y-6">
            <div className="grid gap-2 md:gap-4 text-base md:text-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                <span className="text-gray-300 font-medium">Email:</span>
                <a
                  href="mailto:e0795240@u.nus.edu?subject=Contact%20from%20Website&body=Hi%20Jordan,"
                  className="pointer-events-auto text-orange-300 hover:text-orange-200 transition-colors underline underline-offset-4"
                >
                  jordanljy@u.nus.edu
                </a>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                <span className="text-gray-300 font-medium">LinkedIn:</span>
                <a
                  href="https://linkedin.com/in/jordan-low-jun-yi-69a150279"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto text-orange-300 hover:text-orange-200 transition-colors underline underline-offset-4"
                >
                  linkedin.com/in/jordan-low-69a150279
                </a>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                <span className="text-gray-300 font-medium">Google Scholar:</span>
                <a
                  href="https://scholar.google.com/citations?hl=en&user=O6M8clAAAAAJ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto text-orange-300 hover:text-orange-200 transition-colors underline underline-offset-4 break-all"
                >
                  https://scholar.google.com/citations?hl=en&user=O6M8clAAAAAJ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Down Arrow */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 mb-10 pointer-events-none">
        <div className="flex flex-col items-center text-white/70 hover:text-white transition-colors cursor-pointer pointer-events-auto">
          <div className="animate-bounce">
            <svg 
              className="w-12 h-12" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;