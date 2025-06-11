import CellularAutomata from "../../standards/backgrounds/CellularAutomata";
import { Microscope } from "lucide-react";

const Organoids: React.FC = () => {
  return (
    <div className="relative w-screen min-h-screen overflow-hidden bg-black">
      {/* Background Visual Layer */}
      <div className="absolute inset-0 z-0">
        <CellularAutomata />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 max-w-6xl mx-auto py-16 px-6">
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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Block */}
          <div className="bg-gradient-to-br from-pink-900/50 to-purple-900/40 backdrop-blur-sm rounded-2xl p-8 border border-pink-600/40 shadow-lg">
            <h2 className="text-2xl font-semibold text-pink-100 mb-6">Core Highlights</h2>
            <ul className="space-y-4 text-pink-200 text-base leading-relaxed">
              <li>🧠 Grew liver organoids.</li>
              <li>🧪 Induced NASH.</li>
              <li>✨ Discovered novel NASH-eliminating properties in a class of drugs.</li>
              <li>🔬 Recovery of actin and mitochondria.</li>
              <li>❤️ Reduction in size of fatty droplets.</li>
            </ul>
          </div>

          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-zinc-500/40 shadow-xl max-w-md">
            <img 
              src="/images/Showcase/Organoid.png" 
              alt="Organoid"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};


export default Organoids;
