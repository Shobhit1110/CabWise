import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FareBreakdown } from './FareBreakdown';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { useStaggerItem, usePressAnimation } from '../../utils/animations';
import { triggerHaptic } from '../../utils/haptics';
import type { Quote } from '../../types';

const PROVIDER_COLORS: Record<string, string> = {
  uber: '#000',
  bolt: '#34d186',
  freenow: '#2e3192',
  wheely: '#1a1a2e',
  mock: '#6366f1',
};

const PROVIDER_LOGO_IMAGES: Record<string, any> = {
  uber: require('../../assets/providers/uber.png'),
  bolt: require('../../assets/providers/bolt.png'),
  freenow: require('../../assets/providers/freenow.png'),
  wheely: require('../../assets/providers/wheely.png'),
};

const PROVIDER_FALLBACK: Record<string, { bg: string; text: string; label: string }> = {
  mock: { bg: '#6366f1', text: '#fff', label: 'M' },
};

const TRAFFIC_LABELS: Record<string, { label: string; color: string }> = {
  light: { label: 'Light traffic', color: '#10b981' },
  moderate: { label: 'Moderate', color: '#f59e0b' },
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
  index?: number;
}

export function RideCard({ quote, onPress, isBest, index = 0 }: RideCardProps) {
  const { colors } = useThemeStore();
  const trafficInfo = quote.trafficLevel ? TRAFFIC_LABELS[quote.trafficLevel] : null;
  const etaMins = Math.round(quote.etaSeconds / 60);
  const staggerStyle = useStaggerItem(index, 60);
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressAnimation();

  return (
    <Animated.View style={[staggerStyle, pressStyle]}>
      <Pressable
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.shadow },
          isBest && { borderColor: colors.accent, borderWidth: 2 },
        ]}
        onPress={() => { triggerHaptic('light'); onPress?.(); }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${quote.name} ${CLASS_LABELS[quote.vehicleClass] || quote.vehicleClass}, ${quote.priceDisplay}, ${etaMins} minute ETA${isBest ? ', best price' : ''}${quote.surgeMultiplier > 1 ? `, surge ${quote.surgeMultiplier}x` : ''}`}
        accessibilityHint="Double tap to view details and book"
      >
        {isBest && (
          <LinearGradient
            colors={[colors.gradient1, colors.gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bestBadge}
          >
            <Text style={styles.bestText}>Best price</Text>
          </LinearGradient>
        )}

        <View style={styles.top}>
          <View style={styles.providerCol}>
            <View style={styles.providerRow}>
              {PROVIDER_LOGO_IMAGES[quote.provider] ? (
                <Image source={PROVIDER_LOGO_IMAGES[quote.provider]} style={styles.providerLogo} />
              ) : (
                <View style={[styles.providerLogoFallback, { backgroundColor: PROVIDER_FALLBACK[quote.provider]?.bg || colors.textMuted }]}>
                  <Text style={[styles.providerLogoText, { color: PROVIDER_FALLBACK[quote.provider]?.text || '#fff' }]}>
                    {PROVIDER_FALLBACK[quote.provider]?.label || quote.provider.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1}>{quote.name}</Text>
            </View>
            <Text style={[styles.vehicleClass, { color: colors.textMuted }]}>
              {CLASS_LABELS[quote.vehicleClass] || quote.vehicleClass}
            </Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={[styles.price, { color: colors.text }]}>{quote.priceDisplay}</Text>
            {quote.fareBreakdown && (
              <Text style={[styles.totalEst, { color: colors.textMuted }]}>
                est. £{quote.fareBreakdown.total.toFixed(0)}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.infoRow, { backgroundColor: colors.bgSecondary }]}>
          <View style={styles.etaChip}>
            <Text style={[styles.eta, { color: colors.textSecondary }]}>{etaMins} min</Text>
          </View>
          {trafficInfo && (
            <View style={[styles.trafficBadge, { backgroundColor: trafficInfo.color + '18' }]}>
              <View style={[styles.trafficDot, { backgroundColor: trafficInfo.color }]} />
              <Text style={[styles.trafficText, { color: trafficInfo.color }]}>
                {trafficInfo.label}
              </Text>
            </View>
          )}
          {quote.surgeMultiplier > 1.0 && (
            <View style={[styles.surgeBadge, { backgroundColor: colors.warningSoft }]}>
              <Text style={[styles.surgeText, { color: colors.warning }]}>
                ↑ {quote.surgeMultiplier}x
              </Text>
            </View>
          )}
        </View>

        {quote.fareBreakdown && <FareBreakdown breakdown={quote.fareBreakdown} />}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...shadows.sm,
  },
  bestBadge: {
    position: 'absolute',
    top: -1,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderBottomLeftRadius: radii.sm,
    borderBottomRightRadius: radii.sm,
  },
  bestText: {
    ...typography.micro,
    color: '#fff',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  providerCol: {
    flex: 1,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  providerLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  providerLogoFallback: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerLogoText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  providerName: {
    ...typography.body,
    fontWeight: '600',
  },
  vehicleClass: {
    ...typography.caption,
    marginTop: 2,
    marginLeft: 36,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  totalEst: {
    ...typography.micro,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    flexWrap: 'wrap',
  },
  etaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etaIcon: {
    fontSize: 12,
  },
  eta: {
    ...typography.caption,
    fontWeight: '600',
  },
  trafficBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
  },
  trafficDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trafficText: {
    ...typography.micro,
  },
  surgeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  surgeText: {
    ...typography.micro,
  },
});
