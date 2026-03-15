// Redis caching is a server-side concern. In the React Native client,
// @upstash/redis cannot be used because crypto.subtle is unavailable.
// These stubs keep the aggregator interface unchanged.

export async function getCachedQuotes(_key: string) {
  return null;
}

export async function setCachedQuotes(_key: string, _data: any, _ttl = 20) {
  // no-op on client
}
