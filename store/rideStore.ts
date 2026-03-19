import { create } from 'zustand';
import type { LatLng, Quote } from '../types';

export type Filter = 'cheapest' | 'fastest' | 'shared' | 'premium' | 'electric';

interface RideStore {
  origin: LatLng | null;
  destination: LatLng | null;
  originLabel: string;
  destLabel: string;
  selectedPickupId: string | null;
  selectedFilter: Filter;
  selectedQuote: Quote | null;
  scheduledTime: Date | null;

  setOrigin: (loc: LatLng, label: string) => void;
  setDestination: (loc: LatLng, label: string) => void;
  setPickup: (id: string | null) => void;
  setFilter: (f: Filter) => void;
  selectQuote: (q: Quote) => void;
  setScheduledTime: (time: Date | null) => void;
  reset: () => void;
}

export const useRideStore = create<RideStore>((set) => ({
  origin: null,
  destination: null,
  originLabel: '',
  destLabel: '',
  selectedPickupId: null,
  selectedFilter: 'cheapest',
  selectedQuote: null,
  scheduledTime: null,

  setOrigin: (loc, label) => set({ origin: loc, originLabel: label }),
  setDestination: (loc, label) => set({ destination: loc, destLabel: label }),
  setPickup: (id) => set({ selectedPickupId: id }),
  setFilter: (f) => set({ selectedFilter: f }),
  selectQuote: (q) => set({ selectedQuote: q }),
  setScheduledTime: (time) => set({ scheduledTime: time }),
  reset: () => set({ destination: null, destLabel: '', selectedQuote: null, selectedPickupId: null, scheduledTime: null }),
}));
