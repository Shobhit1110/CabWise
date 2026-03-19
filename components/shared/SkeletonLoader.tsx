import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useThemeStore, spacing, radii } from '../../store/themeStore';

/** A single shimmer bar */
function ShimmerBar({ width, height = 14, style }: { width: number | string; height?: number; style?: any }) {
  const { colors } = useThemeStore();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      true,
    );
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: height / 2,
          backgroundColor: colors.shimmer,
        },
        barStyle,
        style,
      ]}
    />
  );
}

/** Skeleton mimicking a RideCard */
function SkeletonCard() {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      {/* Top row: provider + price */}
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.providerRow}>
            <ShimmerBar width={10} height={10} style={{ borderRadius: 5 }} />
            <ShimmerBar width={100} height={14} />
          </View>
          <ShimmerBar width={70} height={10} style={{ marginTop: 6, marginLeft: 18 }} />
        </View>
        <View style={styles.right}>
          <ShimmerBar width={60} height={20} />
          <ShimmerBar width={40} height={10} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Info row */}
      <View style={[styles.infoRow, { backgroundColor: colors.bgSecondary }]}>
        <ShimmerBar width={60} height={12} />
        <ShimmerBar width={80} height={12} />
      </View>
    </View>
  );
}

/** Full skeleton list replacing loading spinner */
export function SkeletonQuoteList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  left: {
    flex: 1,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  right: {
    alignItems: 'flex-end',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
});
