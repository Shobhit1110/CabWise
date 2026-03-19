import { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Platform,
  RefreshControl,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { usePickupPoints } from '../../hooks/usePickupPoints';
import { useQuotes } from '../../hooks/useQuotes';
import { useRideStore } from '../../store/rideStore';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { usePlacesStore } from '../../store/placesStore';
import { useRoutesStore } from '../../store/routesStore';
import { usePulse } from '../../utils/animations';
import { triggerHaptic } from '../../utils/haptics';
import { RideMap } from '../../components/map/RideMap';
import { FilterChips } from '../../components/rides/FilterChips';
import { RideCard } from '../../components/rides/RideCard';
import { QuickBookButton } from '../../components/rides/QuickBookButton';
import { SurgeChart } from '../../components/rides/SurgeChart';
import { LocationRow } from '../../components/shared/LocationRow';
import { DestinationSearch } from '../../components/shared/DestinationSearch';
import { SkeletonQuoteList } from '../../components/shared/SkeletonLoader';
import { PriceAlertSheet } from '../../components/shared/PriceAlertSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { SavedPlaces } from '../../components/shared/SavedPlaces';
import { FavouriteRoutes } from '../../components/shared/FavouriteRoutes';
import { ErrorCard } from '../../components/shared/ErrorCard';

let BottomSheet: any = null;
if (Platform.OS !== 'web') {
  BottomSheet = require('@gorhom/bottom-sheet').default;
}

/* ── Animated action icons (Uber-style) ─────────── */

function PinIcon({ color }: { color: string; bg: string }) {
  const bounce = useSharedValue(0);
  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 600, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 400, easing: Easing.bounce }),
      ),
      -1, false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));
  return (
    <View style={styles.iconCircle}>
      <Animated.View style={style}>
        <View style={styles.pinWrap}>
          <View style={[styles.pinHead, { backgroundColor: color }]} />
          <View style={[styles.pinNeedle, { borderTopColor: color }]} />
        </View>
      </Animated.View>
      <View style={[styles.pinShadow, { backgroundColor: color }]} />
    </View>
  );
}

