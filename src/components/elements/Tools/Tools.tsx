import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Hidden.css';
import '../../standards/buttons.css';

interface ToolCardProps {
  title: string;
  onClick?: () => void;
  href?: string;
}

// Internal destinations render a real <button>; external ones render a real <a>
// (so middle-click / open-in-new-tab work), both styled with the shared button class.
const ToolCard: React.FC<ToolCardProps> = ({ title, onClick, href }) => (
  <div className="toggle-section w-full transform hover:scale-105 transition-transform">
    {href ? (
      <a className="button-78 inline-block text-center no-underline" href={href}>
        {title}
      </a>
    ) : (
      <button type="button" className="button-78" onClick={onClick}>
        {title}
      </button>
    )}
  </div>
);

const Tools: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4">
      {/* Navigation */}
      <nav className="flex justify-end mb-8">
        <button
          type="button"
          aria-label="Back to home"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Home size={30} className="text-gray-300 hover:text-white" aria-hidden="true" />
        </button>
      </nav>

      {/* Header */}
      <h1 className="section-heading text-center text-4xl font-bold -mt-16 -mb-8 bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent pb-2">
        Games
      </h1>

      {/* Tools Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ToolCard title="Mapper" onClick={() => navigate('/Tools/Map')} />
          <ToolCard title="Pedantle" onClick={() => navigate('/Tools/Pedantle')} />
        </div>
      </div>

      <h1 className="section-heading text-center text-4xl font-bold mt-24 -mb-8 bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent pb-2">
        Archived Games (Old Website)
      </h1>

      {/* Archived Games Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ToolCard title="Undertale (Scroll down)" href="https://doux124.github.io/jordan" />
          <ToolCard title="2048" href="https://doux124.github.io/jordan/2048" />
          <ToolCard title="Word Search" href="https://doux124.github.io/jordan/wordgame" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <ToolCard title="Piano" href="https://doux124.github.io/jordan/piano" />
        </div>
      </div>
    </div>
  );
};

export default Tools;
