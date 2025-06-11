import Heat from "../../standards/backgrounds/Heat";
import { Bot } from "lucide-react";

const RoverX: React.FC = () => {
  return (
    <div className="relative w-screen min-h-screen overflow-hidden bg-black">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <Heat />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 max-w-6xl mx-auto py-16 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Bot className="w-12 h-12 text-gray-300 animate-pulse" />
            <h1 className="pb-3 text-4xl font-bold bg-gradient-to-r from-gray-300 to-zinc-100 bg-clip-text text-transparent">
              Internship at MDS+
            </h1>
          </div>
        </div>

        {/* Side-by-Side Layout */}
        <div className="grid lg:grid-cols-2 gap-0 items-center justify-items-center">
          {/* Summary Text */}
          <div className="bg-gradient-to-br from-zinc-800/60 to-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-zinc-600/40 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6 flex items-center justify-center">Highlights</h2>
            <ul className="space-y-4 text-gray-300 text-base leading-relaxed">
              <li>🔥 <strong>Conducted thermal simulations</strong> in SolidWorks for Rover-X, the HomeTeam robotic surveillence dog.</li>
              <li>🛠️ <strong>Improved heat dissipation</strong> through iterative design enhancements.</li>
              <li>🧪 <strong>3D printed customized endoscope prototypes</strong> for deploying a colonic support stent.</li>
              <li>🧱 <strong>Performed loading simulation</strong> to assess the strength of the colonic stent.</li>
              <li>🧲 <strong>Contributed to project ideation and performed magnetic simulations</strong> using COMSOL Multiphysics for Endopill, a magnetically triggered pill.</li>
            </ul>
          </div>

          {/* Visual/Image */}
          <div className="rounded-2xl overflow-hidden border border-zinc-500/40 shadow-xl max-w-md">
            <img 
              src="/images/Showcase/RoverX.jpeg" 
              alt="RoverX"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoverX;
