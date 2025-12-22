import React, { useState, useEffect, useRef, type ChangeEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { MapPin, Navigation, Save, Play, Square as StopIcon, ZoomIn, ZoomOut, Home, Target } from 'lucide-react';
import { useGPS } from '../utils/useGPS';
import { dist2d, dist3d, generateId } from '../utils/helpers';
import type { MapperProps, MapNode, MapEdge, PathPoint, ViewState, NodeForm, ToastState, NodeType, Graph, Coordinates } from '../utils/types';

const NODE_PROXIMITY = 5;
const MIN_POINT_DIST = 1;
const FLOOR_HEIGHT = 4;
const Z_THRESHOLD = 2;
const FLOORS: number[] = [-1, 1, 2, 3, 4, 5, 6];

const Mapper: React.FC<MapperProps> = ({ onSave, loadedMap }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [recording, setRecording] = useState<boolean>(false);
  const [recPoints, setRecPoints] = useState<PathPoint[]>([]);
  const [recConnectedNodes, setRecConnectedNodes] = useState<string[]>([]);
  const [lastPoint, setLastPoint] = useState<PathPoint | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [lastFloorZ, setLastFloorZ] = useState<number>(0);
  const [showFloorHint, setShowFloorHint] = useState<boolean>(false);
  
  // View state
  const [view, setView] = useState<ViewState>({
    scale: 4,
    panX: 0,
    panY: 0,
    isPanning: false,
    lastX: 0,
    lastY: 0
  });

  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [nodeForm, setNodeForm] = useState<NodeForm>({
    name: '',
    type: 'room',
    aliases: ''
  });

  // Toast
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const gps = useGPS();

  const showToast = (message: string): void => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  };

  // Load map from props
  useEffect(() => {
    if (loadedMap) {
      const nodesArray = Array.isArray(loadedMap.nodes) 
        ? loadedMap.nodes 
        : Object.values(loadedMap.nodes || {});
      setNodes(nodesArray as MapNode[]);
      setEdges(loadedMap.edges || []);
      setTotalDistance(loadedMap.metadata?.stats?.totalDistance || 0);
    }
  }, [loadedMap]);

  // Floor change detection
  useEffect(() => {
    if (gps.position.z !== null) {
      const zDiff = gps.position.z - lastFloorZ;
      setShowFloorHint(Math.abs(zDiff) > Z_THRESHOLD);
    }
  }, [gps.position.z, lastFloorZ]);

  // Recording logic
  useEffect(() => {
    if (!recording || !gps.isActive) return;

    const pos = gps.position;
    if (lastPoint) {
      const d = dist3d(lastPoint, pos as Coordinates);
      if (d < MIN_POINT_DIST) return;
      setTotalDistance(prev => prev + d);
    }

    const newPoint: PathPoint = { x: pos.x, y: pos.y, z: pos.z };
    setRecPoints(prev => [...prev, newPoint]);
    setLastPoint(newPoint);

    // Check proximity to nodes
    nodes.forEach(node => {
      if (node.floor !== currentFloor) return;
      const d = dist2d(node, pos as Coordinates);
      if (d <= NODE_PROXIMITY && !recConnectedNodes.includes(node.id)) {
        setRecConnectedNodes(prev => [...prev, node.id]);
        showToast(`✓ "${node.name}"`);
      }
    });
  }, [gps.position, recording, gps.isActive, nodes, currentFloor, lastPoint, recConnectedNodes]);

  const toggleGPS = (): void => {
    if (gps.isActive) {
      gps.stopGPS();
      if (recording) stopRecording();
    } else {
      gps.startGPS();
    }
  };

  const toggleRecording = (): void => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = (): void => {
    setRecording(true);
    setRecPoints([]);
    setRecConnectedNodes([]);
    setLastPoint(null);
    showToast('🔴 Recording...');
  };

  const stopRecording = (): void => {
    setRecording(false);
    createEdges();
    showToast(`Saved: ${recPoints.length} pts, ${recConnectedNodes.length} nodes`);
    setRecPoints([]);
    setRecConnectedNodes([]);
  };

  const createEdges = (): void => {
    if (recConnectedNodes.length < 2 || recPoints.length < 2) return;

    const newEdges: MapEdge[] = [];
    for (let i = 0; i < recConnectedNodes.length - 1; i++) {
      const fromId = recConnectedNodes[i];
      const toId = recConnectedNodes[i + 1];

      // Check if edge exists
      if (edges.some(e => 
        (e.from === fromId && e.to === toId) ||
        (e.from === toId && e.to === fromId)
      )) continue;

      const fromNode = nodes.find(n => n.id === fromId);
      const toNode = nodes.find(n => n.id === toId);
      if (!fromNode || !toNode) continue;

      // Calculate path distance
      let pathDist = 0;
      for (let j = 1; j < recPoints.length; j++) {
        pathDist += dist3d(recPoints[j-1], recPoints[j]);
      }

      newEdges.push({
        id: generateId('E'),
        from: fromId,
        to: toId,
        floor: currentFloor,
        distance: Math.round(pathDist * 10) / 10,
        points: recPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
        isVertical: false
      });
    }

    setEdges(prev => [...prev, ...newEdges]);
  };

  const addNode = (): void => {
    if (!nodeForm.name.trim()) {
      showToast('Enter a name');
      return;
    }

    const node: MapNode = {
      id: generateId('N'),
      name: nodeForm.name.trim(),
      type: nodeForm.type,
      aliases: nodeForm.aliases.split(',').map(s => s.trim()).filter(Boolean),
      x: gps.position.x,
      y: gps.position.y,
      z: gps.position.z,
      floor: currentFloor,
      lat: gps.position.lat,
      lng: gps.position.lng
    };

    setNodes(prev => [...prev, node]);

    // Auto-connect vertical nodes
    if (node.type === 'stairs' || node.type === 'lift') {
      autoConnectVertical(node);
    }

    // Add to current recording
    if (recording && !recConnectedNodes.includes(node.id)) {
      setRecConnectedNodes(prev => [...prev, node.id]);
    }

    setShowModal(false);
    setNodeForm({ name: '', type: 'room', aliases: '' });
    showToast(`✓ "${node.name}" added`);
  };

  const autoConnectVertical = (newNode: MapNode): void => {
    const matches = nodes.filter(n => 
      n.id !== newNode.id &&
      n.name.toLowerCase() === newNode.name.toLowerCase() &&
      (n.type === 'stairs' || n.type === 'lift') &&
      n.floor !== newNode.floor
    );

    const newEdges: MapEdge[] = [];
    matches.forEach(match => {
      const exists = edges.some(e =>
        (e.from === newNode.id && e.to === match.id) ||
        (e.from === match.id && e.to === newNode.id)
      );
      if (exists) return;

      const floorDiff = Math.abs(newNode.floor - match.floor);
      const vertDist = floorDiff * FLOOR_HEIGHT;

      newEdges.push({
        id: generateId('EV'),
        from: match.id,
        to: newNode.id,
        floor: null,
        distance: vertDist,
        points: [
          { x: match.x, y: match.y, z: match.z },
          { x: newNode.x, y: newNode.y, z: newNode.z }
        ],
        isVertical: true,
        fromFloor: match.floor,
        toFloor: newNode.floor
      });

      showToast(`🔗 Vertical: "${newNode.name}" L${match.floor}↔L${newNode.floor}`);
    });

    setEdges(prev => [...prev, ...newEdges]);
  };

  const changeFloor = (floor: number): void => {
    setCurrentFloor(floor);
    setLastFloorZ(gps.position.z);
    setShowFloorHint(false);
  };

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
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, W, H);

    // Grid
    const gridSize = Math.max(25, 50 / scale * 4);
    ctx.strokeStyle = '#30363d';
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

    // Origin
    ctx.strokeStyle = '#484f58';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Edges
    edges.filter(e => e.floor === currentFloor || e.isVertical).forEach(edge => {
      if (edge.points.length < 2) return;
      
      ctx.strokeStyle = edge.isVertical ? '#f59e0b' : '#8b5cf6';
      ctx.lineWidth = edge.isVertical ? 2 : 3;
      ctx.setLineDash(edge.isVertical ? [4, 4] : []);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + edge.points[0].x * scale, cy - edge.points[0].y * scale);
      edge.points.forEach(p => {
        ctx.lineTo(cx + p.x * scale, cy - p.y * scale);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Recording path
    if (recording && recPoints.length > 1) {
      ctx.strokeStyle = '#f85149';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cx + recPoints[0].x * scale, cy - recPoints[0].y * scale);
      recPoints.forEach(p => {
        ctx.lineTo(cx + p.x * scale, cy - p.y * scale);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Nodes
    nodes.filter(n => n.floor === currentFloor).forEach(node => {
      const px = cx + node.x * scale;
      const py = cy - node.y * scale;
      
      if (px < -20 || px > W + 20 || py < -20 || py > H + 20) return;
      
      const isVert = node.type === 'stairs' || node.type === 'lift';
      const isConnected = recConnectedNodes.includes(node.id);

      ctx.fillStyle = isConnected ? '#fbbf24' : (isVert ? '#f59e0b' : '#3fb950');
      ctx.beginPath();
      ctx.arc(px, py, isConnected ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (scale >= 2) {
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.min(12, 8 + scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.name.slice(0, 12), px, py + 16 + scale);
      }
    });

    // Current position
    const px = cx + gps.position.x * scale;
    const py = cy - gps.position.y * scale;

    ctx.fillStyle = '#58a6ff';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Proximity circle
    ctx.strokeStyle = 'rgba(88, 166, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, NODE_PROXIMITY * scale, 0, Math.PI * 2);
    ctx.stroke();
  }, [view, gps.position, nodes, edges, currentFloor, recording, recPoints, recConnectedNodes]);

  const zoomIn = (): void => setView(v => ({ ...v, scale: Math.min(20, v.scale * 1.5) }));
  const zoomOut = (): void => setView(v => ({ ...v, scale: Math.max(1, v.scale / 1.5) }));
  const resetView = (): void => setView(v => ({ ...v, scale: 4, panX: 0, panY: 0 }));
  const centerOnMe = (): void => setView(v => ({ 
    ...v, 
    panX: -gps.position.x * v.scale, 
    panY: gps.position.y * v.scale 
  }));

  const handleSaveMap = (): void => {
    const mapName = prompt('Enter map name:');
    if (!mapName) return;

    const mapData = {
      metadata: {
        building: mapName,
        createdAt: new Date().toISOString(),
        origin: gps.origin,
        stats: {
          nodes: nodes.length,
          edges: edges.length,
          verticalEdges: edges.filter(e => e.isVertical).length,
          totalDistance: Math.round(totalDistance)
        }
      },
      nodes: nodes,
      edges,
      graph: buildGraph()
    };

    onSave(mapName, mapData);
    showToast(`✓ Map "${mapName}" saved!`);
  };

  const buildGraph = (): Graph => {
    const graph: Graph = {};
    nodes.forEach(n => graph[n.id] = []);
    
    edges.forEach(e => {
      graph[e.from]?.push({ node: e.to, weight: e.distance, vertical: e.isVertical });
      graph[e.to]?.push({ node: e.from, weight: e.distance, vertical: e.isVertical });
    });

    return graph;
  };

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
    <div className="h-full flex flex-col bg-dark-900">
      {/* Recording Banner */}
      {recording && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-black py-3 px-4 text-center font-semibold text-sm">
          ⏺ Recording path... Walk near nodes to connect!
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <canvas 
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button onClick={zoomIn} className="bg-white/90 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition shadow-lg">
            <ZoomIn size={20} color="black" />
          </button>
          <button onClick={zoomOut} className="bg-white/90 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition shadow-lg">
            <ZoomOut size={20} color="black" />
          </button>
          <button onClick={resetView} className="bg-white/90 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition shadow-lg">
            <Home size={20} color="black" />
          </button>
          <button onClick={centerOnMe} className="bg-white/90 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition shadow-lg">
            <Target size={20} color="black" />
          </button>
        </div>

        {/* GPS Info */}
        <div className="absolute top-4 left-4 glass rounded-lg p-3 text-xs font-mono space-y-1">
          <div><span className="text-gray-400">X:</span> <span className="text-blue-400">{gps.position.x.toFixed(1)}m</span></div>
          <div><span className="text-gray-400">Y:</span> <span className="text-blue-400">{gps.position.y.toFixed(1)}m</span></div>
          <div><span className="text-gray-400">Z:</span> <span className="text-orange-400">{gps.position.z.toFixed(1)}m</span></div>
          <div><span className="text-gray-400">Floor:</span> <span className="text-blue-400">{currentFloor}</span></div>
        </div>
      </div>

      {/* Floor Tabs */}
      <div className="flex gap-2 px-4 py-3 bg-dark-800 border-t border-dark-700">
        {FLOORS.map(f => {
          const count = nodes.filter(n => n.floor === f).length;
          const label = f === -1 ? 'B1' : `L${f}`;
          return (
            <button
              key={f}
              onClick={() => changeFloor(f)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                currentFloor === f
                  ? 'bg-white text-black'
                  : 'bg-gray-600 text-black hover:bg-gray-400'
              }`}
            >
              {label}
              <span className="ml-1 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Z Indicator */}
      {showFloorHint && (
        <div className="mx-4 my-3 p-3 bg-orange-500/10 border border-orange-500 rounded-lg text-sm text-orange-400">
          ⬆️ Altitude changed! Consider updating floor.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 px-4 py-3 bg-dark-800 border-t border-dark-700">
        <div className="glass rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{nodes.length}</div>
          <div className="text-xs text-gray-400 uppercase mt-1">Nodes</div>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{edges.length}</div>
          <div className="text-xs text-gray-400 uppercase mt-1">Edges</div>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{verticalEdges.length}</div>
          <div className="text-xs text-gray-400 uppercase mt-1">Vertical</div>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{Math.round(totalDistance)}</div>
          <div className="text-xs text-gray-400 uppercase mt-1">Meters</div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-dark-900 border-t border-dark-700">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={toggleGPS}
            className={`py-3 px-4 rounded-lg font-semibold text-sm transition ${
              gps.isActive
                ? 'bg-red-600 hover:bg-red-700 text-black'
                : 'bg-green-600 hover:bg-green-400 text-black'
            }`}
          >
            <Navigation className="inline mr-2" size={16} />
            {gps.isActive ? 'Stop GPS' : 'Start GPS'}
          </button>
          <button
            onClick={toggleRecording}
            disabled={!gps.isActive}
            className={`py-3 px-4 rounded-lg font-semibold text-sm transition disabled:opacity-40 ${
              recording
                ? 'bg-red-600 hover:bg-red-700 text-black'
                : 'bg-purple-600 hover:bg-purple-700 text-black'
            }`}
          >
            {recording ? <StopIcon className="inline mr-2" size={16} /> : <Play className="inline mr-2" size={16} />}
            {recording ? 'Stop' : 'Record'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={!gps.isActive}
            className="py-3 px-4 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-black transition disabled:opacity-40"
          >
            <MapPin className="inline mr-2" size={16} />
            Add Node
          </button>
        </div>
        <button
          onClick={handleSaveMap}
          className="w-full mt-2 py-3 px-4 rounded-lg font-semibold text-sm bg-gray-400 hover:bg-gray-600 text-black transition"
        >
          <Save className="inline mr-2" size={16} />
          Save Map
        </button>
      </div>

      {/* Node Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 w-full max-w-md border border-dark-700">
            <h2 className="text-xl font-bold mb-4">Add Node</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">Name / Room Code</label>
                <input
                  type="text"
                  value={nodeForm.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNodeForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. E1A-03-01, Staircase A"
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">Type</label>
                <select
                  value={nodeForm.type}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setNodeForm(f => ({ ...f, type: e.target.value as NodeType }))}
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="room">Room</option>
                  <option value="junction">Junction</option>
                  <option value="stairs">🔺 Stairs</option>
                  <option value="lift">🔺 Lift</option>
                  <option value="entrance">Entrance</option>
                  <option value="toilet">Toilet</option>
                  <option value="other">Other</option>
                </select>
                {(nodeForm.type === 'stairs' || nodeForm.type === 'lift') && (
                  <p className="text-xs text-orange-400 mt-2">
                    ⚡ <strong>Tip:</strong> Use the same name on different floors to auto-connect vertically!
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">Aliases (comma separated)</label>
                <input
                  type="text"
                  value={nodeForm.aliases}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNodeForm(f => ({ ...f, aliases: e.target.value }))}
                  placeholder="e.g. LT1, Main Stairs"
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 px-4 rounded-lg font-semibold text-sm bg-gray-600 hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={addNode}
                className="flex-1 py-3 px-4 rounded-lg font-semibold text-sm bg-green-600 hover:bg-green-700 text-black transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 glass rounded-lg px-6 py-3 text-sm font-medium z-50 animate-fade-in">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Mapper;