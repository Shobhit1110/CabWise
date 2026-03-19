// Supabase Edge Function: /get-quotes
// Runs server-side so API keys stay secret. Caches results in Upstash Redis.
// Scaling features: OAuth token caching, circuit breakers, per-provider timeouts.
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

// ─── Circuit Breaker ───
// Tracks per-provider failures. Opens circuit after 3 consecutive failures,
// auto-recovers after 30s cooldown with a single probe request.
const CIRCUIT_STATE: Record<string, { failures: number; openedAt: number }> = {};
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 30_000;

function isCircuitOpen(provider: string): boolean {
  const state = CIRCUIT_STATE[provider];
  if (!state || state.failures < CIRCUIT_THRESHOLD) return false;
  if (Date.now() - state.openedAt > CIRCUIT_COOLDOWN_MS) {
    // Half-open: allow one probe request
    state.failures = CIRCUIT_THRESHOLD - 1;
    return false;
  }
  return true;
}

function recordSuccess(provider: string): void {
  delete CIRCUIT_STATE[provider];
}

function recordFailure(provider: string): void {
  const state = CIRCUIT_STATE[provider] ?? { failures: 0, openedAt: 0 };
  state.failures++;
  if (state.failures >= CIRCUIT_THRESHOLD) {
    state.openedAt = Date.now();
  }
  CIRCUIT_STATE[provider] = state;
}

// ─── OAuth Token Cache ───
// Caches OAuth tokens in Redis to avoid fetching a new token on every request.
// Falls back to direct fetch if Redis is unavailable.
const OAUTH_TOKEN_BUFFER_SECS = 60; // refresh 60s before expiry

async function getCachedOAuthToken(
  provider: string,
  fetchToken: () => Promise<{ access_token: string; expires_in?: number }>,
): Promise<string | null> {
  const r = getRedis();
  const cacheKey = `oauth:${provider}`;

  // Try cache first
  if (r) {
    try {
      const cached = await r.get<string>(cacheKey);
      if (cached) return cached;
    } catch {
      // cache miss — continue to fetch
    }
  }

  // Fetch new token
  try {
    const { access_token, expires_in } = await fetchToken();
    // Cache token (default 25 min if expires_in not provided)
    if (r && access_token) {
      const ttl = (expires_in ?? 1500) - OAUTH_TOKEN_BUFFER_SECS;
      if (ttl > 0) {
        try { await r.set(cacheKey, access_token, { ex: ttl }); } catch { /* non-fatal */ }
      }
    }
    return access_token;
  } catch {
    return null;
  }
}

// ─── Provider timeout ───
const PROVIDER_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number = PROVIDER_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Provider timeout')), ms),
    ),
  ]);
}

// — Uber Adapter —
async function fetchUberQuotes(origin: LatLng, dest: LatLng): Promise<Quote[]> {
  const clientId = Deno.env.get('UBER_CLIENT_ID') || '';
  const clientSecret = Deno.env.get('UBER_CLIENT_SECRET') || '';
  if (!clientId || !clientSecret) return [];
  if (isCircuitOpen('uber')) return [];

  try {
    const accessToken = await getCachedOAuthToken('uber', async () => {
      const tokenRes = await withTimeout(fetch('https://login.uber.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
          scope: 'ride_request.estimate',
        }),
      }));
      if (!tokenRes.ok) throw new Error(`Uber token ${tokenRes.status}`);
      return tokenRes.json();
    });

    if (!accessToken) { recordFailure('uber'); return []; }

    const url =
      `https://api.uber.com/v1.2/estimates/price?` +
      `start_latitude=${origin.lat}&start_longitude=${origin.lng}` +
      `&end_latitude=${dest.lat}&end_longitude=${dest.lng}`;

    const res = await withTimeout(fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }));
    if (!res.ok) { recordFailure('uber'); return []; }

    const data = await res.json();
    recordSuccess('uber');
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
    recordFailure('uber');
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
  if (isCircuitOpen('bolt')) return [];

  try {
    const res = await withTimeout(fetch('https://node.bolt.eu/booking/v1/price-estimates', {
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
    }));
    if (!res.ok) { recordFailure('bolt'); return []; }

    const data = await res.json();
    recordSuccess('bolt');
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
    recordFailure('bolt');
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
  if (isCircuitOpen('freenow')) return [];

  try {
    const accessToken = await getCachedOAuthToken('freenow', async () => {
      const tokenRes = await withTimeout(fetch('https://auth.free-now.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      }));
      if (!tokenRes.ok) throw new Error(`FreeNow token ${tokenRes.status}`);
      return tokenRes.json();
    });

    if (!accessToken) { recordFailure('freenow'); return []; }

    const url =
      `https://api.free-now.com/v1/ride/quotes?` +
      `pickupLatitude=${origin.lat}&pickupLongitude=${origin.lng}` +
      `&destinationLatitude=${dest.lat}&destinationLongitude=${dest.lng}`;

    const res = await withTimeout(fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }));
    if (!res.ok) { recordFailure('freenow'); return []; }

    const data = await res.json();
    recordSuccess('freenow');
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
    recordFailure('freenow');
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
  if (isCircuitOpen('wheely')) return [];

  try {
    const res = await withTimeout(fetch('https://api.wheely.com/v3/tariffs/estimate', {
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
    }));
    if (!res.ok) { recordFailure('wheely'); return []; }

    const data = await res.json();
    recordSuccess('wheely');
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
    recordFailure('wheely');
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

    // Fan out to all providers (circuit breaker skips broken ones)
    const results = await Promise.allSettled([
      fetchUberQuotes(origin, destination),
      fetchBoltQuotes(origin, destination),
      fetchFreeNowQuotes(origin, destination),
      fetchWheelyQuotes(origin, destination),
    ]);

    const quotes: Quote[] = results
      .filter((r): r is PromiseFulfilledResult<Quote[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    // Cache for 45 seconds (longer TTL reduces provider API calls)
    if (r && quotes.length > 0) {
      try {
        await r.set(key, JSON.stringify(quotes), { ex: 45 });
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
