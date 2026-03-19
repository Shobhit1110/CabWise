import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null =
  supabaseUrl && !supabaseUrl.includes('xxxx')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const WALK_SPEED_M_PER_MIN = 78;

const MOCK_PICKUP_POINTS = [
  { id: '1', name: 'Main Entrance', avgSavingGBP: 1.5, distanceMetres: 120, weeklyRides: 85, rating: 4.5 },
  { id: '2', name: 'Side Street',   avgSavingGBP: 2.0, distanceMetres: 200, weeklyRides: 42, rating: 4.2 },
  { id: '3', name: 'Bus Stop',      avgSavingGBP: 2.5, distanceMetres: 350, weeklyRides: 120, rating: 4.7 },
  { id: '4', name: 'Park Gate',     avgSavingGBP: 1.8, distanceMetres: 450, weeklyRides: 15, rating: 3.8 },
  { id: '5', name: 'High Street',   avgSavingGBP: 3.0, distanceMetres: 550, weeklyRides: 200, rating: 4.9 },
];

export async function getNearbyPickupPoints(lat: number, lng: number) {
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true' || !supabase) {
    return MOCK_PICKUP_POINTS.map((p) => {
      const walkMin = Math.max(p.distanceMetres / WALK_SPEED_M_PER_MIN, 0.5);
      return {
        ...p,
        avgWalkSecs: Math.round(walkMin * 60),
        walkMinutes: Math.round(walkMin * 100) / 100,
        score: 0, // will be re-ranked client-side
        location: {
          lat: lat + (Math.random() - 0.5) * 0.005,
          lng: lng + (Math.random() - 0.5) * 0.005,
        },
      };
    });
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
      walkMinutes: row.walk_minutes,
      distanceMetres: Math.round(row.distance_m),
      weeklyRides: row.weekly_rides ?? 0,
      rating: row.rating ?? 4.0,
      location: { lat: row.lat, lng: row.lng },
      score: row.score,
    }));
  } catch (e) {
    console.error('Error fetching pickup points:', e);
    return [];
  }
}
