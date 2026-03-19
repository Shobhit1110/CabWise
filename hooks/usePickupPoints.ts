import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNearbyPickupPoints } from '../lib/supabase';
import { rankPickupPoints } from '../utils/pickupScore';
import type { LatLng, PickupPoint } from '../types';

// Only re-fetch pickup points when user moves > 50m
const MIN_MOVEMENT_M = 50;

function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function usePickupPoints(userLocation: LatLng | null) {
  const lastFetchedLocation = useRef<LatLng | null>(null);

  // Compute a stable location that only updates when user moves significantly
  const stableLocation = useMemo(() => {
    if (!userLocation) return null;
    if (
      lastFetchedLocation.current &&
      haversineDistance(lastFetchedLocation.current, userLocation) < MIN_MOVEMENT_M
    ) {
      return lastFetchedLocation.current;
    }
    lastFetchedLocation.current = userLocation;
    return userLocation;
  }, [userLocation]);

  const query = useQuery({
    queryKey: ['pickupPoints', stableLocation?.lat, stableLocation?.lng],
    queryFn: () => getNearbyPickupPoints(stableLocation!.lat, stableLocation!.lng),
    staleTime: 5 * 60 * 1000,
    enabled: !!stableLocation,
  });

  const ranked: PickupPoint[] = useMemo(
    () => (stableLocation ? rankPickupPoints(query.data ?? []) : []),
    [query.data, stableLocation],
  );

  return { ...query, pickupPoints: ranked };
}
