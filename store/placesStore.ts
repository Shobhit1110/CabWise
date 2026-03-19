import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LatLng } from '../types';

const PLACES_KEY = 'cabwise_saved_places';

export interface SavedPlace {
  id: string;
  label: string;
  type: 'home' | 'work' | 'custom';
  location: LatLng;
  address: string;
}

interface PlacesStore {
  places: SavedPlace[];
  loaded: boolean;
  loadPlaces: () => void;
  addPlace: (place: Omit<SavedPlace, 'id'>) => void;
  removePlace: (id: string) => void;
  updatePlace: (id: string, updates: Partial<Omit<SavedPlace, 'id'>>) => void;
}

function generateId() {
  return `place_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function persist(places: SavedPlace[]) {
  try {
    await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(places));
  } catch {
    // Storage failure — continue
  }
}

export const usePlacesStore = create<PlacesStore>((set, get) => ({
  places: [],
  loaded: false,

  loadPlaces: async () => {
    try {
      const raw = await AsyncStorage.getItem(PLACES_KEY);
      if (raw) {
        set({ places: JSON.parse(raw), loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  addPlace: (place) => {
    const newPlace: SavedPlace = { ...place, id: generateId() };
    const updated = [...get().places, newPlace];
    set({ places: updated });
    persist(updated);
  },

  removePlace: (id) => {
    const updated = get().places.filter((p) => p.id !== id);
    set({ places: updated });
    persist(updated);
  },

  updatePlace: (id, updates) => {
    const updated = get().places.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    );
    set({ places: updated });
    persist(updated);
  },
}));
