import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'cabwise_query_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CachedData<T = unknown> {
  data: T;
  timestamp: number;
}

/**
 * Save query data to offline cache.
 */
export async function saveToCache(key: string, data: unknown): Promise<void> {
  try {
    const existing = await loadAllCache();
    existing[key] = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(existing));
  } catch {
    // Cache write failure — non-critical
  }
}

/**
 * Load cached data if available and not expired.
 */
export async function loadFromCache<T>(key: string): Promise<T | null> {
  try {
    const all = await loadAllCache();
    const entry = all[key] as CachedData<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function loadAllCache(): Promise<Record<string, CachedData>> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Clear expired entries from cache.
 */
export async function pruneCache(): Promise<void> {
  try {
    const all = await loadAllCache();
    const now = Date.now();
    const pruned: Record<string, CachedData> = {};
    for (const [key, entry] of Object.entries(all)) {
      if (now - entry.timestamp <= CACHE_TTL) {
        pruned[key] = entry;
      }
    }
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(pruned));
  } catch {
    // Non-critical
  }
}
