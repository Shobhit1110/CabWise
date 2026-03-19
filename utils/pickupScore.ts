import type { LatLng, PickupPoint, Quote, VehicleClass } from '../types';

export type Filter = 'cheapest' | 'fastest' | 'shared' | 'premium' | 'electric';

const WALK_SPEED_M_PER_MIN = 78; // ~1.3 m/s average walking speed
const MAX_RADIUS_M = 600;
const MAX_POPULARITY_BOOST = 0.3;

/**
 * Compute a pickup score that mirrors the server-side formula:
 *   (savings / walkMinutes) * distanceDecay * popularityFactor * ratingFactor
 *
 * - walkMinutes derived from real distance (not static avg_walk_secs)
 * - distanceDecay: linear falloff 1→0 over the radius so closer = better
 * - popularityFactor: mild boost for proven high-traffic spots
 * - ratingFactor: scale by point quality rating
 */
export function pickupScore(point: PickupPoint): number {
  const dist = point.distanceMetres;
  if (dist > MAX_RADIUS_M) return 0;

  const walkMinutes = Math.max(dist / WALK_SPEED_M_PER_MIN, 0.5);
  const savingsEfficiency = point.avgSavingGBP / walkMinutes;

  const distanceDecay = Math.max(1 - dist / MAX_RADIUS_M, 0);

  const popularity = Math.log(Math.max(point.weeklyRides ?? 0, 1) + 1);
  const popularityFactor = 1 + Math.min(popularity / 10, MAX_POPULARITY_BOOST);

  const ratingFactor = (point.rating ?? 4.0) / 5.0;

  return savingsEfficiency * distanceDecay * popularityFactor * ratingFactor;
}

export function rankPickupPoints(points: PickupPoint[]): PickupPoint[] {
  return points
    .map((p) => ({ ...p, score: pickupScore(p) }))
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
