import React, { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { ZoomIn, ZoomOut, Home, Square, Download, ChevronDown, Map } from 'lucide-react';
import { storageUtils } from '../utils/storage';
import type { VisualizerProps, MapData, MapNode, MapEdge, ViewState, SavedMapInfo, Coordinates } from '../utils/types';

const Visualizer: React.FC<VisualizerProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [savedMaps, setSavedMaps] = useState<SavedMapInfo[]>([]);
  const [selectedMapName, setSelectedMapName] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  
  const [view, setView] = useState<ViewState>({
    scale: 5,
    panX: 0,
    panY: 0,
    isPanning: false,
    lastX: 0,
    lastY: 0
  });

  // Load saved maps list on mount
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
      setSelectedNode(null);
      setShowDropdown(false);
      
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

  // Get unique floors from nodes
  const availableFloors: number[] = [...new Set(nodes.map(n => n.floor))].sort((a, b) => a - b);

  // Auto-set floor to one that has nodes
  useEffect(() => {
    if (availableFloors.length > 0 && !availableFloors.includes(currentFloor)) {
      setCurrentFloor(availableFloors[0]);
    }
  }, [mapData, availableFloors, currentFloor]);

  // Rendering
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
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Grid
    const gridSize = Math.max(20, 100 / scale);
    ctx.strokeStyle = '#21262d';
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

    // Origin crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();

    if (!mapData) return;

    // Edges for current floor
    edges.forEach(edge => {
      if (edge.floor !== currentFloor && !edge.isVertical) return;
      if (edge.isVertical && edge.fromFloor !== currentFloor && edge.toFloor !== currentFloor) return;

      const points = edge.pathPoints || edge.points || [];
      if (points.length < 2) return;

      // Edge glow
      ctx.strokeStyle = edge.isVertical ? 'rgba(251, 191, 36, 0.15)' : 'rgba(139, 92, 246, 0.15)';
      ctx.lineWidth = edge.isVertical ? 8 : 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + points[0].x * scale, cy - points[0].y * scale);
      points.forEach(p => {
        ctx.lineTo(cx + p.x * scale, cy - p.y * scale);
      });
      ctx.stroke();

      // Edge line
      ctx.strokeStyle = edge.isVertical ? '#fbbf24' : '#8b5cf6';
      ctx.lineWidth = edge.isVertical ? 2 : 3;
      ctx.setLineDash(edge.isVertical ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(cx + points[0].x * scale, cy - points[0].y * scale);
      points.forEach(p => {
        ctx.lineTo(cx + p.x * scale, cy - p.y * scale);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Nodes for current floor
    nodes.filter(n => n.floor === currentFloor).forEach(node => {
      const coords: Coordinates = node.coordinates || { x: node.x, y: node.y, z: node.z };
      const px = cx + coords.x * scale;
      const py = cy - coords.y * scale;

      if (px < -30 || px > W + 30 || py < -30 || py > H + 30) return;

      const isVert = node.type === 'stairs' || node.type === 'lift';
      const isEntrance = node.type === 'entrance';
      const isSelected = selectedNode?.id === node.id;

      // Node glow
      const glowColor = isSelected ? 'rgba(251, 191, 36, 0.4)' : 
                        isVert ? 'rgba(251, 191, 36, 0.2)' : 
                        isEntrance ? 'rgba(59, 130, 246, 0.2)' : 
                        'rgba(16, 185, 129, 0.2)';
      
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 20 : 16, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();

      // Node circle
      ctx.fillStyle = isSelected ? '#fbbf24' : 
                      isVert ? '#f59e0b' : 
                      isEntrance ? '#3b82f6' : 
                      '#10b981';
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      if (scale >= 2) {
        const text = node.name.slice(0, 15);
        ctx.font = `500 ${Math.min(13, 10 + scale)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        
        const metrics = ctx.measureText(text);
        const labelY = py + 20 + scale;
        
        // Label background
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        const padding = 6;
        ctx.beginPath();
        ctx.roundRect(px - metrics.width / 2 - padding, labelY - 10, metrics.width + padding * 2, 16, 4);
        ctx.fill();
        
        // Label text
        ctx.fillStyle = '#fff';
        ctx.fillText(text, px, labelY);
      }
    });

    // Scale bar
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px system-ui, sans-serif';
    const scaleMeters = Math.round(80 / scale);
    const scalePx = scaleMeters * scale;
    
    ctx.beginPath();
    ctx.roundRect(W - 110, H - 40, scalePx + 20, 24, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(W - 100, H - 26, scalePx, 3);
    ctx.textAlign = 'left';
    ctx.fillText(`${scaleMeters}m`, W - 100, H - 32);
  }, [view, mapData, currentFloor, selectedNode, nodes, edges]);

  const zoomIn = (): void => setView(v => ({ ...v, scale: Math.min(30, v.scale * 1.4) }));
  const zoomOut = (): void => setView(v => ({ ...v, scale: Math.max(0.5, v.scale / 1.4) }));
  const resetView = (): void => setView({ scale: 5, panX: 0, panY: 0, isPanning: false, lastX: 0, lastY: 0 });
  
  const fitToView = (): void => {
    const floorNodesFiltered = nodes.filter(n => n.floor === currentFloor);
    if (floorNodesFiltered.length === 0) {
      resetView();
      return;
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    floorNodesFiltered.forEach(n => {
      const coords: Coordinates = n.coordinates || { x: n.x, y: n.y, z: n.z };
      minX = Math.min(minX, coords.x);
      maxX = Math.max(maxX, coords.x);
      minY = Math.min(minY, coords.y);
      maxY = Math.max(maxY, coords.y);
    });

    const canvas = canvasRef.current;
    const W = canvas?.width || 800;
    const H = canvas?.height || 600;
    const padding = 100;

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const newScale = Math.min(
      (W - padding * 2) / rangeX,
      (H - padding * 2) / rangeY,
      20
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setView({
      scale: newScale,
      panX: -centerX * newScale,
      panY: centerY * newScale,
      isPanning: false,
      lastX: 0,
      lastY: 0
    });
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>): void => {
    if (!mapData) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const cx = canvas.width / 2 + view.panX;
    const cy = canvas.height / 2 + view.panY;

    let closestNode: MapNode | null = null;
    let closestDist = 25;

    nodes.filter(n => n.floor === currentFloor).forEach(node => {
      const coords: Coordinates = node.coordinates || { x: node.x, y: node.y, z: node.z };
      const px = cx + coords.x * view.scale;
      const py = cy - coords.y * view.scale;
      const dist = Math.sqrt((clickX - px) ** 2 + (clickY - py) ** 2);

      if (dist < closestDist) {
        closestDist = dist;
        closestNode = node;
      }
    });

    setSelectedNode(closestNode);
  };

  const exportImage = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `${mapData?.metadata?.building || mapData?.name || 'map'}-floor-${currentFloor}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const floorNodes = nodes.filter(n => n.floor === currentFloor);
  const verticalEdges = edges.filter(e => e.isVertical);

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
          <h2 className="text-lg font-semibold text-white/90">Visualizer</h2>
          <p className="text-xs text-white/40 mt-0.5">View and explore your maps</p>
        </div>
        
        {/* Map Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-all"
          >
            <Map size={16} className="text-emerald-400" />
            <span className="text-sm font-medium text-white/80">
              {selectedMapName || 'Select a map'}
            </span>
            <ChevronDown size={16} className={`text-white/40 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
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

      {/* Main Content */}
      {!mapData ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] flex items-center justify-center">
              <Map size={28} className="text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white/80 mb-2">No Map Selected</h3>
            <p className="text-sm text-white/40 max-w-xs">
              Select a saved map from the dropdown above to visualize it
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Canvas */}
          <div className="flex-1 relative">
            <canvas 
              ref={canvasRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onClick={handleCanvasClick}
            />

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1.5">
              {[
                { icon: ZoomIn, action: zoomIn, label: 'Zoom in' },
                { icon: ZoomOut, action: zoomOut, label: 'Zoom out' },
                { icon: Home, action: resetView, label: 'Reset view' },
                { icon: Square, action: fitToView, label: 'Fit to view' },
              ].map(({ icon: Icon, action, label }) => (
                <button 
                  key={label}
                  onClick={action} 
                  title={label}
                  className="w-9 h-9 rounded-lg bg-black/40 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                >
                  <Icon size={16} className="text-white/60" />
                </button>
              ))}
              <div className="px-2 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/[0.08] text-[10px] text-center text-white/50 font-mono">
                {view.scale.toFixed(1)}x
              </div>
            </div>

            {/* Legend */}
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm border border-white/[0.08] rounded-xl p-4 text-xs">
              <div className="font-semibold text-white/60 mb-3 pb-2 border-b border-white/[0.06]">Legend</div>
              <div className="space-y-2.5">
                {[
                  { color: 'bg-emerald-500', label: 'Room / Other' },
                  { color: 'bg-amber-500', label: 'Stairs / Lift' },
                  { color: 'bg-blue-500', label: 'Entrance' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-white/50">{label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-0.5 rounded bg-purple-500" />
                  <span className="text-white/50">Path</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-0.5 rounded bg-amber-500 opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px)' }} />
                  <span className="text-white/50">Vertical</span>
                </div>
              </div>
            </div>

            {/* Selected Node Info */}
            {selectedNode && (
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm border border-white/[0.08] rounded-xl p-4 min-w-[220px]">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    selectedNode.type === 'stairs' || selectedNode.type === 'lift' ? 'bg-amber-500' :
                    selectedNode.type === 'entrance' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`} />
                  <h3 className="font-semibold text-sm text-white/90">{selectedNode.name}</h3>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Type', value: selectedNode.type, color: 'text-emerald-400' },
                    { label: 'Floor', value: selectedNode.floor === -1 ? 'B1' : `L${selectedNode.floor}`, color: 'text-blue-400' },
                    { 
                      label: 'Position', 
                      value: `(${(selectedNode.coordinates?.x || selectedNode.x).toFixed(1)}, ${(selectedNode.coordinates?.y || selectedNode.y).toFixed(1)})`,
                      color: 'text-white/60',
                      mono: true
                    },
                  ].map(({ label, value, color, mono }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-white/40">{label}</span>
                      <span className={`${color} ${mono ? 'font-mono text-[10px]' : ''}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floor Selector */}
          <div className="px-4 py-3 border-t border-white/[0.06] bg-[#0a0a0b]">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {availableFloors.length > 0 ? availableFloors.map(f => {
                const count = nodes.filter(n => n.floor === f).length;
                const label = f === -1 ? 'B1' : `L${f}`;
                const isActive = currentFloor === f;
                
                return (
                  <button
                    key={f}
                    onClick={() => setCurrentFloor(f)}
                    className={`
                      px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                      ${isActive 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/[0.04] text-white/50 border border-transparent hover:bg-white/[0.08] hover:text-white/70'
                      }
                    `}
                  >
                    {label}
                    <span className="ml-1.5 text-xs opacity-60">({count})</span>
                  </button>
                );
              }) : (
                <p className="text-sm text-white/30 py-2">No floors available</p>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-3 px-4 py-3 border-t border-white/[0.06] bg-[#0a0a0b]">
            {[
              { value: nodes.length, label: 'Total Nodes', color: 'text-blue-400' },
              { value: floorNodes.length, label: 'Floor Nodes', color: 'text-emerald-400' },
              { value: edges.length, label: 'Edges', color: 'text-purple-400' },
              { value: verticalEdges.length, label: 'Vertical', color: 'text-amber-400' },
            ].map(({ value, label, color }) => (
              <div key={label} className="bg-white/[0.03] rounded-lg p-3 text-center">
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-white/40 uppercase mt-1 tracking-wide">{label}</div>
              </div>
            ))}
          </div>

          {/* Export Button */}
          <div className="px-4 py-3 border-t border-white/[0.06] bg-[#0a0a0b]">
            <button
              onClick={exportImage}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-sm bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white/90 transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Export Floor Image
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Visualizer;