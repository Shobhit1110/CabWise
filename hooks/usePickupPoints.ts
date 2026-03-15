import { useQuery } from '@tanstack/react-query';
import { getNearbyPickupPoints } from '../lib/supabase';
import { rankPickupPoints } from '../utils/pickupScore';
import type { LatLng } from '../types';

export function usePickupPoints(userLocation: LatLng | null) {
  const query = useQuery({
    queryKey: ['pickupPoints', userLocation],
    queryFn: () => getNearbyPickupPoints(userLocation!.lat, userLocation!.lng),
    staleTime: 5 * 60 * 1000,
    enabled: !!userLocation,
  });

  const ranked = userLocation
    ? rankPickupPoints(query.data ?? [], userLocation)
    : [];

  return { ...query, pickupPoints: ranked };
}
