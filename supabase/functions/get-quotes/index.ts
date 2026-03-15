// Supabase Edge Function: /get-quotes
// Runs server-side so API keys stay secret. Caches results in Upstash Redis.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Redis } from 'https://esm.sh/@upstash/redis@1.28.0';

interface LatLng {
  lat: number;
  lng: number;
}

interface Quote {
  provider: string;
  productId: string;
  name: string;
  vehicleClass: string;
  priceMin: number;
  priceMax: number;
  priceDisplay: string;
  surgeMultiplier: number;
  etaSeconds: number;
  currency: string;
  deepLinkUri: string;
  fetchedAt: number;
}

// — Redis client (lazy init) —
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  if (!url || !token || url.includes('xxxx')) return null;
  redis = new Redis({ url, token });
  return redis;
}

function cacheKey(origin: LatLng, dest: LatLng): string {
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return `quotes:${round(origin.lat)},${round(origin.lng)}:${round(dest.lat)},${round(dest.lng)}`;
}

// — Uber Adapter —
async function fetchUberQuotes(origin: LatLng, dest: LatLng): Promise<Quote[]> {
  const clientId = Deno.env.get('UBER_CLIENT_ID') || '';
  const clientSecret = Deno.env.get('UBER_CLIENT_SECRET') || '';
  if (!clientId || !clientSecret) return [];

  try {
    // Server-side OAuth2 client credentials flow
    const tokenRes = await fetch('https://login.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'ride_request.estimate',
      }),
    });
    if (!tokenRes.ok) return [];
    const { access_token } = await tokenRes.json();

    const url =
      `https://api.uber.com/v1.2/estimates/price?` +
      `start_latitude=${origin.lat}&start_longitude=${origin.lng}` +
      `&end_latitude=${dest.lat}&end_longitude=${dest.lng}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.prices || []).map((p: any) => ({
      provider: 'uber',
      productId: p.product_id,
      name: p.display_name,
      vehicleClass: mapUberClass(p.display_name),
      priceMin: p.low_estimate ?? p.estimate,
      priceMax: p.high_estimate ?? p.estimate,
      priceDisplay: `£${p.estimate}`,
      surgeMultiplier: p.surge_multiplier ?? 1.0,
      etaSeconds: p.duration,
      currency: 'GBP',
      deepLinkUri:
        `uber://?action=setPickup` +
        `&pickup[latitude]=${origin.lat}&pickup[longitude]=${origin.lng}` +
        `&dropoff[latitude]=${dest.lat}&dropoff[longitude]=${dest.lng}` +
        `&product_id=${p.product_id}`,
      fetchedAt: Date.now(),
    }));
  } catch (e) {
    console.error('Uber error:', e);
    return [];
  }
}

function mapUberClass(name: string): string {
  if (/exec|black/i.test(name)) return 'exec';
  if (/green|electric/i.test(name)) return 'electric';
  if (/pool|share/i.test(name)) return 'shared';
  if (/xl|comfort/i.test(name)) return 'premium';
  return 'standard';
}

// — Bolt Adapter —
async function fetchBoltQuotes(origin: LatLng, dest: LatLng): Promise<Quote[]> {
  const apiKey = Deno.env.get('BOLT_API_KEY') || '';
  if (!apiKey) return [];

  try {
    const res = await fetch('https://node.bolt.eu/booking/v1/price-estimates', {
      method: 'POST',
      headers: {
        'Api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pickup: { lat: origin.lat, lng: origin.lng },
        destination: { lat: dest.lat, lng: dest.lng },
        currency: 'GBP',
      }),
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.categories || []).map((c: any) => ({
      provider: 'bolt',
      productId: c.id,
      name: c.name,
      vehicleClass: mapBoltClass(c.id),
      priceMin: (c.price?.min_amount || 0) / 100,
      priceMax: (c.price?.max_amount || 0) / 100,
      priceDisplay: `£${((c.price?.min_amount || 0) / 100).toFixed(0)}–${((c.price?.max_amount || 0) / 100).toFixed(0)}`,
      surgeMultiplier: c.surge?.multiplier ?? 1.0,
      etaSeconds: (c.eta || 0) * 60,
      currency: 'GBP',
      deepLinkUri:
        `bolt://order?pickup_lat=${origin.lat}&pickup_lng=${origin.lng}` +
        `&dest_lat=${dest.lat}&dest_lng=${dest.lng}&category=${c.id}`,
      fetchedAt: Date.now(),
    }));
  } catch (e) {
    console.error('Bolt error:', e);
    return [];
  }
}

function mapBoltClass(id: string): string {
  if (/exec|black/i.test(id)) return 'exec';
  if (/electric/i.test(id)) return 'electric';
  if (/pet|xl/i.test(id)) return 'premium';
  return 'standard';
}

