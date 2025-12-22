import type { MapData, MapNode, MapEdge } from './types';

// Sample data for testing
export const sampleMap: MapData = {
  name: "Sample Building",
  metadata: {
    origin: { lat: 1.3521, lng: 103.8198, alt: 0 },
    stats: {
      totalDistance: 59
    }
  },
  nodes: [
    {
      id: "N1",
      name: "Main Entrance",
      type: "entrance",
      aliases: ["Entry"],
      x: 0,
      y: 0,
      z: 0,
      floor: 1,
      lat: 1.3521,
      lng: 103.8198
    },
    {
      id: "N2",
      name: "Lobby Junction",
      type: "junction",
      aliases: [],
      x: 15,
      y: 0,
      z: 0,
      floor: 1,
      lat: 1.3522,
      lng: 103.8198
    },
    {
      id: "N3",
      name: "Staircase A",
      type: "stairs",
      aliases: ["Stairs A"],
      x: 15,
      y: 10,
      z: 0,
      floor: 1,
      lat: 1.3522,
      lng: 103.8199
    },
    {
      id: "N4",
      name: "Room E1-01",
      type: "room",
      aliases: ["101"],
      x: 23,
      y: 0,
      z: 0,
      floor: 1,
      lat: 1.3523,
      lng: 103.8198
    },
    {
      id: "N5",
      name: "Staircase A",
      type: "stairs",
      aliases: ["Stairs A"],
      x: 15,
      y: 10,
      z: 4,
      floor: 2,
      lat: 1.3522,
      lng: 103.8199
    },
    {
      id: "N6",
      name: "Room E2-01",
      type: "room",
      aliases: ["201"],
      x: 27,
      y: 10,
      z: 4,
      floor: 2,
      lat: 1.3523,
      lng: 103.8199
    },
    {
      id: "N7",
      name: "Lift A",
      type: "lift",
      aliases: ["Elevator A"],
      x: 15,
      y: -10,
      z: 0,
      floor: 1,
      lat: 1.3522,
      lng: 103.8197
    },
    {
      id: "N8",
      name: "Lift A",
      type: "lift",
      aliases: ["Elevator A"],
      x: 15,
      y: -10,
      z: 4,
      floor: 2,
      lat: 1.3522,
      lng: 103.8197
    }
  ] as MapNode[],
  edges: [
    {
      id: "E1",
      from: "N1",
      to: "N2",
      floor: 1,
      distance: 15,
      isVertical: false,
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 15, y: 0, z: 0 }
      ]
    },
    {
      id: "E2",
      from: "N2",
      to: "N3",
      floor: 1,
      distance: 10,
      isVertical: false,
      points: [
        { x: 15, y: 0, z: 0 },
        { x: 15, y: 10, z: 0 }
      ]
    },
    {
      id: "E3",
      from: "N2",
      to: "N4",
      floor: 1,
      distance: 8,
      isVertical: false,
      points: [
        { x: 15, y: 0, z: 0 },
        { x: 23, y: 0, z: 0 }
      ]
    },
    {
      id: "E4",
      from: "N3",
      to: "N5",
      floor: null,
      distance: 4,
      isVertical: true,
      fromFloor: 1,
      toFloor: 2,
      points: [
        { x: 15, y: 10, z: 0 },
        { x: 15, y: 10, z: 4 }
      ]
    },
    {
      id: "E5",
      from: "N5",
      to: "N6",
      floor: 2,
      distance: 12,
      isVertical: false,
      points: [
        { x: 15, y: 10, z: 4 },
        { x: 27, y: 10, z: 4 }
      ]
    },
    {
      id: "E6",
      from: "N2",
      to: "N7",
      floor: 1,
      distance: 10,
      isVertical: false,
      points: [
        { x: 15, y: 0, z: 0 },
        { x: 15, y: -10, z: 0 }
      ]
    },
    {
      id: "E7",
      from: "N7",
      to: "N8",
      floor: null,
      distance: 4,
      isVertical: true,
      fromFloor: 1,
      toFloor: 2,
      points: [
        { x: 15, y: -10, z: 0 },
        { x: 15, y: -10, z: 4 }
      ]
    }
  ] as MapEdge[]
};

// Function to load sample data into storage
export function loadSampleData(): MapData {
  // Dynamic import to avoid circular dependencies
  import('../utils/storage').then(({ storageUtils }) => {
    storageUtils.saveMap('Sample Building', sampleMap);
  });
  return sampleMap;
}