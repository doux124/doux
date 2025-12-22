import { useState, useEffect } from 'react';
import Mapper from './components/Mapper';
import Visualizer from './components/Visualizer';
import Pathfinding from './components/Pathfinding';
import Storage from './components/Storage';
import { storageUtils } from './utils/storage';
import type { MapData, Tab } from './utils/types';

function Map() {
  const [activeTab, setActiveTab] = useState<string>('mapper');
  const [loadedMap, setLoadedMap] = useState<MapData | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const tabs: Tab[] = [
    { id: 'mapper', label: 'Mapper', icon: '◇' },
    { id: 'storage', label: 'Storage', icon: '□' },
    { id: 'visualizer', label: 'Visualizer', icon: '○' },
    { id: 'pathfinding', label: 'Pathfinding', icon: '△' },
  ];

  const handleLoadMap = (map: MapData): void => {
    setLoadedMap(map);
    setActiveTab('mapper');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0b] text-white">
      {/* Sidebar Navigation */}
      <aside
        className={`
          relative z-30 flex h-full w-64 flex-col
          border-r border-white/[0.06] bg-[#0a0a0b]
          transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
        `}
      >
        {/* Subtle sidebar gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          <div className="space-y-1">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const isHovered = hoveredTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`
                    group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5
                    transition-all duration-200 ease-out
                    ${isActive 
                      ? 'text-white' 
                      : 'text-white/40 hover:text-white/70'
                    }
                  `}
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Active indicator */}
                  <div
                    className={`
                      absolute inset-0 rounded-lg transition-all duration-300
                      ${isActive 
                        ? 'bg-white/[0.08] opacity-100' 
                        : 'bg-white/[0.04] opacity-0 group-hover:opacity-100'
                      }
                    `}
                  />
                  
                  {/* Left accent bar */}
                  <div
                    className={`
                      absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full
                      transition-all duration-300
                      ${isActive 
                        ? 'bg-emerald-400 opacity-100' 
                        : 'bg-white/20 opacity-0'
                      }
                    `}
                  />

                  {/* Icon */}
                  <span
                    className={`
                      relative flex h-7 w-7 items-center justify-center rounded-md
                      text-xs transition-all duration-200
                      ${isActive 
                        ? 'text-emerald-400' 
                        : 'text-white/30 group-hover:text-white/50'
                      }
                    `}
                  >
                    {tab.icon}
                  </span>

                  {/* Label */}
                  <span className="relative text-[13px] font-medium">
                    {tab.label}
                  </span>

                  {/* Hover glow */}
                  {(isHovered || isActive) && (
                    <div
                      className={`
                        pointer-events-none absolute -right-3 top-1/2 h-12 w-12 -translate-y-1/2
                        rounded-full blur-xl transition-opacity duration-500
                        ${isActive ? 'bg-emerald-500/10' : 'bg-white/5'}
                      `}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Content */}
        <main
          className={`
            relative flex-1 overflow-y-auto overflow-x-hidden
            transition-all duration-700 delay-200 ease-out
            ${isLoaded ? 'opacity-100' : 'opacity-0 translate-y-2'}
          `}
        >
          {/* Ambient background effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-500/[0.03] blur-3xl" />
            <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/[0.02] blur-3xl" />
          </div>

          {/* Grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
              `,
              backgroundSize: '64px 64px',
            }}
          />

          {/* Tab content */}
          <div className="relative z-10 h-full">
            {activeTab === 'mapper' && (
              <Mapper loadedMap={loadedMap} onSave={(mapName: string, mapData: MapData) => storageUtils.saveMap(mapName, mapData)} />
            )}
            {activeTab === 'storage' && <Storage onLoadMap={handleLoadMap} />}
            {activeTab === 'visualizer' && (
              <Visualizer />
            )}
            {activeTab === 'pathfinding' && (
              <Pathfinding />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Map;