// — Free Now Adapter —
async function fetchFreeNowQuotes(origin: LatLng, dest: LatLng): Promise<Quote[]> {
  const clientId = Deno.env.get('FREENOW_CLIENT_ID') || '';
  const clientSecret = Deno.env.get('FREENOW_CLIENT_SECRET') || '';
  if (!clientId || !clientSecret) return [];

  try {
    // OAuth2 client credentials
    const tokenRes = await fetch('https://auth.free-now.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    });
    if (!tokenRes.ok) return [];
    const { access_token } = await tokenRes.json();

    const url =
      `https://api.free-now.com/v1/ride/quotes?` +
      `pickupLatitude=${origin.lat}&pickupLongitude=${origin.lng}` +
      `&destinationLatitude=${dest.lat}&destinationLongitude=${dest.lng}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.quotes || []).map((q: any) => ({
      provider: 'freenow',
      productId: q.serviceType || 'freenow-standard',
      name: `Free Now ${q.serviceType || 'Standard'}`,
      vehicleClass: mapFreeNowClass(q.serviceType || ''),
      priceMin: q.estimatedPrice?.lowerBound ?? q.estimatedPrice?.amount ?? 0,
      priceMax: q.estimatedPrice?.upperBound ?? q.estimatedPrice?.amount ?? 0,
      priceDisplay: `£${(q.estimatedPrice?.amount ?? 0).toFixed(0)}`,
      surgeMultiplier: q.surgeMultiplier ?? 1.0,
      etaSeconds: (q.eta?.minutes ?? 0) * 60,
      currency: 'GBP',
      deepLinkUri:
        `freenow://ride?pickup_lat=${origin.lat}&pickup_lng=${origin.lng}` +
        `&dest_lat=${dest.lat}&dest_lng=${dest.lng}`,
      fetchedAt: Date.now(),
    }));
  } catch (e) {
    console.error('FreeNow error:', e);
    return [];
  }
}

function mapFreeNowClass(serviceType: string): string {
  if (/exec|first/i.test(serviceType)) return 'exec';
  if (/premium|comfort/i.test(serviceType)) return 'premium';
  if (/electric|eco/i.test(serviceType)) return 'electric';
  return 'standard';
}

// — Wheely Adapter —
async function fetchWheelyQuotes(origin: LatLng, dest: LatLng): Promise<Quote[]> {
  const apiKey = Deno.env.get('WHEELY_API_KEY') || '';
  if (!apiKey) return [];

  try {
    const res = await fetch('https://api.wheely.com/v3/tariffs/estimate', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pickup: { latitude: origin.lat, longitude: origin.lng },
        destination: { latitude: dest.lat, longitude: dest.lng },
        currency: 'GBP',
      }),
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.tariffs || []).map((t: any) => ({
      provider: 'wheely',
      productId: t.id || 'wheely-business',
      name: `Wheely ${t.name || 'Business'}`,
      vehicleClass: 'exec',
      priceMin: t.estimatedPrice?.min ?? t.price ?? 0,
      priceMax: t.estimatedPrice?.max ?? t.price ?? 0,
      priceDisplay: `£${(t.price ?? 0).toFixed(0)}`,
      surgeMultiplier: 1.0,
      etaSeconds: (t.eta ?? 0) * 60,
      currency: 'GBP',
      deepLinkUri:
        `wheely://book?lat=${origin.lat}&lng=${origin.lng}` +
        `&dest_lat=${dest.lat}&dest_lng=${dest.lng}&class=${t.id || 'business'}`,
      fetchedAt: Date.now(),
    }));
  } catch (e) {
    console.error('Wheely error:', e);
    return [];
  }
}

// — Handler —
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { origin, destination } = await req.json();

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return new Response(
        JSON.stringify({ error: 'origin and destination with lat/lng required' }),
        { status: 400 },
      );
    }

    const key = cacheKey(origin, destination);
    const r = getRedis();

    // Check cache
    if (r) {
      try {
        const cached = await r.get<Quote[]>(key);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'X-Cache': 'HIT',
            },
          });
        }
      } catch {
        // cache miss or error — continue
      }
    }

    // Fan out to all providers
    const results = await Promise.allSettled([
      fetchUberQuotes(origin, destination),
      fetchBoltQuotes(origin, destination),
      fetchFreeNowQuotes(origin, destination),
      fetchWheelyQuotes(origin, destination),
    ]);

    const quotes: Quote[] = results
      .filter((r): r is PromiseFulfilledResult<Quote[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    // Cache for 20 seconds
    if (r && quotes.length > 0) {
      try {
        await r.set(key, JSON.stringify(quotes), { ex: 20 });
      } catch {
        // cache write failure is non-fatal
      }
    }

    return new Response(JSON.stringify(quotes), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
      },
    });
  } catch (e) {
    console.error('Edge function error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
});
