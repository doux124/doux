import React, { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Upload, Download, Trash2, FolderOpen, HardDrive, FileJson, X, AlertCircle } from 'lucide-react';
import { storageUtils } from '../utils/storage';
import type { StorageProps, MapData, SavedMapInfo, MapNode, MapEdge, ExportedMapData, ExportedNode } from '../utils/types';

const Storage: React.FC<StorageProps> = ({ onLoadMap }) => {
  const [maps, setMaps] = useState<SavedMapInfo[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = (): void => {
    setMaps(storageUtils.getMapsList());
  };

  const deleteMap = (mapName: string): void => {
    storageUtils.deleteMap(mapName);
    loadMaps();
    setShowDeleteConfirm(null);
  };

  const exportMap = (mapName: string): void => {
    const map = storageUtils.loadMap(mapName);
    if (!map) return;

    const nodesArray: MapNode[] = Array.isArray(map.nodes) ? map.nodes : Object.values(map.nodes || {});

    const data: ExportedMapData = {
      metadata: {
        building: map.name || mapName,
        exportedAt: new Date().toISOString(),
        origin: map.metadata?.origin || undefined,
        floorHeight: 4,
        stats: {
          nodes: nodesArray.length,
          edges: map.edges?.length || 0,
          verticalEdges: map.edges?.filter(e => e.isVertical).length || 0,
          totalDistance: Math.round(map.metadata?.stats?.totalDistance || 0)
        }
      },
      nodes: {},
      edges: [],
      graph: {}
    };

    nodesArray.forEach(n => {
      data.nodes[n.id] = {
        name: n.name,
        type: n.type,
        aliases: n.aliases,
        floor: n.floor,
        coordinates: { x: n.x, y: n.y, z: n.z },
        gps: { lat: n.lat, lng: n.lng },
        connections: []
      };
      data.graph[n.id] = [];
    });

    (map.edges || []).forEach(e => {
      data.edges.push({
        id: e.id,
        from: e.from,
        to: e.to,
        distance: e.distance,
        isVertical: e.isVertical,
        floor: e.isVertical ? null : e.floor,
        fromFloor: e.fromFloor,
        toFloor: e.toFloor,
        pathPoints: e.points,
        points: e.points
      });

      if (data.nodes[e.from]) {
        data.nodes[e.from].connections.push({
          to: e.to,
          distance: e.distance,
          isVertical: e.isVertical
        });
        data.graph[e.from].push({
          node: e.to,
          weight: e.distance,
          vertical: e.isVertical
        });
      }
      if (data.nodes[e.to]) {
        data.nodes[e.to].connections.push({
          to: e.from,
          distance: e.distance,
          isVertical: e.isVertical
        });
        data.graph[e.to].push({
          node: e.from,
          weight: e.distance,
          vertical: e.isVertical
        });
      }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapName}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadMap = (mapName: string): void => {
    const map = storageUtils.loadMap(mapName);
    if (map && onLoadMap) {
      onLoadMap(map);
    }
  };

  const processImportedFile = (file: File): void => {
    setImportError('');
    setImportSuccess('');

    if (!file.name.endsWith('.json')) {
      setImportError('Please upload a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          setImportError('Failed to read file');
          return;
        }
        
        const data = JSON.parse(result) as Partial<ExportedMapData & MapData>;
        
        // Validate the imported data
        if (!data.nodes && !data.edges && !data.metadata) {
          setImportError('Invalid map format: missing nodes, edges, or metadata');
          return;
        }

        // Extract map name
        let mapName = data.metadata?.building || 
                      file.name.replace('.json', '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
        
        // Check if name already exists and append number if needed
        const existingMaps = storageUtils.getMapsList();
        let finalName = mapName;
        let counter = 1;
        while (existingMaps.some(m => m.name === finalName)) {
          finalName = `${mapName} (${counter})`;
          counter++;
        }

        // Convert nodes from object format to array if needed
        let nodesArray: MapNode[] = [];
        if (data.nodes) {
          if (Array.isArray(data.nodes)) {
            nodesArray = data.nodes as MapNode[];
          } else {
            // Convert object format { id: nodeData } to array
            nodesArray = Object.entries(data.nodes as { [id: string]: ExportedNode }).map(([id, node]) => ({
              id,
              name: node.name,
              type: node.type,
              aliases: node.aliases || [],
              floor: node.floor,
              x: node.coordinates?.x ?? 0,
              y: node.coordinates?.y ?? 0,
              z: node.coordinates?.z ?? 0,
              lat: node.gps?.lat ?? null,
              lng: node.gps?.lng ?? null,
            }));
          }
        }

        // Convert edges, handling pathPoints vs points
        const edgesArray: MapEdge[] = (data.edges || []).map(e => ({
          ...e,
          points: e.pathPoints || e.points || []
        }));

        // Build the map data structure
        const mapData: MapData = {
          name: finalName,
          nodes: nodesArray,
          edges: edgesArray,
          graph: data.graph || {},
          metadata: {
            ...data.metadata,
            importedAt: new Date().toISOString(),
            originalFile: file.name
          },
          savedAt: new Date().toISOString()
        };

        // Save to storage
        storageUtils.saveMap(finalName, mapData);
        loadMaps();
        
        setImportSuccess(`Successfully imported "${finalName}" with ${nodesArray.length} nodes and ${edgesArray.length} edges`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setImportSuccess(''), 5000);
        
      } catch (err) {
        console.error('Import error:', err);
        setImportError(`Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read file');
    };

    reader.readAsText(file);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      processImportedFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0b]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white/90">Storage</h2>
            <p className="text-xs text-white/40 mt-0.5">Manage your saved maps</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-white/50 mr-2">
              <div className="flex items-center gap-1.5">
                <HardDrive size={14} />
                <span><span className="font-semibold text-white/70">{maps.length}</span> map{maps.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="px-2 py-1 bg-white/[0.05] rounded-md">
                <span className="font-mono">{storageUtils.getStorageSize()}</span> KB
              </div>
            </div>
            
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Upload size={16} />
              Import JSON
            </button>
          </div>
        </div>

        {/* Import Messages */}
        {importError && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{importError}</p>
            <button onClick={() => setImportError('')} className="ml-auto">
              <X size={14} className="text-red-400/60 hover:text-red-400" />
            </button>
          </div>
        )}
        
        {importSuccess && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <FileJson size={14} className="text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-400">{importSuccess}</p>
            <button onClick={() => setImportSuccess('')} className="ml-auto">
              <X size={14} className="text-emerald-400/60 hover:text-emerald-400" />
            </button>
          </div>
        )}
      </div>



      {/* Maps List */}
      <div className="flex-1 overflow-y-auto p-6">
        {maps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4">
              <FolderOpen size={28} className="text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white/80 mb-2">No Saved Maps</h3>
            <p className="text-sm text-white/40 max-w-xs mb-4">
              Create maps in the Mapper tab or import JSON files
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 rounded-lg text-sm font-medium transition-colors"
            >
              <Upload size={16} />
              Import your first map
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {maps.map(map => {
              const mapData = storageUtils.loadMap(map.name);
              const nodesArray: MapNode[] = Array.isArray(mapData?.nodes) ? mapData.nodes as MapNode[] : Object.values(mapData?.nodes || {});
              const nodeCount = nodesArray.length;
              const edgeCount = mapData?.edges?.length || 0;
              const vertCount = mapData?.edges?.filter(e => e.isVertical).length || 0;

              return (
                <div
                  key={map.name}
                  className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-white/90 truncate">{map.name}</h3>
                      <p className="text-[10px] text-white/40 mt-1">
                        {new Date(map.savedAt).toLocaleDateString()} at{' '}
                        {new Date(map.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <FileJson size={14} className="text-emerald-400" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { value: nodeCount, label: 'Nodes', color: 'text-blue-400' },
                      { value: edgeCount, label: 'Edges', color: 'text-emerald-400' },
                      { value: vertCount, label: 'Vertical', color: 'text-amber-400' },
                    ].map(({ value, label, color }) => (
                      <div key={label} className="text-center py-2 bg-white/[0.03] rounded-lg">
                        <div className={`text-sm font-bold ${color}`}>{value}</div>
                        <div className="text-[9px] text-white/40 uppercase tracking-wide">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleLoadMap(map.name)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <FolderOpen size={12} />
                      Load
                    </button>
                    <button
                      onClick={() => exportMap(map.name)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <Download size={12} />
                      Export
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(map.name)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#141416] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white/90">Delete Map?</h2>
            </div>
            <p className="text-sm text-white/50 mb-6">
              Are you sure you want to delete "<span className="font-medium text-white/80">{showDeleteConfirm}</span>"?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMap(showDeleteConfirm)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="px-6 py-4 border-t border-white/[0.06]">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-xs text-white/50">
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <b className="text-white/60">Load</b> opens maps in the Mapper for editing
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <b className="text-white/60">Export</b> downloads maps as JSON files
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/30" />
              Maps are stored in browser localStorage
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Storage;