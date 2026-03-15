import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRideStore } from '../../store/rideStore';
import { useQuotes } from '../../hooks/useQuotes';
import { RideCard } from '../../components/rides/RideCard';
import { launchProviderApp } from '../../utils/deepLink';
import type { Quote } from '../../types';

const TRAFFIC_LABELS: Record<string, { label: string; color: string }> = {
  light: { label: 'Light', color: '#10b981' },
  moderate: { label: 'Moderate', color: '#f59e0b' },
  heavy: { label: 'Heavy', color: '#ef4444' },
};

export default function RideCompareScreen() {
  const router = useRouter();
  const { selectedQuote, origin, destination, originLabel, destLabel } =
    useRideStore();
  const { quotes, allQuotes } = useQuotes();

  const featured = selectedQuote ?? quotes[0];

  const handleBook = async (q: Quote) => {
    if (!origin || !destination) return;
    try {
      await launchProviderApp(q, origin, destination);
    } catch {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Open Provider App',
          `This would open ${q.name} to book your ride for ${q.priceDisplay}.`,
        );
      }
    }
  };

  if (!destination) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Select a destination first</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backArrow}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Compare Rides</Text>
      </View>

      {/* Route summary */}
      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, styles.dotOrigin]} />
          <Text style={styles.routeText}>{originLabel || 'Your location'}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, styles.dotDest]} />
          <Text style={styles.routeText}>{destLabel}</Text>
        </View>
      </View>

      {/* Featured ride detail */}
      {featured && (
        <View style={styles.featuredCard}>
          <Text style={styles.featuredTitle}>Selected Ride</Text>
          <View style={styles.featuredRow}>
            <View>
              <Text style={styles.featuredName}>{featured.name}</Text>
              <Text style={styles.featuredSub}>
                {Math.round(featured.etaSeconds / 60)} min ·{' '}
                {featured.vehicleClass}
              </Text>
            </View>
            <View style={styles.featuredPriceCol}>
              <Text style={styles.featuredPrice}>
                {featured.priceDisplay}
              </Text>
              {featured.fareBreakdown && (
                <Text style={styles.featuredTotal}>
                  est. £{featured.fareBreakdown.total.toFixed(2)}
                </Text>
              )}
            </View>
          </View>

          {/* Fare breakdown */}
          {featured.fareBreakdown && (
            <View style={styles.breakdownTable}>
              <BreakdownRow label="Base fare" value={featured.fareBreakdown.baseFare} />
              <BreakdownRow label="Distance" value={featured.fareBreakdown.distanceCharge} />
              <BreakdownRow label="Time" value={featured.fareBreakdown.timeCharge} />
              {featured.fareBreakdown.surgePremium > 0 && (
                <BreakdownRow
                  label={`Surge (${featured.surgeMultiplier}x)`}
                  value={featured.fareBreakdown.surgePremium}
                  highlight
                />
              )}
              {featured.fareBreakdown.tolls > 0 && (
                <BreakdownRow label="Tolls" value={featured.fareBreakdown.tolls} />
              )}
              <BreakdownRow label="Booking fee" value={featured.fareBreakdown.bookingFee} />
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.totalLabel}>Estimated total</Text>
                <Text style={styles.totalValue}>
                  £{featured.fareBreakdown.total.toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {/* Traffic info */}
          {featured.trafficLevel && (
            <View style={styles.trafficRow}>
              <View
                style={[
                  styles.trafficDot,
                  {
                    backgroundColor:
                      TRAFFIC_LABELS[featured.trafficLevel]?.color || '#666',
                  },
                ]}
              />
              <Text style={styles.trafficLabel}>
                {TRAFFIC_LABELS[featured.trafficLevel]?.label || featured.trafficLevel}{' '}
                traffic
                {featured.trafficDelayMins
                  ? ` (+${featured.trafficDelayMins} min delay)`
                  : ''}
              </Text>
            </View>
          )}

          <Pressable
            style={styles.bookBtn}
            onPress={() => handleBook(featured)}
          >
            <Text style={styles.bookText}>
              Book {featured.name} · {featured.priceDisplay}
            </Text>
          </Pressable>
        </View>
      )}

      {/* All quotes comparison */}
      <Text style={styles.sectionTitle}>
        All Available Rides ({allQuotes.length})
      </Text>
      <View style={styles.cardList}>
        {quotes.map((q) => (
          <RideCard
            key={`${q.provider}-${q.productId}`}
            quote={q}
            isBest={q === quotes[0]}
            onPress={() => handleBook(q)}
          />
        ))}
      </View>
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

function BreakdownRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, highlight && styles.highlightLabel]}>
        {label}
      </Text>
      <Text style={[styles.breakdownValue, highlight && styles.highlightValue]}>
        £{value.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backArrow: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  routeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotOrigin: {
    backgroundColor: '#10b981',
  },
  dotDest: {
    backgroundColor: '#ef4444',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginVertical: 2,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
  },
  featuredCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  featuredTitle: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  featuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  featuredSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  featuredPriceCol: {
    alignItems: 'flex-end',
  },
  featuredPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  featuredTotal: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  breakdownTable: {
    marginTop: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  highlightLabel: {
    color: '#f59e0b',
  },
  highlightValue: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  trafficRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  trafficDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trafficLabel: {
    fontSize: 12,
    color: '#666',
  },
  bookBtn: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  bookText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  cardList: {
    paddingHorizontal: 16,
  },
  bottomPad: {
    height: 40,
  },
});
