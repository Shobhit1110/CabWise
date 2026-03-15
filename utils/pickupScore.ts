import type { LatLng, Quote, VehicleClass } from '../types';

export type Filter = 'cheapest' | 'fastest' | 'shared' | 'premium' | 'electric';

export function pickupScore(point: any, userLocation: LatLng) {
  const walkMinutes = point.avgWalkSecs / 60;
  const saving = point.avgSavingGBP;
  if (point.distanceMetres > 600) return 0;
  return saving / Math.max(walkMinutes, 0.5);
}

export function rankPickupPoints(points: any[], userLocation: LatLng) {
  return points
    .map((p) => ({ ...p, score: pickupScore(p, userLocation) }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

const VEHICLE_CLASS_MAP: Record<string, VehicleClass[]> = {
  shared: ['shared'],
  premium: ['premium', 'exec'],
  electric: ['electric'],
};

export function filterQuotes(quotes: Quote[], filter: Filter): Quote[] {
  const classes = VEHICLE_CLASS_MAP[filter];
  if (!classes) return quotes;
  return quotes.filter((q) => classes.includes(q.vehicleClass));
}

export function countByFilter(quotes: Quote[]): Record<Filter, number> {
  return {
    cheapest: quotes.length,
    fastest: quotes.length,
    shared: quotes.filter((q) => q.vehicleClass === 'shared').length,
    premium: quotes.filter((q) => q.vehicleClass === 'premium' || q.vehicleClass === 'exec').length,
    electric: quotes.filter((q) => q.vehicleClass === 'electric').length,
  };
}

export const SORT_FNS: Record<Filter, (a: Quote, b: Quote) => number> = {
  cheapest: (a, b) => a.priceMin - b.priceMin,
  fastest: (a, b) => a.etaSeconds - b.etaSeconds,
  shared: (a, b) => a.priceMin - b.priceMin,
  premium: (a, b) => a.priceMin - b.priceMin,
  electric: (a, b) => a.priceMin - b.priceMin,
};
