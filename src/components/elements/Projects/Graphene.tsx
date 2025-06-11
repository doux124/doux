import Graphene from "../../standards/backgrounds/Graphene";
import { Microscope, Zap } from 'lucide-react';

const GrapheneProjectHighlight = () => {
  return (
    <div className="relative w-screen min-h-screen overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Graphene />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 max-w-6xl mx-auto py-16 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Microscope className="w-16 h-16 text-blue-400" />
              <div className="absolute -top-2 -right-2">
                <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="pb-3 text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Graphene Biosensor
          </h1>
          <p className="text-lg text-gray-300">
            The use of Plasma-Engineered Defects on Graphene for Better Glucose Detection
          </p>
        </div>

        {/* Side-by-Side Layout */}
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Text Summary */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-lg">
            <h2 className="text-2xl font-semibold text-cyan-300 mb-4 flex items-center justify-center">Key Highlights</h2>
            <ul className="space-y-4 text-gray-300 text-base leading-relaxed">
              <li>💡 Created glucose sensors with wider detection range and better sensitivity than existing sensors.</li>
              <li>⚙️ RF plasma treatment created defects in graphene for the attachmemt of glucose oxidase.</li>
              <li>📈 5-minute plasma exposure showed best biosensor performance.</li>
              <li>🔬 Raman spectroscopy confirmed increased D-peak (defects).</li>
            </ul>
          </div>

          {/* Image Section */}
          <div className="rounded-2xl overflow-hidden border border-cyan-500/40 shadow-lg">
            <img 
              src="/images/Showcase/cvd.png" 
              alt="RF Plasma" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrapheneProjectHighlight;
