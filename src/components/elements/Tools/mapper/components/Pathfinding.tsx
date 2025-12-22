import React, { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { Route, ArrowRight, Clock, Ruler, Map, ChevronDown, Navigation } from 'lucide-react';
import { storageUtils } from '../utils/storage';
import { findKShortestPaths, formatDistance, formatDuration } from '../utils/helpers';
import type { PathfindingProps, MapData, MapNode, MapEdge, ViewState, SavedMapInfo, PathResult, Graph, Coordinates } from '../utils/types';

const Pathfinding: React.FC<PathfindingProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  
  // Map selection
  const [savedMaps, setSavedMaps] = useState<SavedMapInfo[]>([]);
  const [selectedMapName, setSelectedMapName] = useState<string>('');
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [showMapDropdown, setShowMapDropdown] = useState<boolean>(false);
  
  // Search state
  const [fromQuery, setFromQuery] = useState<string>('');
  const [toQuery, setToQuery] = useState<string>('');
  const [fromNode, setFromNode] = useState<MapNode | null>(null);
  const [toNode, setToNode] = useState<MapNode | null>(null);
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);
  
  // Pathfinding results
  const [paths, setPaths] = useState<PathResult[]>([]);
  const [selectedPath, setSelectedPath] = useState<number>(0);
  const [searchError, setSearchError] = useState<string>('');

  const [view, setView] = useState<ViewState>({
    scale: 5,
    panX: 0,
    panY: 0,
    isPanning: false,
    lastX: 0,
    lastY: 0
  });

  // Load saved maps on mount
  useEffect(() => {
    const maps = storageUtils.getMapsList();
    setSavedMaps(maps);
  }, []);

  // Load selected map
  const handleSelectMap = (mapName: string): void => {
    const data = storageUtils.loadMap(mapName);
    if (data) {
      setMapData(data);
      setSelectedMapName(mapName);
      setShowMapDropdown(false);
      
      // Reset search state
      setFromQuery('');
      setToQuery('');
      setFromNode(null);
      setToNode(null);
      setPaths([]);
      setSearchError('');
      
      // Reset view
      setView({
        scale: 5,
        panX: 0,
        panY: 0,
        isPanning: false,
        lastX: 0,
        lastY: 0
      });
    }
  };

  // Get nodes and edges from mapData
  const nodes: MapNode[] = mapData ? (Array.isArray(mapData.nodes) ? mapData.nodes : Object.values(mapData.nodes || {})) : [];
  const edges: MapEdge[] = mapData?.edges || [];
  const graph: Graph = mapData?.graph || {};

  // Filter nodes based on search query (matches name or aliases)
  const filterNodes = (query: string): MapNode[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return nodes.filter(n => 
      n.name.toLowerCase().includes(q) ||
      n.aliases?.some(a => a.toLowerCase().includes(q))
    ).slice(0, 8);
  };

  const fromSuggestions = filterNodes(fromQuery);
  const toSuggestions = filterNodes(toQuery);

  const selectFromNode = (node: MapNode): void => {
    setFromNode(node);
    setFromQuery(node.name);
    setShowFromDropdown(false);
    setSearchError('');
    // Focus next input
    setTimeout(() => toInputRef.current?.focus(), 100);
  };

  const selectToNode = (node: MapNode): void => {
    setToNode(node);
    setToQuery(node.name);
    setShowToDropdown(false);
    setSearchError('');
  };

  const swapLocations = (): void => {
    const tempNode = fromNode;
    const tempQuery = fromQuery;
    setFromNode(toNode);
    setFromQuery(toQuery);
    setToNode(tempNode);
    setToQuery(tempQuery);
    setPaths([]);
  };

  const findPaths = (): void => {
    if (!fromNode || !toNode) {
      setSearchError('Please select both start and end locations');
      return;
    }

    if (fromNode.id === toNode.id) {
      setSearchError('Start and end locations are the same');
      return;
    }

    setSearchError('');
    
    // Build graph if not present
    let pathGraph: Graph = graph;
    if (!pathGraph || Object.keys(pathGraph).length === 0) {
      pathGraph = {};
      nodes.forEach(n => pathGraph[n.id] = []);
      edges.forEach(e => {
        if (pathGraph[e.from]) {
          pathGraph[e.from].push({ node: e.to, weight: e.distance, vertical: e.isVertical });
        }
        if (pathGraph[e.to]) {
          pathGraph[e.to].push({ node: e.from, weight: e.distance, vertical: e.isVertical });
        }
      });
    }

    const nodesMap: { [id: string]: MapNode } = nodes.reduce((acc, n) => {
      acc[n.id] = n;
      return acc;
    }, {} as { [id: string]: MapNode });

    const results = findKShortestPaths(pathGraph, nodesMap, fromNode.id, toNode.id, 3);
    setPaths(results);
    setSelectedPath(0);

    if (results.length === 0) {
      setSearchError('No path found between these locations');
    } else {
      fitPathToView(results[0]);
    }
  };

  const fitPathToView = (path: PathResult): void => {
    if (!path || !path.nodes || path.nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    path.nodes.forEach(n => {
      const coords: Coordinates = n.coordinates || { x: n.x, y: n.y, z: n.z };
      minX = Math.min(minX, coords.x);
      maxX = Math.max(maxX, coords.x);
      minY = Math.min(minY, coords.y);
      maxY = Math.max(maxY, coords.y);
    });

    const canvas = canvasRef.current;
    const W = canvas?.width || 800;
    const H = canvas?.height || 600;
    const padding = 120;

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const scale = Math.min(
      (W - padding * 2) / rangeX,
      (H - padding * 2) / rangeY,
      15
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setView({
      scale,
      panX: -centerX * scale,
      panY: centerY * scale,
      isPanning: false,
      lastX: 0,
      lastY: 0
    });
  };

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2 + view.panX;
    const cy = H / 2 + view.panY;
    const scale = view.scale;

    // Background
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);

    // Grid
    const gridSize = Math.max(20, 100 / scale);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;

    for (let x = (cx % gridSize); x < W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = (cy % gridSize); y < H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    if (!mapData) return;

    // Draw all edges (faded)
    edges.forEach(edge => {
      const points = edge.pathPoints || edge.points || [];
      if (points.length < 2) return;

      ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(cx + points[0].x * scale, cy - points[0].y * scale);
      points.forEach(p => {
        ctx.lineTo(cx + p.x * scale, cy - p.y * scale);
      });
      ctx.stroke();
    });

    // Draw selected path
    if (paths.length > 0 && paths[selectedPath]) {
      const path = paths[selectedPath];
      
      // Draw path edges with glow
      for (let i = 0; i < path.path.length - 1; i++) {
        const fromId = path.path[i];
        const toId = path.path[i + 1];
        
        const edge = edges.find(e => 
          (e.from === fromId && e.to === toId) ||
          (e.from === toId && e.to === fromId)
        );

        if (edge) {
          const points = edge.pathPoints || edge.points || [];
          if (points.length >= 2) {
            const colors = ['#10b981', '#3b82f6', '#a855f7'];
            const color = colors[selectedPath] || '#10b981';
            
            // Glow effect
            ctx.strokeStyle = color + '30';
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(cx + points[0].x * scale, cy - points[0].y * scale);
            points.forEach(p => {
              ctx.lineTo(cx + p.x * scale, cy - p.y * scale);
            });
            ctx.stroke();

            // Main line
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx + points[0].x * scale, cy - points[0].y * scale);
            points.forEach(p => {
              ctx.lineTo(cx + p.x * scale, cy - p.y * scale);
            });
            ctx.stroke();
          }
        }
      }

      // Draw path nodes
      path.nodes?.forEach((node, idx) => {
        const coords: Coordinates = node.coordinates || { x: node.x, y: node.y, z: node.z };
        const px = cx + coords.x * scale;
        const py = cy - coords.y * scale;

        const isStart = idx === 0;
        const isEnd = idx === (path.nodes?.length || 0) - 1;

        // Outer glow
        ctx.beginPath();
        ctx.arc(px, py, 20, 0, Math.PI * 2);
        ctx.fillStyle = isStart ? 'rgba(16, 185, 129, 0.25)' : 
                        isEnd ? 'rgba(239, 68, 68, 0.25)' : 
                        'rgba(59, 130, 246, 0.2)';
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(px, py, isStart || isEnd ? 12 : 8, 0, Math.PI * 2);
        ctx.fillStyle = isStart ? '#10b981' : 
                        isEnd ? '#ef4444' : 
                        '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label background
        const text = node.name.slice(0, 15);
        ctx.font = '500 12px system-ui, sans-serif';
        const metrics = ctx.measureText(text);
        const labelY = py + 24;
        
        ctx.beginPath();
        ctx.roundRect(px - metrics.width / 2 - 8, labelY - 10, metrics.width + 16, 20, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fill();
        
        // Label text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(text, px, labelY + 4);

        // Step number for intermediate nodes
        if (!isStart && !isEnd) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px system-ui, sans-serif';
          ctx.fillText(idx.toString(), px, py + 4);
        }
      });
    } else {
      // Draw all nodes (faded) when no path
      nodes.forEach(node => {
        const coords: Coordinates = node.coordinates || { x: node.x, y: node.y, z: node.z };
        const px = cx + coords.x * scale;
        const py = cy - coords.y * scale;

        if (px < -30 || px > W + 30 || py < -30 || py > H + 30) return;

        const isSelected = node.id === fromNode?.id || node.id === toNode?.id;
        const isVert = node.type === 'stairs' || node.type === 'lift';

        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 10 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? (node.id === fromNode?.id ? '#10b981' : '#ef4444') :
                        isVert ? 'rgba(251, 191, 36, 0.4)' : 
                        'rgba(16, 185, 129, 0.3)';
        ctx.fill();
        
        if (isSelected) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }
  }, [view, mapData, paths, selectedPath, fromNode, toNode, nodes, edges]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      if (!target.closest('.from-dropdown-container')) {
        setShowFromDropdown(false);
      }
      if (!target.closest('.to-dropdown-container')) {
        setShowToDropdown(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleMouseDown = (e: ReactMouseEvent<HTMLCanvasElement>): void => {
    setView(v => ({ ...v, isPanning: true, lastX: e.clientX, lastY: e.clientY }));
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLCanvasElement>): void => {
    if (!view.isPanning) return;
    setView(v => ({
      ...v,
      panX: v.panX + e.clientX - v.lastX,
      panY: v.panY + e.clientY - v.lastY,
      lastX: e.clientX,
      lastY: e.clientY
    }));
  };

  const handleMouseUp = (): void => {
    setView(v => ({ ...v, isPanning: false }));
  };

  const handleMouseLeave = (): void => {
    setView(v => ({ ...v, isPanning: false }));
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      {/* Header with Map Selector */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-lg font-semibold text-white/90">Pathfinding</h2>
          <p className="text-xs text-white/40 mt-0.5">Find routes between locations</p>
        </div>
        
        {/* Map Selector */}
        <div className="relative">
          <button
            onClick={() => setShowMapDropdown(!showMapDropdown)}
            className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-all"
          >
            <Map size={16} className="text-emerald-400" />
            <span className="text-sm font-medium text-white/80">
              {selectedMapName || 'Select a map'}
            </span>
            <ChevronDown size={16} className={`text-white/40 transition-transform ${showMapDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showMapDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMapDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#141416] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-white/[0.06]">
                  <p className="text-xs text-white/40 px-2">Saved Maps</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {savedMaps.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-white/40">No saved maps</p>
                      <p className="text-xs text-white/25 mt-1">Create one in the Mapper tab</p>
                    </div>
                  ) : (
                    savedMaps.map(map => (
                      <button
                        key={map.name}
                        onClick={() => handleSelectMap(map.name)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors ${
                          selectedMapName === map.name ? 'bg-emerald-500/10' : ''
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${selectedMapName === map.name ? 'bg-emerald-400' : 'bg-white/20'}`} />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-white/80">{map.name}</p>
                          <p className="text-[10px] text-white/30">
                            {new Date(map.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {!mapData ? (
        // Empty state
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] flex items-center justify-center">
              <Navigation size={28} className="text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white/80 mb-2">No Map Selected</h3>
            <p className="text-sm text-white/40 max-w-xs">
              Select a saved map from the dropdown above to start pathfinding
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Search Section */}
          <div className="px-6 py-4 border-b border-white/[0.06] space-y-3">
            <div className="flex gap-3">
              {/* From Input */}
              <div className="flex-1 relative from-dropdown-container">
                <label className="block text-[10px] text-white/40 uppercase tracking-wide mb-1.5">From</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500" />
                  <input
                    ref={fromInputRef}
                    type="text"
                    value={fromQuery}
                    onChange={(e) => {
                      setFromQuery(e.target.value);
                      setShowFromDropdown(true);
                      setFromNode(null);
                      setPaths([]);
                    }}
                    onFocus={() => setShowFromDropdown(true)}
                    placeholder="Search start location..."
                    className="w-full pl-8 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all"
                  />
                </div>
                
                {showFromDropdown && fromSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#141416] border border-white/[0.08] rounded-xl shadow-2xl z-20 overflow-hidden">
                    {fromSuggestions.map(node => (
                      <button
                        key={node.id}
                        onClick={() => selectFromNode(node)}
                        className="w-full px-4 py-3 text-left hover:bg-white/[0.05] transition-colors border-b border-white/[0.04] last:border-0"
                      >
                        <div className="text-sm font-medium text-white/90">{node.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-white/40 capitalize">{node.type}</span>
                          <span className="text-[10px] text-white/20">•</span>
                          <span className="text-[10px] text-white/40">
                            {node.floor === -1 ? 'B1' : `L${node.floor}`}
                          </span>
                          {node.aliases?.length > 0 && (
                            <>
                              <span className="text-[10px] text-white/20">•</span>
                              <span className="text-[10px] text-emerald-400/60">{node.aliases[0]}</span>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Button */}
              <button
                onClick={swapLocations}
                className="self-end mb-0.5 w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                title="Swap locations"
              >
                <ArrowRight size={16} className="text-white/40 rotate-90" />
              </button>

              {/* To Input */}
              <div className="flex-1 relative to-dropdown-container">
                <label className="block text-[10px] text-white/40 uppercase tracking-wide mb-1.5">To</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
                  <input
                    ref={toInputRef}
                    type="text"
                    value={toQuery}
                    onChange={(e) => {
                      setToQuery(e.target.value);
                      setShowToDropdown(true);
                      setToNode(null);
                      setPaths([]);
                    }}
                    onFocus={() => setShowToDropdown(true)}
                    placeholder="Search destination..."
                    className="w-full pl-8 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 focus:bg-white/[0.08] transition-all"
                  />
                </div>
                
                {showToDropdown && toSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#141416] border border-white/[0.08] rounded-xl shadow-2xl z-20 overflow-hidden">
                    {toSuggestions.map(node => (
                      <button
                        key={node.id}
                        onClick={() => selectToNode(node)}
                        className="w-full px-4 py-3 text-left hover:bg-white/[0.05] transition-colors border-b border-white/[0.04] last:border-0"
                      >
                        <div className="text-sm font-medium text-white/90">{node.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-white/40 capitalize">{node.type}</span>
                          <span className="text-[10px] text-white/20">•</span>
                          <span className="text-[10px] text-white/40">
                            {node.floor === -1 ? 'B1' : `L${node.floor}`}
                          </span>
                          {node.aliases?.length > 0 && (
                            <>
                              <span className="text-[10px] text-white/20">•</span>
                              <span className="text-[10px] text-emerald-400/60">{node.aliases[0]}</span>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {searchError && (
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400">{searchError}</p>
              </div>
            )}

            {/* Find Routes Button */}
            <button
              onClick={findPaths}
              disabled={!fromNode || !toNode}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 flex items-center justify-center gap-2"
            >
              <Route size={16} />
              Find Routes
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <canvas 
              ref={canvasRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />

            {/* Selected locations indicator */}
            {(fromNode || toNode) && paths.length === 0 && (
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm border border-white/[0.08] rounded-xl p-3 space-y-2">
                {fromNode && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-white/70">{fromNode.name}</span>
                  </div>
                )}
                {toNode && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-white/70">{toNode.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Routes Panel */}
          {paths.length > 0 && (
            <div className="border-t border-white/[0.06] bg-[#0a0a0b]">
              <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                {paths.map((path, idx) => {
                  const isSelected = selectedPath === idx;
                  const colors = ['emerald', 'blue', 'purple'];
                  const color = colors[idx] || 'emerald';
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedPath(idx);
                        fitPathToView(path);
                      }}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        isSelected
                          ? `bg-${color}-500/10 border border-${color}-500/30`
                          : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            idx === 0 ? 'bg-emerald-500' : 
                            idx === 1 ? 'bg-blue-500' : 
                            'bg-purple-500'
                          }`} />
                          <span className="font-semibold text-sm text-white/90">
                            Route {idx + 1}
                            {idx === 0 && <span className="ml-2 text-xs font-normal text-emerald-400">(Shortest)</span>}
                          </span>
                        </div>
                        {idx !== 0 && (
                          <span className="text-[10px] text-white/40 bg-white/[0.05] px-2 py-0.5 rounded">
                            +{formatDistance(path.distance - paths[0].distance)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <div className="flex items-center gap-1.5">
                          <Ruler size={12} />
                          <span>{formatDistance(path.distance)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>{formatDuration(path.distance)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ArrowRight size={12} />
                          <span>{path.path.length} stops</span>
                        </div>
                      </div>

                      {isSelected && path.nodes && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                          <div className="space-y-2">
                            {path.nodes.map((node, nodeIdx) => (
                              <div key={node.id} className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  nodeIdx === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                                  nodeIdx === path.nodes!.length - 1 ? 'bg-red-500/20 text-red-400' :
                                  'bg-white/[0.08] text-white/60'
                                }`}>
                                  {nodeIdx === 0 ? 'A' : nodeIdx === path.nodes!.length - 1 ? 'B' : nodeIdx}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-white/80 truncate">{node.name}</p>
                                  <p className="text-[10px] text-white/40">
                                    {node.type} • {node.floor === -1 ? 'B1' : `L${node.floor}`}
                                  </p>
                                </div>
                                {nodeIdx < path.nodes!.length - 1 && (
                                  <ArrowRight size={12} className="text-white/20 flex-shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Pathfinding;