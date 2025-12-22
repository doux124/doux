import React from 'react';
import Slider from 'react-slick';
import CellularAutomata from "../../standards/backgrounds/CellularAutomata";
import { Microscope } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Organoids: React.FC = () => {
  // Slider settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: true,
  };

  // Foreground Content Element
  const foregroundContent = (
    <div className="py-16 px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <Microscope className="w-12 h-12 text-pink-400 animate-pulse" />
          <h1 className="pb-3 text-4xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
            Organoid Research
          </h1>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
        {/* Text Block */}
        <div className="bg-gradient-to-br from-pink-900/50 to-purple-900/40 backdrop-blur-sm rounded-2xl p-8 border border-pink-600/40 shadow-lg">
          <h2 className="text-2xl font-semibold text-pink-100 mb-6">Core Highlights</h2>
          <ul className="space-y-4 text-pink-200 text-base leading-relaxed">
            <li>🧠 Grew liver organoids.</li>
            <li>🧪 Discovered novel MASH-eliminating properties in classes of drugs used for atherosclerosis.</li>
            <li>🔬 Restored actin cytoskeleton and mitochondria count in diseased cells.</li>
            <li>❤️ Reduced the volume of fat in diseased cells.</li>
          </ul>
        </div>

        {/* Image */}
        <div className="rounded-2xl overflow-hidden border border-zinc-500/40 shadow-xl max-w-md mx-auto">
          <img 
            src="/Jordan/images/Showcase/Organoid.png" 
            alt="Organoid"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </div>
  );

  // Create 5 slides with the same content
  const slides = Array(5).fill(null).map((_, index) => (
    <div key={index}>
      {foregroundContent}
    </div>
  ));

  return (
    <div className="relative w-screen min-h-screen overflow-hidden bg-black">
      {/* Background Visual Layer */}
      <div className="absolute inset-0 z-0">
        <CellularAutomata />
      </div>

      {/* Carousel with 5 slides */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4">
          <style>{`
            /* Custom styles for slick carousel */
            .slick-prev,
            .slick-next {
              z-index: 1000;
              width: 50px;
              height: 50px;
            }
            
            .slick-prev {
              left: 25px;
            }
            
            .slick-next {
              right: 25px;
            }
            
            .slick-prev:before,
            .slick-next:before {
              font-size: 50px;
              color: #ec4899;
              opacity: 1;
            }
            
            .slick-prev:hover:before,
            .slick-next:hover:before {
              color: #db2777;
            }
            
            .slick-dots {
              bottom: 25px;
            }
            
            .slick-dots li button:before {
              font-size: 12px;
              color: #ec4899;
              opacity: 0.5;
            }
            
            .slick-dots li.slick-active button:before {
              color: #ec4899;
              opacity: 1;
            }
            
            .slick-dots li button:hover:before {
              opacity: 0.75;
            }
          `}</style>
          <Slider {...settings}>
            {slides}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default Organoids;