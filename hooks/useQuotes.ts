import { useQuery } from '@tanstack/react-query';
import { getAggregatedQuotes } from '../services/aggregator';
import { useRideStore } from '../store/rideStore';
import { SORT_FNS, filterQuotes, countByFilter } from '../utils/pickupScore';
import type { Quote } from '../types';

export function useQuotes() {
  const { origin, destination, selectedFilter } = useRideStore();

  const query = useQuery({
    queryKey: ['quotes', origin, destination],
    queryFn: () => getAggregatedQuotes(origin!, destination!),
    refetchInterval: 15000,
    enabled: !!origin && !!destination,
  });

  const allQuotes = query.data ?? [];
  const filtered = filterQuotes(allQuotes, selectedFilter);
  const sorted = [...filtered].sort(SORT_FNS[selectedFilter]);
  const hasSurge = sorted.some((q) => q.surgeMultiplier > 1.2);
  const counts = countByFilter(allQuotes);

  return {
    ...query,
    quotes: sorted,
    allQuotes,
    counts,
    hasSurge,
    cheapest: sorted[0] ?? null,
    isRefreshing: query.isFetching && !query.isLoading,
  };
}
