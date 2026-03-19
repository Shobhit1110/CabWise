import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAggregatedQuotes } from '../services/aggregator';
import { useRideStore } from '../store/rideStore';
import { SORT_FNS, filterQuotes, countByFilter } from '../utils/pickupScore';
import { updateWidgetData } from '../utils/widget';
import { useAlertStore } from '../store/alertStore';
import { saveToCache, loadFromCache } from '../utils/offlineCache';
import type { Quote } from '../types';

// Adaptive polling: slow down when prices are stable, speed up when they change
const FAST_INTERVAL = 15_000;
const SLOW_INTERVAL = 30_000;
const STABLE_THRESHOLD = 3; // slow down after N unchanged fetches

export function useQuotes() {
  const { origin, destination, selectedFilter, destLabel } = useRideStore();
  const lastCheapestRef = useRef<number | null>(null);
  const stableCountRef = useRef(0);

  const query = useQuery({
    queryKey: ['quotes', origin?.lat, origin?.lng, destination?.lat, destination?.lng],
    queryFn: async () => {
      const cacheKey = `quotes_${origin!.lat}_${origin!.lng}_${destination!.lat}_${destination!.lng}`;
      try {
        const result = await getAggregatedQuotes(origin!, destination!);
        saveToCache(cacheKey, result);
        return result;
      } catch (err) {
        // On failure, try to return cached data
        const cached = await loadFromCache<Quote[]>(cacheKey);
        if (cached) return cached;
        throw err;
      }
    },
    refetchInterval: stableCountRef.current >= STABLE_THRESHOLD ? SLOW_INTERVAL : FAST_INTERVAL,
    enabled: !!origin && !!destination,
  });

  const allQuotes = query.data ?? [];
  const filtered = filterQuotes(allQuotes, selectedFilter);
  const sorted = [...filtered].sort(SORT_FNS[selectedFilter]);
  const hasSurge = sorted.some((q) => q.surgeMultiplier > 1.2);
  const counts = countByFilter(allQuotes);
  const cheapest = sorted[0] ?? null;
  const fastest = allQuotes.length > 0
    ? allQuotes.reduce((a, b) => a.etaSeconds < b.etaSeconds ? a : b)
    : null;

  // Track price stability for adaptive polling
  useEffect(() => {
    if (cheapest) {
      if (lastCheapestRef.current === cheapest.priceMin) {
        stableCountRef.current++;
      } else {
        stableCountRef.current = 0;
        lastCheapestRef.current = cheapest.priceMin;
      }
    }
  }, [cheapest?.priceMin]);

  // Update widget data whenever cheapest ride changes
  useEffect(() => {
    if (cheapest && destLabel) {
      updateWidgetData({
        provider: cheapest.name,
        price: cheapest.priceDisplay,
        eta: `${Math.round(cheapest.etaSeconds / 60)} min`,
        destination: destLabel,
        updatedAt: Date.now(),
      });
    }
  }, [cheapest?.provider, cheapest?.priceMin, destLabel]);

  // Check surge levels against price alerts
  useEffect(() => {
    if (cheapest && destLabel) {
      const maxSurge = Math.max(...allQuotes.map((q) => q.surgeMultiplier));
      useAlertStore.getState().checkSurgeAndNotify(maxSurge, destLabel);
    }
  }, [cheapest?.priceMin, destLabel]);

  return {
    ...query,
    quotes: sorted,
    allQuotes,
    counts,
    hasSurge,
    cheapest,
    fastest,
    isRefreshing: query.isFetching && !query.isLoading,
  };
}
