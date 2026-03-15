import { useRef, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { usePickupPoints } from '../../hooks/usePickupPoints';
import { useQuotes } from '../../hooks/useQuotes';
import { useRideStore } from '../../store/rideStore';
import { RideMap } from '../../components/map/RideMap';
import { FilterChips } from '../../components/rides/FilterChips';
import { RideCard } from '../../components/rides/RideCard';
import { QuickBookButton } from '../../components/rides/QuickBookButton';
import { LocationRow } from '../../components/shared/LocationRow';
import { DestinationSearch } from '../../components/shared/DestinationSearch';
import { PickupSuggestion } from '../../components/rides/PickupSuggestion';

let BottomSheet: any = null;
if (Platform.OS !== 'web') {
  BottomSheet = require('@gorhom/bottom-sheet').default;
}

export default function HomeScreen() {
  const router = useRouter();
  const sheetRef = useRef<any>(null);
  const { location } = useLocation();
  const {
    origin,
    destination,
    originLabel,
    destLabel,
    selectedPickupId,
    setOrigin,
    setDestination,
    setPickup,
    setFilter,
    selectedFilter,
    selectQuote,
  } = useRideStore();
  const { quotes, cheapest, isLoading, counts, isRefreshing, allQuotes, hasSurge } = useQuotes();
  const { pickupPoints } = usePickupPoints(location);

  // Auto-set origin from GPS
  useEffect(() => {
    if (location && !origin) {
      setOrigin(location, 'Your location');
    }
  }, [location]);

  const snapPoints = ['30%', '65%', '92%'];

  const handleDestinationSelect = useCallback(
    (loc: any, label: string) => {
      setDestination(loc, label);
    },
    [],
  );

  const handlePickupSelect = useCallback(
    (point: any) => {
      setOrigin(point.location, point.name);
      setPickup(point.id);
    },
    [],
  );

  const handlePickupReset = useCallback(() => {
    if (location) {
      setOrigin(location, 'Your location');
      setPickup(null);
    }
  }, [location]);

  const handleRidePress = useCallback(
    (q: any) => {
      selectQuote(q);
      router.push('/ride/compare');
    },
    [],
  );

  const content = (
    <View style={styles.sheetContent}>
      {/* Origin */}
      <LocationRow
        type="origin"
        label={originLabel || 'Locating...'}
      />

      {/* Destination search */}
      <DestinationSearch
        onSelect={handleDestinationSelect}
        currentLabel={destLabel || undefined}
      />

      {destination && (
        <>
          {/* Smart pickup suggestions */}
          <PickupSuggestion
            points={pickupPoints}
            selectedId={selectedPickupId}
            onSelect={handlePickupSelect}
            onReset={handlePickupReset}
          />

          {/* Live indicator + filters */}
          <View style={styles.liveRow}>
            <View style={styles.liveIndicator}>
              <View style={[styles.liveDot, isRefreshing && styles.livePulse]} />
              <Text style={styles.liveText}>
                {isRefreshing ? 'Updating...' : `Live · ${allQuotes.length} rides`}
              </Text>
            </View>
            {hasSurge && (
              <Text style={styles.surgeWarning}>⚡ Surge active</Text>
            )}
          </View>

          <FilterChips
            active={selectedFilter}
            onChange={setFilter}
            counts={counts}
          />

          {/* Ride quotes */}
          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#111" />
              <Text style={styles.loadingText}>Comparing prices...</Text>
            </View>
          ) : quotes.length > 0 ? (
            quotes.map((q, i) => (
              <RideCard
                key={`${q.provider}-${q.productId}`}
                quote={q}
                isBest={i === 0 && selectedFilter === 'cheapest'}
                onPress={() => handleRidePress(q)}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No rides found for this filter. Try another category.
              </Text>
            </View>
          )}

          {/* Quick book */}
          <QuickBookButton cheapest={cheapest} />
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <RideMap
        userLocation={location}
        pickupPoints={pickupPoints}
        origin={origin}
        destination={destination}
      />

      {BottomSheet ? (
        <BottomSheet
          ref={sheetRef}
          snapPoints={snapPoints}
          index={1}
          enableDynamicSizing={false}
        >
          <ScrollView>{content}</ScrollView>
        </BottomSheet>
      ) : (
        <ScrollView style={styles.webPanel}>{content}</ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  webPanel: {
    maxHeight: '60%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  liveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  livePulse: {
    backgroundColor: '#f59e0b',
  },
  liveText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  surgeWarning: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
  },
  loading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#888',
  },
  empty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
