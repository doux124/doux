import type { Coordinates, Origin, Graph, MapNode, DijkstraResult, PathResult } from './types';

// Distance calculations
export const dist2d = (a: Coordinates, b: Coordinates): number => {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
};

export const dist3d = (a: Coordinates, b: Coordinates): number => {
  return Math.sqrt(
    (b.x - a.x) ** 2 + 
    (b.y - a.y) ** 2 + 
    ((b.z || 0) - (a.z || 0)) ** 2
  );
};

// Convert GPS to local coordinates
export const toLocal = (
  lat: number, 
  lng: number, 
  alt: number | null, 
  origin: Origin | null
): Coordinates => {
  if (!origin) return { x: 0, y: 0, z: 0 };
  const dLat = lat - origin.lat;
  const dLng = lng - origin.lng;
  const y = dLat * 111320;
  const x = dLng * 111320 * Math.cos(origin.lat * Math.PI / 180);
  const z = (alt || 0) - (origin.alt || 0);
  return { x, y, z };
};

// Dijkstra's algorithm for pathfinding
export const dijkstra = (graph: Graph, startId: string, endId: string): DijkstraResult => {
  const distances: { [key: string]: number } = {};
  const previous: { [key: string]: string | null } = {};
  const unvisited = new Set<string>();

  // Initialize
  Object.keys(graph).forEach(nodeId => {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
    unvisited.add(nodeId);
  });
  distances[startId] = 0;

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let currentNode: string | null = null;
    let minDistance = Infinity;
    unvisited.forEach(nodeId => {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentNode = nodeId;
      }
    });

    if (currentNode === null || currentNode === endId) break;

    unvisited.delete(currentNode);

    // Update distances to neighbors
    const neighbors = graph[currentNode] || [];
    neighbors.forEach(({ node, weight }) => {
      const altDistance = distances[currentNode!] + weight;
      if (altDistance < distances[node]) {
        distances[node] = altDistance;
        previous[node] = currentNode;
      }
    });
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = endId;
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return {
    path: path[0] === startId ? path : [],
    distance: distances[endId]
  };
};

// Find K shortest paths using Yen's algorithm (simplified version)
export const findKShortestPaths = (
  graph: Graph, 
  nodes: { [id: string]: MapNode }, 
  startId: string, 
  endId: string, 
  k: number = 3
): PathResult[] => {
  const paths: PathResult[] = [];
  
  // First shortest path
  const firstPath = dijkstra(graph, startId, endId);
  if (firstPath.path.length === 0) return [];
  
  paths.push({
    path: firstPath.path,
    distance: firstPath.distance,
    nodes: firstPath.path.map(id => nodes[id])
  });

  // Find alternative paths by temporarily removing edges
  for (let i = 1; i < k; i++) {
    let bestAltPath: DijkstraResult | null = null;
    let bestAltDistance = Infinity;

    // Try removing each edge from the previous shortest paths
    for (const existingPath of paths) {
      for (let j = 0; j < existingPath.path.length - 1; j++) {
        const modifiedGraph: Graph = JSON.parse(JSON.stringify(graph));
        
        // Remove edge
        const fromNode = existingPath.path[j];
        const toNode = existingPath.path[j + 1];
        modifiedGraph[fromNode] = modifiedGraph[fromNode].filter(
          edge => edge.node !== toNode
        );
        modifiedGraph[toNode] = modifiedGraph[toNode].filter(
          edge => edge.node !== fromNode
        );

        // Find alternative path
        const altPath = dijkstra(modifiedGraph, startId, endId);
        if (altPath.path.length > 0 && altPath.distance < bestAltDistance) {
          // Check if this path is different from existing paths
          const pathStr = altPath.path.join('-');
          const isDifferent = !paths.some(p => p.path.join('-') === pathStr);
          
          if (isDifferent) {
            bestAltPath = altPath;
            bestAltDistance = altPath.distance;
          }
        }
      }
    }

    if (bestAltPath) {
      paths.push({
        path: bestAltPath.path,
        distance: bestAltPath.distance,
        nodes: bestAltPath.path.map(id => nodes[id])
      });
    } else {
      break; // No more alternative paths found
    }
  }

  return paths;
};

// Format distance for display
export const formatDistance = (meters: number): string => {
  if (meters < 1) return `${Math.round(meters * 100)} cm`;
  return `${meters.toFixed(1)} m`;
};

// Format duration estimate (assuming 1.4 m/s walking speed)
export const formatDuration = (meters: number): string => {
  const seconds = meters / 1.4;
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

// Generate unique ID
export const generateId = (prefix: string = 'N'): string => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Storage helpers
export const STORAGE_KEY = 'cde-maps';

export const saveMaps = (maps: { [key: string]: unknown }): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
    return true;
  } catch (error) {
    console.error('Failed to save maps:', error);
    return false;
  }
};

export const loadMaps = (): { [key: string]: unknown } => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load maps:', error);
    return {};
  }
};

export const deleteMap = (mapName: string): void => {
  const maps = loadMaps();
  delete maps[mapName];
  saveMaps(maps);
};

export const getMapNames = (): string[] => {
  const maps = loadMaps();
  return Object.keys(maps).sort();
};