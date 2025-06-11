import { Heart } from "lucide-react";
import BloodFlow from "../../standards/backgrounds/BloodFlow";

const AnnuloplastySummary = () => {
  return (
    <div className="relative w-screen min-h-screen overflow-hidden bg-black">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <BloodFlow />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 max-w-6xl mx-auto py-16 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Heart className="w-12 h-12 text-red-400 animate-pulse" />
            <h1 className="pb-3 text-4xl font-bold bg-gradient-to-r from-red-300 to-white bg-clip-text text-transparent">
              Novel Annuloplasty Rings
            </h1>
          </div>
          <p className="text-lg text-red-200 max-w-3xl mx-auto leading-relaxed">
            The development of shape-memory, biodegradable rings transforming cardiac surgery with minimal incisions and clinical effectiveness
          </p>
        </div>

        {/* Side-by-Side Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Summary Text */}
          <div className="bg-red-900/30 backdrop-blur-sm rounded-2xl p-8 border border-red-600/40 shadow-lg">
            <h2 className="text-2xl font-semibold text-red-200 mb-6 flex items-center justify-center">Key Achievements</h2>
            <ul className="space-y-4 text-red-100 text-base leading-relaxed">
              <li>🔬 <strong>Shape-memory rings</strong> made from Nitinol & MMA-PEGDMA.</li>
              <li>🩺 <strong>94.3% reduction</strong> in incision size for cardiac surgeries.</li>
              <li>🔥 <strong>Thermoresponsive design</strong>: expands at body temperature.</li>
              <li>🧒 <strong>Biodegradable options</strong> tailored for pediatric hearts.</li>
              <li>📉 <strong>48% reduction</strong> in mitral valve regurgitation.</li>
            </ul>
          </div>

          {/* Visual/Image */}
          <div className="rounded-2xl overflow-hidden border border-red-500/40 shadow-xl">
            <img 
              src="/images/Showcase/polymer_ring.png" 
              alt="MMA-PEGDMA Annuloplasty ring"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnuloplastySummary;
