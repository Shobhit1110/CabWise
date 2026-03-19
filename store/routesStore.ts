import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LatLng } from '../types';

const ROUTES_KEY = 'cabwise_favourite_routes';
const MAX_ROUTES = 10;

export interface FavouriteRoute {
  id: string;
  originLabel: string;
  destLabel: string;
  origin: LatLng;
  destination: LatLng;
  useCount: number;
  lastUsed: number;
}

interface RoutesStore {
  routes: FavouriteRoute[];
  loaded: boolean;
  loadRoutes: () => void;
  recordRoute: (route: Omit<FavouriteRoute, 'id' | 'useCount' | 'lastUsed'>) => void;
  removeRoute: (id: string) => void;
}

function routeKey(origin: LatLng, dest: LatLng) {
  return `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${dest.lat.toFixed(4)},${dest.lng.toFixed(4)}`;
}

async function persist(routes: FavouriteRoute[]) {
  try {
    await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
  } catch {
    // Storage failure — continue
  }
}

export const useRoutesStore = create<RoutesStore>((set, get) => ({
  routes: [],
  loaded: false,

  loadRoutes: async () => {
    try {
      const raw = await AsyncStorage.getItem(ROUTES_KEY);
      if (raw) {
        set({ routes: JSON.parse(raw), loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  recordRoute: (route) => {
    const existing = get().routes;
    const key = routeKey(route.origin, route.destination);

    const existingIdx = existing.findIndex(
      (r) => routeKey(r.origin, r.destination) === key,
    );

    let updated: FavouriteRoute[];
    if (existingIdx >= 0) {
      updated = [...existing];
      updated[existingIdx] = {
        ...updated[existingIdx],
        useCount: updated[existingIdx].useCount + 1,
        lastUsed: Date.now(),
      };
    } else {
      const newRoute: FavouriteRoute = {
        ...route,
        id: `route_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        useCount: 1,
        lastUsed: Date.now(),
      };
      updated = [newRoute, ...existing].slice(0, MAX_ROUTES);
    }

    // Sort by use count descending
    updated.sort((a, b) => b.useCount - a.useCount);
    set({ routes: updated });
    persist(updated);
  },

  removeRoute: (id) => {
    const updated = get().routes.filter((r) => r.id !== id);
    set({ routes: updated });
    persist(updated);
  },
}));
