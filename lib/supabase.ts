import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null =
  supabaseUrl && !supabaseUrl.includes('xxxx')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const MOCK_PICKUP_POINTS = [
  { id: '1', name: 'Main Entrance', avgWalkSecs: 60, avgSavingGBP: 1.5, distanceMetres: 120 },
  { id: '2', name: 'Side Street', avgWalkSecs: 90, avgSavingGBP: 2.0, distanceMetres: 200 },
  { id: '3', name: 'Bus Stop', avgWalkSecs: 120, avgSavingGBP: 2.5, distanceMetres: 350 },
];

export async function getNearbyPickupPoints(lat: number, lng: number) {
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true' || !supabase) {
    return MOCK_PICKUP_POINTS.map((p) => ({
      ...p,
      location: {
        lat: lat + (Math.random() - 0.5) * 0.005,
        lng: lng + (Math.random() - 0.5) * 0.005,
      },
    }));
  }

  try {
    const { data, error } = await supabase.rpc('nearby_pickup_points', {
      user_lat: lat,
      user_lng: lng,
      radius_m: 600,
    });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      avgSavingGBP: Number(row.avg_saving_gbp),
      avgWalkSecs: row.avg_walk_secs,
      distanceMetres: Math.round(row.distance_m),
      location: { lat: row.lat, lng: row.lng },
      score: row.score,
    }));
  } catch (e) {
    console.error('Error fetching pickup points:', e);
    return [];
  }
}
