import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FareBreakdown } from './FareBreakdown';
import type { Quote } from '../../types';

const PROVIDER_COLORS: Record<string, string> = {
  uber: '#000',
  bolt: '#34d186',
  freenow: '#2e3192',
  wheely: '#1a1a2e',
};

const TRAFFIC_LABELS: Record<string, { label: string; color: string }> = {
  light: { label: 'Light traffic', color: '#10b981' },
  moderate: { label: 'Moderate traffic', color: '#f59e0b' },
  heavy: { label: 'Heavy traffic', color: '#ef4444' },
};

const CLASS_LABELS: Record<string, string> = {
  standard: 'Standard',
  premium: 'Premium',
  shared: 'Shared',
  electric: 'Electric',
  exec: 'Executive',
};

interface RideCardProps {
  quote: Quote;
  onPress?: () => void;
  isBest?: boolean;
}

export function RideCard({ quote, onPress, isBest }: RideCardProps) {
  const trafficInfo = quote.trafficLevel ? TRAFFIC_LABELS[quote.trafficLevel] : null;
  const etaMins = Math.round(quote.etaSeconds / 60);

  return (
    <Pressable
      style={[styles.card, isBest && styles.best]}
      onPress={onPress}
    >
      {isBest && (
        <View style={styles.bestBadge}>
          <Text style={styles.bestText}>Best price</Text>
        </View>
      )}

      <View style={styles.top}>
        <View style={styles.providerCol}>
          <View style={styles.providerRow}>
            <View style={[styles.providerDot, { backgroundColor: PROVIDER_COLORS[quote.provider] || '#666' }]} />
            <Text style={styles.providerName} numberOfLines={1}>{quote.name}</Text>
          </View>
          <Text style={styles.vehicleClass}>{CLASS_LABELS[quote.vehicleClass] || quote.vehicleClass}</Text>
        </View>
        <View style={styles.priceCol}>
          <Text style={styles.price}>{quote.priceDisplay}</Text>
          {quote.fareBreakdown && (
            <Text style={styles.totalEst}>est. £{quote.fareBreakdown.total.toFixed(0)}</Text>
          )}
        </View>
      </View>

      <View style={styles.middle}>
        <View style={styles.etaRow}>
          <Text style={styles.eta}>{etaMins} min</Text>
          {trafficInfo && (
            <View style={[styles.trafficBadge, { backgroundColor: trafficInfo.color + '18' }]}>
              <View style={[styles.trafficDot, { backgroundColor: trafficInfo.color }]} />
              <Text style={[styles.trafficText, { color: trafficInfo.color }]}>
                {trafficInfo.label}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.badges}>
          {quote.surgeMultiplier > 1.0 && (
            <View style={[styles.badge, quote.surgeMultiplier > 1.2 ? styles.surgeHigh : styles.surgeLow]}>
              <Text style={styles.badgeText}>{quote.surgeMultiplier}x surge</Text>
            </View>
          )}
          {quote.fareBreakdown && quote.fareBreakdown.tolls > 0 && (
            <View style={[styles.badge, styles.tollBadge]}>
              <Text style={styles.badgeText}>£{quote.fareBreakdown.tolls.toFixed(1)} tolls</Text>
            </View>
          )}
        </View>
      </View>

      {quote.fareBreakdown && <FareBreakdown breakdown={quote.fareBreakdown} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  best: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  bestBadge: {
    position: 'absolute',
    top: -1,
    right: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  bestText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  providerCol: {
    flex: 1,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  vehicleClass: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    marginLeft: 14,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  totalEst: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  middle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  trafficBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  trafficDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trafficText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  surgeHigh: {
    backgroundColor: '#fef3c7',
  },
  surgeLow: {
    backgroundColor: '#fef9c3',
  },
  tollBadge: {
    backgroundColor: '#e0e7ff',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78350f',
  },
});
