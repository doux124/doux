import type { MapData, SavedMapInfo } from './types';

// Storage utilities for managing maps
const STORAGE_KEY_PREFIX = 'cde_map_';
const MAPS_LIST_KEY = 'cde_maps_list';

export const storageUtils = {
  // Get list of all saved maps
  getMapsList(): SavedMapInfo[] {
    try {
      const list = localStorage.getItem(MAPS_LIST_KEY);
      return list ? JSON.parse(list) : [];
    } catch {
      // Unavailable or corrupt localStorage — treat as empty rather than crashing.
      return [];
    }
  },

  // Save map list
  saveMapsList(list: SavedMapInfo[]): void {
    try {
      localStorage.setItem(MAPS_LIST_KEY, JSON.stringify(list));
    } catch {
      /* quota exceeded or unavailable — ignore */
    }
  },

  // Save a map. Returns false if the write failed (e.g. quota exceeded).
  saveMap(mapName: string, mapData: MapData): boolean {
    const key = STORAGE_KEY_PREFIX + mapName;
    const data: MapData = {
      ...mapData,
      name: mapName,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      return false;
    }

    // Update maps list
    const list = this.getMapsList();
    const existingMap = list.find(m => m.name === mapName);
    if (!existingMap) {
      list.push({ name: mapName, savedAt: data.savedAt! });
      this.saveMapsList(list);
    } else {
      // Update timestamp
      existingMap.savedAt = data.savedAt!;
      this.saveMapsList(list);
    }
    return true;
  },

  // Load a map
  loadMap(mapName: string): MapData | null {
    const key = STORAGE_KEY_PREFIX + mapName;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Delete a map
  deleteMap(mapName: string): void {
    const key = STORAGE_KEY_PREFIX + mapName;
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }

    // Update maps list
    const list = this.getMapsList();
    const filtered = list.filter(m => m.name !== mapName);
    this.saveMapsList(filtered);
  },

  // Get storage size in KB
  getStorageSize(): string {
    let total = 0;
    try {
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += localStorage[key].length + key.length;
        }
      }
    } catch {
      return '0.0';
    }
    return (total / 1024).toFixed(1);
  }
};
