import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { usePickupPoints } from '../../hooks/usePickupPoints';
import { useRideStore } from '../../store/rideStore';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { useScaleIn, usePressAnimation, useFadeInUp } from '../../utils/animations';
import { triggerHaptic } from '../../utils/haptics';
import type { PickupPoint } from '../../types';

function PickupCard({
  point,
  isSelected,
  onSelect,
  index,
}: {
  point: PickupPoint;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const { colors } = useThemeStore();
  const scaleStyle = useScaleIn(index * 80);
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressAnimation();

  return (
    <Animated.View style={[scaleStyle, pressStyle]}>
      <Pressable
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.shadow },
          isSelected && { borderColor: colors.success, borderWidth: 2, backgroundColor: colors.successSoft },
        ]}
        onPress={onSelect}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${point.name}, ${point.walkMinutes < 1 ? 'under 1' : Math.round(point.walkMinutes)} minute walk, save £${point.avgSavingGBP.toFixed(2)}`}
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.cardRow}>
          <View style={[styles.walkBadge, { backgroundColor: isSelected ? colors.success : colors.chipBg }]}>  
            <Text style={[styles.walkIcon, { color: isSelected ? '#fff' : colors.textSecondary }]}>↦</Text>
            <Text style={[styles.walkTime, { color: isSelected ? '#fff' : colors.textSecondary }]}>
              {point.walkMinutes < 1 ? '<1' : Math.round(point.walkMinutes)} min
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
              {point.name}
            </Text>
            <Text style={[styles.distance, { color: colors.textMuted }]}>
              {point.distanceMetres}m away
            </Text>
          </View>
          <Text style={[styles.saving, { color: colors.success }]}>
            Save £{point.avgSavingGBP.toFixed(2)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function PickupScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const { colors } = useThemeStore();
  const { selectedPickupId, setOrigin, setPickup } = useRideStore();
  const { pickupPoints } = usePickupPoints(location);
  const headerStyle = useFadeInUp();

  const handleSelect = (point: PickupPoint) => {
    triggerHaptic('medium');
    setOrigin(point.location, point.name);
    setPickup(point.id);
  };

  const handleReset = () => {
    if (location) {
      triggerHaptic('light');
      setOrigin(location, 'Your location');
      setPickup(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Animated.View style={headerStyle}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
          </Pressable>
          {selectedPickupId && (
            <Pressable onPress={handleReset} style={[styles.resetBtn, { backgroundColor: colors.chipBg }]}>
              <Text style={[styles.resetText, { color: colors.accent }]}>◉ My location</Text>
            </Pressable>
          )}
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Smart Pickup</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Walk a short distance to a better pickup spot and save on your fare
        </Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {pickupPoints.length > 0 ? (
          pickupPoints.map((p, i) => (
            <PickupCard
              key={p.id}
              point={p}
              isSelected={selectedPickupId === p.id}
              onSelect={() => handleSelect(p)}
              index={i}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>📍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No pickup points nearby</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              We'll suggest better spots when they're available
            </Text>
          </View>
        )}
      </ScrollView>

      {selectedPickupId && (
        <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.borderLight }]}>
          <Pressable
            style={[styles.confirmBtn, { backgroundColor: colors.accent }]}
            onPress={() => { triggerHaptic('success'); router.back(); }}
          >
            <Text style={styles.confirmText}>Use this pickup</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  backBtn: {
    paddingVertical: spacing.sm,
  },
  backText: {
    ...typography.callout,
    fontWeight: '600',
  },
  resetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  resetText: {
    ...typography.caption,
    fontWeight: '600',
  },
  title: {
    ...typography.title,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  subtitle: {
    ...typography.callout,
    paddingHorizontal: spacing.xl,
    marginTop: 4,
    paddingBottom: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  walkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 3,
  },
  walkIcon: {
    fontSize: 12,
  },
  walkTime: {
    ...typography.micro,
    fontWeight: '600',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    ...typography.body,
    fontWeight: '600',
  },
  distance: {
    ...typography.micro,
    marginTop: 1,
  },
  saving: {
    fontSize: 15,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.callout,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: radii.full,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    ...typography.callout,
    fontWeight: '700',
    fontSize: 16,
  },
});
