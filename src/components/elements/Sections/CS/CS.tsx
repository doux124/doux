import { projects } from './projectsData';
import Semiconductor from '../../../standards/backgrounds/Semiconductor';

const CS: React.FC = () => {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <Semiconductor />
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-20 px-6">
        {/* Header */}
        <div className="text-center mb-12 select-none pointer-events-none">
          <h1 className="pb-3 text-5xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
            Computer Science Projects
          </h1>
        </div>

        {/* Projects Grid */}
        <div className="max-w-6xl mx-auto space-y-12">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="rounded-3xl overflow-hidden border border-pink-500/30 shadow-2xl shadow-pink-500/10 bg-gradient-to-br from-pink-900/40 to-purple-900/30 backdrop-blur-md select-none pointer-events-none"
            >
              <div className={`flex flex-col lg:flex-row lg:h-[400px] ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                {/* Project Image */}
                <div className="lg:w-1/2 h-64 sm:h-80 lg:h-full relative overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  {/* Fallback gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-30 -z-10`} />
                  <span className="absolute inset-0 flex items-center justify-center text-6xl -z-5">🖼️</span>
                </div>

                {/* Project Details */}
                <div className="lg:w-1/2 p-8 flex flex-col justify-center">
                  {/* Project Header */}
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">{project.title}</h2>
                    <p className="text-gray-400 text-lg">{project.subtitle}</p>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="text-xl font-semibold text-pink-100 mb-4">Key Features</h3>
                    <ul className="space-y-3 text-gray-300 text-base leading-relaxed">
                      {project.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-pink-400 mt-1">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CS;