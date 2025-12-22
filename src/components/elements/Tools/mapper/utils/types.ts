// Coordinate types
export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface GPSCoordinates {
  lat: number | null;
  lng: number | null;
}

// Node types
export type NodeType = 'room' | 'junction' | 'stairs' | 'lift' | 'entrance' | 'toilet' | 'other';

export interface MapNode {
  id: string;
  name: string;
  type: NodeType;
  aliases: string[];
  x: number;
  y: number;
  z: number;
  floor: number;
  lat: number | null;
  lng: number | null;
  coordinates?: Coordinates;
  gps?: GPSCoordinates;
  connections?: Connection[];
}

export interface Connection {
  to: string;
  distance: number;
  isVertical: boolean;
}

// Edge types
export interface PathPoint {
  x: number;
  y: number;
  z: number;
}

export interface MapEdge {
  id: string;
  from: string;
  to: string;
  floor: number | null;
  distance: number;
  isVertical: boolean;
  fromFloor?: number;
  toFloor?: number;
  points: PathPoint[];
  pathPoints?: PathPoint[];
}

// Graph types
export interface GraphEdge {
  node: string;
  weight: number;
  vertical?: boolean;
}

export interface Graph {
  [nodeId: string]: GraphEdge[];
}

// Map data types
export interface MapMetadata {
  building?: string;
  createdAt?: string;
  exportedAt?: string;
  importedAt?: string;
  originalFile?: string;
  origin?: Origin | null;
  floorHeight?: number;
  stats?: MapStats;
}

export interface MapStats {
  nodes?: number;
  edges?: number;
  verticalEdges?: number;
  totalDistance?: number;
}

export interface Origin {
  lat: number;
  lng: number;
  alt: number;
}

export interface MapData {
  name?: string;
  metadata?: MapMetadata;
  nodes: MapNode[] | { [id: string]: MapNode };
  edges: MapEdge[];
  graph?: Graph;
  origin?: Origin;
  savedAt?: string;
}

export interface SavedMapInfo {
  name: string;
  savedAt: string;
}

// GPS state types
export interface GPSPosition {
  x: number;
  y: number;
  z: number;
  lat: number | null;
  lng: number | null;
  alt: number | null;
  accuracy: number | null;
}

export interface GPSState {
  isActive: boolean;
  position: GPSPosition;
  origin: Origin | null;
  error: string | null;
  watchId: number | null;
}

export interface UseGPSReturn extends GPSState {
  startGPS: () => void;
  stopGPS: () => void;
}

// View state types
export interface ViewState {
  scale: number;
  panX: number;
  panY: number;
  isPanning: boolean;
  lastX: number;
  lastY: number;
}

// Path types
export interface PathResult {
  path: string[];
  distance: number;
  nodes?: MapNode[];
}

export interface DijkstraResult {
  path: string[];
  distance: number;
}

// Component props types
export interface MapperProps {
  onSave: (mapName: string, mapData: MapData) => void;
  loadedMap: MapData | null;
}

export interface StorageProps {
  onLoadMap: (map: MapData) => void;
}

export interface VisualizerProps {
  selectedMap?: string | null;
  onMapSelected?: (mapName: string) => void;
}

export interface PathfindingProps {
  selectedMap?: string | null;
  onMapSelected?: (mapName: string) => void;
}

// Form types
export interface NodeForm {
  name: string;
  type: NodeType;
  aliases: string;
}

// Toast types
export interface ToastState {
  show: boolean;
  message: string;
}

// Tab types
export interface Tab {
  id: string;
  label: string;
  icon: string;
}

// Export format types (for JSON export)
export interface ExportedNode {
  name: string;
  type: NodeType;
  aliases: string[];
  floor: number;
  coordinates: Coordinates;
  gps: GPSCoordinates;
  connections: Connection[];
}

export interface ExportedMapData {
  metadata: MapMetadata;
  nodes: { [id: string]: ExportedNode };
  edges: MapEdge[];
  graph: Graph;
}