function ClockIcon({ color }: { color: string; bg: string }) {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1, false,
    );
  }, []);
  const handStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <View style={styles.iconCircle}>
      <View style={[styles.clockFace, { borderColor: color }]}>
        <Animated.View style={[styles.clockHand, { backgroundColor: color }, handStyle]} />
        <View style={[styles.clockCenter, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function LiveBadge({ count, isRefreshing, hasSurge }: { count: number; isRefreshing: boolean; hasSurge: boolean }) {
  const { colors } = useThemeStore();
  const pulseStyle = usePulse(isRefreshing);

  return (
    <View style={styles.liveRow}>
      <View style={[styles.liveBadge, { backgroundColor: colors.successSoft }]}>
        <Animated.View style={[styles.liveDot, { backgroundColor: colors.success }, pulseStyle]} />
        <Text style={[styles.liveText, { color: colors.success }]}>
          {isRefreshing ? 'Updating...' : `Live · ${count} rides`}
        </Text>
      </View>
      {hasSurge && (
        <View style={[styles.surgeBadge, { backgroundColor: colors.warningSoft }]}>
          <Text style={[styles.surgeText, { color: colors.warning }]}>↑ Surge</Text>
        </View>
      )}
    </View>
  );
}

function formatScheduleLabel(d: Date): string {
  const hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const now = new Date();
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  const day = isToday ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} at ${h12}:${mins} ${ampm}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const sheetRef = useRef<any>(null);
  const { location } = useLocation();
  const { colors } = useThemeStore();
  const [alertVisible, setAlertVisible] = useState(false);
  const {
    origin,
    destination,
    originLabel,
    destLabel,
    selectedPickupId,
    scheduledTime,
    setOrigin,
    setDestination,
    setPickup,
    setFilter,
    selectedFilter,
    selectQuote,
    setScheduledTime,
  } = useRideStore();
  const { quotes, cheapest, fastest, isLoading, counts, isRefreshing, allQuotes, hasSurge, refetch, isError } = useQuotes();
  const { pickupPoints } = usePickupPoints(location);
  const { loadPlaces } = usePlacesStore();
  const { loadRoutes, recordRoute } = useRoutesStore();

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    triggerHaptic('light');
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    triggerHaptic('success');
  }, [refetch]);

  useEffect(() => {
    if (location && !origin) {
      setOrigin(location, 'Your location');
    }
  }, [location]);

  useEffect(() => {
    loadPlaces();
    loadRoutes();
  }, []);

  const snapPoints = ['30%', '65%', '92%'];

  const handleDestinationSelect = useCallback(
    (loc: any, label: string) => {
      setDestination(loc, label);
      // Record route for favourites
      if (origin && originLabel) {
        recordRoute({ origin, originLabel, destination: loc, destLabel: label });
      }
    },
    [origin, originLabel],
  );

  const handleRouteSelect = useCallback(
    (orig: any, origLabel: string, dest: any, dLabel: string) => {
      setOrigin(orig, origLabel);
      setDestination(dest, dLabel);
      recordRoute({ origin: orig, originLabel: origLabel, destination: dest, destLabel: dLabel });
    },
    [],
  );

  const handleSavedPlaceSelect = useCallback(
    (loc: any, label: string) => {
      setDestination(loc, label);
      if (origin && originLabel) {
        recordRoute({ origin, originLabel, destination: loc, destLabel: label });
      }
    },
    [origin, originLabel],
  );

  const handleRidePress = useCallback(
    (q: any) => {
      selectQuote(q);
      router.push('/ride/compare');
    },
    [],
  );

  const content = (
    <View style={[styles.sheetContent, { backgroundColor: colors.bg }]}>
      {/* Greeting header */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={[styles.greetingText, { color: colors.text }]}>{getGreeting()} 👋</Text>
          <Text style={[styles.greetingSub, { color: colors.textMuted }]}>Where are you heading?</Text>
        </View>
      </View>

      <View style={[styles.routeContainer, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <LinearGradient
          colors={[colors.gradient1 + '08', colors.gradient2 + '04', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.routeGradient}
        />
        <View style={styles.routeHeader}>
          <Pressable
            style={[styles.scheduleChip, { backgroundColor: scheduledTime ? colors.accent + '18' : colors.chipBg }]}
            onPress={() => { triggerHaptic('light'); router.push('/ride/schedule'); }}
            accessibilityRole="button"
            accessibilityLabel={scheduledTime ? `Scheduled: ${formatScheduleLabel(scheduledTime)}` : 'Schedule a ride'}
          >
            <Text style={styles.scheduleChipIcon}>🕐</Text>
            <Text style={[styles.scheduleChipText, { color: scheduledTime ? colors.accent : colors.textMuted }]} numberOfLines={1}>
              {scheduledTime ? formatScheduleLabel(scheduledTime) : 'Later'}
            </Text>
          </Pressable>
        </View>
        <LocationRow type="origin" label={originLabel || 'Locating...'} />
        <View style={[styles.routeDivider, { backgroundColor: colors.borderLight }]} />
        <DestinationSearch
          onSelect={handleDestinationSelect}
          currentLabel={destLabel || undefined}
        />
      </View>

      {!destination && (
        <>
          <SavedPlaces onSelect={handleSavedPlaceSelect} />
          <FavouriteRoutes onSelect={handleRouteSelect} />
          <SurgeChart />
        </>
      )}

      {destination && (
        <>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionTile, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
              onPress={() => { triggerHaptic('light'); router.push('/ride/pickup'); }}
            >
              <LinearGradient
                colors={[colors.gradient1 + '18', colors.gradient2 + '08']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.tileGradient}
              />
              <View style={styles.tileBody}>
                <PinIcon color={colors.accent} bg={colors.chipBg} />
                <View style={styles.tileText}>
                  <Text style={[styles.actionLabel, { color: colors.accent }]}>SMART PICKUP</Text>
                  <Text style={[styles.actionTitle, { color: colors.text }]} numberOfLines={1}>
                    {selectedPickupId ? 'Set' : 'Save money'}
                  </Text>
                  <Text style={[styles.actionSub, { color: colors.textMuted }]} numberOfLines={1}>
                    {selectedPickupId ? originLabel : `${pickupPoints.length} spots nearby`}
                  </Text>
                </View>
              </View>
              <View style={styles.tileArrow}>
                <Text style={[styles.arrowText, { color: colors.textMuted }]}>›</Text>
              </View>
            </Pressable>
          </View>

          {cheapest && (
            <QuickBookButton cheapest={cheapest} fastest={fastest} />
          )}

          <LiveBadge count={allQuotes.length} isRefreshing={isRefreshing} hasSurge={hasSurge} />

          <View style={styles.filterRow}>
            <FilterChips
              active={selectedFilter}
              onChange={setFilter}
              counts={counts}
            />
            <Pressable
              style={[styles.alertBtn, { backgroundColor: colors.warningSoft }]}
              onPress={() => { triggerHaptic('light'); setAlertVisible(true); }}
              hitSlop={8}
            >
              <Text style={styles.alertIcon}>🔔</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <SkeletonQuoteList count={4} />
          ) : isError ? (
            <ErrorCard onRetry={() => refetch()} />
          ) : quotes.length > 0 ? (
            quotes.map((q, i) => (
              <RideCard
                key={`${q.provider}-${q.productId}`}
                quote={q}
                isBest={i === 0 && selectedFilter === 'cheapest'}
                index={i}
                onPress={() => handleRidePress(q)}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No rides found</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Try another category or adjust your route
              </Text>
            </View>
          )}
        </>
      )}
      <PriceAlertSheet visible={alertVisible} onClose={() => setAlertVisible(false)} />
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
          backgroundStyle={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: radii.xxl,
            borderTopRightRadius: radii.xxl,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 1,
            shadowRadius: 24,
            elevation: 12,
          }}
          handleIndicatorStyle={{
            backgroundColor: colors.border,
            width: 40,
            height: 4,
            borderRadius: 2,
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          >
            {content}
          </ScrollView>
        </BottomSheet>
      ) : (
        <ScrollView
          style={[styles.webPanel, { backgroundColor: colors.bg }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          {content}
        </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  greetingSub: {
    ...typography.callout,
    marginTop: 2,
  },
  routeContainer: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
    ...shadows.md,
  },
  routeGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  scheduleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  scheduleChipIcon: {
    fontSize: 12,
  },
  scheduleChipText: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 140,
  },
  routeDivider: {
    height: 1,
    marginVertical: 2,
  },
  webPanel: {
    maxHeight: '60%',
    borderTopWidth: 0,
  },
  liveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    ...typography.micro,
  },
  surgeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  surgeText: {
    ...typography.micro,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alertBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIcon: {
    fontSize: 16,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.headline,
    marginBottom: 4,
  },
  emptyText: {
    ...typography.callout,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  actionTile: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  tileGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
  },
  tileBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  tileText: {
    flex: 1,
  },
  tileArrow: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '300',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* pin icon */
  pinWrap: {
    alignItems: 'center',
  },
  pinHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pinNeedle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  pinShadow: {
    position: 'absolute',
    bottom: 6,
    width: 10,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.15,
  },
  /* clock icon */
  clockFace: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  clockHand: {
    width: 1.5,
    height: 7,
    borderRadius: 1,
    marginTop: 2.5,
    transformOrigin: 'bottom',
  },
  clockCenter: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    top: 7,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  actionSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
});
