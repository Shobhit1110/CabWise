import type { RideAdapter, LatLng, Quote } from '../types';
import { MockAdapter } from '../adapters/mock';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

const mockAdapter: RideAdapter = new MockAdapter();

/** Call the server-side Edge Function that holds all provider API keys */
async function fetchQuotesFromServer(origin: LatLng, dest: LatLng): Promise<Quote[]> {
  const url = `${SUPABASE_URL}/functions/v1/get-quotes`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ origin, destination: dest }),
  });
  if (!res.ok) throw new Error(`Edge function ${res.status}`);
  return res.json();
}

export async function getAggregatedQuotes(origin: LatLng, dest: LatLng): Promise<Quote[]> {
  if (USE_MOCK || !SUPABASE_URL || SUPABASE_URL.includes('xxxx')) {
    return mockAdapter.fetchQuotes(origin, dest);
  }

  try {
    return await fetchQuotesFromServer(origin, dest);
  } catch (e) {
    console.error('Quote fetch error, falling back to mock:', e);
    return mockAdapter.fetchQuotes(origin, dest);
  }
}
