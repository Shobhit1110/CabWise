import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useRideStore } from '../../store/rideStore';
import { useQuotes } from '../../hooks/useQuotes';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { useFadeInUp, usePressAnimation } from '../../utils/animations';
import { triggerHaptic } from '../../utils/haptics';
import { shareComparison } from '../../utils/shareComparison';
import { RideCard } from '../../components/rides/RideCard';
import { launchProviderApp } from '../../utils/deepLink';
import type { Quote } from '../../types';

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
  light: { label: 'Light', color: '#10b981' },
  moderate: { label: 'Moderate', color: '#f59e0b' },
  heavy: { label: 'Heavy', color: '#ef4444' },
};

function BreakdownRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const { colors } = useThemeStore();
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, { color: highlight ? colors.warning : colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.breakdownValue, { color: highlight ? colors.warning : colors.textSecondary }]}>
        £{value.toFixed(2)}
      </Text>
    </View>
  );
}

export default function RideCompareScreen() {
  const router = useRouter();
  const { selectedQuote, origin, destination, originLabel, destLabel } =
    useRideStore();
  const { quotes, allQuotes } = useQuotes();
  const { colors } = useThemeStore();
  const headerStyle = useFadeInUp();
  const featuredStyle = useFadeInUp(150);
  const { animatedStyle: bookPressStyle, onPressIn: bookPressIn, onPressOut: bookPressOut } = usePressAnimation();

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
      <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
        <Text style={{ fontSize: 48, marginBottom: spacing.md }}>◇</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Select a destination first</Text>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.accent }]} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <Animated.View style={headerStyle}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Pressable onPress={() => router.back()} style={[styles.backCircle, { backgroundColor: colors.chipBg }]}
            accessibilityRole="button" accessibilityLabel="Go back"
          >
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Compare Rides</Text>
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              shareComparison(quotes, originLabel || 'Your location', destLabel || '');
            }}
            style={[styles.backCircle, { backgroundColor: colors.chipBg }]}
            accessibilityRole="button"
            accessibilityLabel="Share ride comparison"
          >
            <Text style={[styles.backIcon, { color: colors.text }]}>↑</Text>
          </Pressable>
        </View>
      </Animated.View>

      <View style={[styles.routeCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: colors.success }]}>
            <View style={styles.routeDotInner} />
          </View>
          <View style={styles.routeTextCol}>
            <Text style={[styles.routeLabel, { color: colors.textMuted }]}>PICKUP</Text>
            <Text style={[styles.routeText, { color: colors.text }]}>{originLabel || 'Your location'}</Text>
          </View>
        </View>
        <View style={[styles.routeLine, { borderColor: colors.border }]} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: colors.danger }]}>
            <View style={styles.routeDotInner} />
          </View>
          <View style={styles.routeTextCol}>
            <Text style={[styles.routeLabel, { color: colors.textMuted }]}>DROP-OFF</Text>
            <Text style={[styles.routeText, { color: colors.text }]}>{destLabel}</Text>
          </View>
        </View>
      </View>

      {featured && (
        <Animated.View style={featuredStyle}>
          <View style={[styles.featuredCard, { backgroundColor: colors.card, borderColor: colors.accent, shadowColor: colors.shadow }]}>
            <View style={[styles.featuredBadge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.featuredBadgeText, { color: colors.accent }]}>● Selected Ride</Text>
            </View>

            <View style={styles.featuredRow}>
              <View style={styles.featuredLeft}>
                {PROVIDER_LOGO_IMAGES[featured.provider] ? (
                  <Image source={PROVIDER_LOGO_IMAGES[featured.provider]} style={styles.featuredLogo} />
                ) : (
                  <View style={[styles.featuredLogoFallback, { backgroundColor: PROVIDER_FALLBACK[featured.provider]?.bg || '#666' }]}>
                    <Text style={[styles.featuredLogoText, { color: PROVIDER_FALLBACK[featured.provider]?.text || '#fff' }]}>
                      {PROVIDER_FALLBACK[featured.provider]?.label || featured.provider.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={[styles.featuredName, { color: colors.text }]}>{featured.name}</Text>
                  <Text style={[styles.featuredSub, { color: colors.textMuted }]}>
                    {Math.round(featured.etaSeconds / 60)} min · {featured.vehicleClass}
                  </Text>
                </View>
              </View>
              <View style={styles.featuredPriceCol}>
                <Text style={[styles.featuredPrice, { color: colors.text }]}>
                  {featured.priceDisplay}
                </Text>
                {featured.fareBreakdown && (
                  <Text style={[styles.featuredTotal, { color: colors.textMuted }]}>
                    est. £{featured.fareBreakdown.total.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>

            {featured.fareBreakdown && (
              <View style={[styles.breakdownTable, { backgroundColor: colors.bgSecondary }]}>
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
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.breakdownRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Estimated total</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>
                    £{featured.fareBreakdown.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {featured.trafficLevel && (
              <View style={[styles.trafficRow, { backgroundColor: colors.bgSecondary }]}>
                <View
                  style={[
                    styles.trafficDot,
                    { backgroundColor: TRAFFIC_LABELS[featured.trafficLevel]?.color || '#666' },
                  ]}
                />
                <Text style={[styles.trafficLabel, { color: colors.textSecondary }]}>
                  {TRAFFIC_LABELS[featured.trafficLevel]?.label || featured.trafficLevel}{' '}
                  traffic
                  {featured.trafficDelayMins ? ` (+${featured.trafficDelayMins} min)` : ''}
                </Text>
              </View>
            )}

            <Animated.View style={bookPressStyle}>
              <Pressable
                style={[styles.bookBtn, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
                onPress={() => { triggerHaptic('medium'); handleBook(featured); }}
                onPressIn={bookPressIn}
                onPressOut={bookPressOut}
                accessibilityRole="button"
                accessibilityLabel={`Book ${featured.name} for ${featured.priceDisplay}`}
              >
                <Text style={styles.bookText}>
                  Book {featured.name} · {featured.priceDisplay}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      )}

      <View style={styles.allSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          All Rides
        </Text>
        <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
          {allQuotes.length} available
        </Text>
      </View>
      <View style={styles.cardList}>
        {quotes.map((q, i) => (
          <RideCard
            key={`${q.provider}-${q.productId}`}
            quote={q}
            isBest={i === 0}
            index={i}
            onPress={() => handleBook(q)}
          />
        ))}
      </View>
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  backBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  backBtnText: {
    color: '#fff',
    ...typography.callout,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    ...typography.headline,
  },
  routeCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDotInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  routeTextCol: {
    flex: 1,
  },
  routeLabel: {
    ...typography.micro,
    letterSpacing: 1,
  },
  routeText: {
    ...typography.callout,
  },
  routeLine: {
    width: 0,
    height: 16,
    marginLeft: 6,
    marginVertical: 3,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  featuredCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    ...shadows.md,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginBottom: spacing.md,
  },
  featuredBadgeText: {
    ...typography.micro,
  },
  featuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  featuredLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  featuredLogoFallback: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredLogoText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  featuredName: {
    ...typography.headline,
  },
  featuredSub: {
    ...typography.caption,
    marginTop: 3,
  },
  featuredPriceCol: {
    alignItems: 'flex-end',
  },
  featuredPrice: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  featuredTotal: {
    ...typography.caption,
    marginTop: 2,
  },
  breakdownTable: {
    marginTop: spacing.lg,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  breakdownLabel: {
    ...typography.caption,
  },
  breakdownValue: {
    ...typography.caption,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    ...typography.callout,
    fontWeight: '700',
  },
  totalValue: {
    ...typography.callout,
    fontWeight: '700',
  },
  trafficRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  trafficDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trafficLabel: {
    ...typography.caption,
  },
  bookBtn: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  bookText: {
    color: '#fff',
    ...typography.body,
    fontWeight: '700',
  },
  allSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.headline,
    fontSize: 16,
  },
  sectionCount: {
    ...typography.caption,
  },
  cardList: {
    paddingHorizontal: spacing.lg,
  },
  bottomPad: {
    height: 40,
  },
});
