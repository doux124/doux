import type { MapData, SavedMapInfo } from './types';

// Storage utilities for managing maps
const STORAGE_KEY_PREFIX = 'cde_map_';
const MAPS_LIST_KEY = 'cde_maps_list';

export const storageUtils = {
  // Get list of all saved maps
  getMapsList(): SavedMapInfo[] {
    const list = localStorage.getItem(MAPS_LIST_KEY);
    return list ? JSON.parse(list) : [];
  },

  // Save map list
  saveMapsList(list: SavedMapInfo[]): void {
    localStorage.setItem(MAPS_LIST_KEY, JSON.stringify(list));
  },

  // Save a map
  saveMap(mapName: string, mapData: MapData): void {
    const key = STORAGE_KEY_PREFIX + mapName;
    const data: MapData = {
      ...mapData,
      name: mapName,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));

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
  },

  // Load a map
  loadMap(mapName: string): MapData | null {
    const key = STORAGE_KEY_PREFIX + mapName;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  // Delete a map
  deleteMap(mapName: string): void {
    const key = STORAGE_KEY_PREFIX + mapName;
    localStorage.removeItem(key);

    // Update maps list
    const list = this.getMapsList();
    const filtered = list.filter(m => m.name !== mapName);
    this.saveMapsList(filtered);
  },

  // Get storage size in KB
  getStorageSize(): string {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(1);
  }
};