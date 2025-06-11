import NeuralNetwork from "../../standards/backgrounds/NeuralNetwork";
import { Cpu } from "lucide-react";

const AI: React.FC = () => {
  return (
    <div className="relative w-screen min-h-screen overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <NeuralNetwork />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 max-w-6xl mx-auto py-16 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4 justify-center">
            <Cpu className="w-12 h-12 text-cyan-400 animate-pulse" />
            <h1 className="pb-3 text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AI Experience
            </h1>
          </div>
        </div>

        {/* Side-by-Side Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Summary */}
          <div className="bg-cyan-900/50 backdrop-blur-sm rounded-2xl p-8 border border-cyan-600/40 shadow-lg">
            <ul className="space-y-4 text-cyan-200 text-base leading-relaxed">
              <li>🧠 Developed a brain-computer interface training system using a virtual robotic arm.</li>
              <li>⚡ Made life-changing assistive technologies more accessible to stroke patients and amputees.</li>
              <li>📊 Improved BCI classification accuracy and reducing training time for brain-controlled prosthetics and rehabilitation devices.</li>
              <li>🔍 Developed and compared multiple machine learning models (Random Forest, SVM, Logistic Regression, Gradient Boosting) to predict mortality in myocarditis patients using clinical, imaging, and laboratory data.</li>
              <li>🔒 Identified key predictive features to enable early risk stratification and support clinical decision-making.</li>
            </ul>
          </div>

          {/* Visual/Image */}
          <div className="rounded-2xl overflow-hidden border border-zinc-500/40 shadow-xl max-w-md">
            <img
              src="/images/Showcase/eeg_cap.jpg"
              alt="EEG Cap"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AI;
