import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { useScaleIn, usePressAnimation } from '../../utils/animations';
import type { PickupPoint, LatLng } from '../../types';

interface PickupSuggestionProps {
  points: PickupPoint[];
  selectedId: string | null;
  onSelect: (point: PickupPoint) => void;
  onReset: () => void;
}

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
        accessibilityLabel={`${point.name}, ${point.walkMinutes < 1 ? 'under 1' : Math.round(point.walkMinutes)} minute walk, save £${point.avgSavingGBP.toFixed(2)}${isSelected ? ', selected' : ''}`}
        accessibilityHint="Double tap to set as pickup point"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={[styles.walkBadge, { backgroundColor: isSelected ? colors.success : colors.chipBg }]}>
          <Text style={[styles.walkIcon, { color: isSelected ? '#fff' : colors.textSecondary }]}>↦</Text>
          <Text style={[styles.walkTime, { color: isSelected ? '#fff' : colors.textSecondary }]}>
            {point.walkMinutes < 1 ? '<1' : Math.round(point.walkMinutes)} min
          </Text>
        </View>
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
          {point.name}
        </Text>
        <View style={styles.savingsRow}>
          <Text style={[styles.saving, { color: colors.success }]}>
            Save £{point.avgSavingGBP.toFixed(2)}
          </Text>
        </View>
        <Text style={[styles.distance, { color: colors.textMuted }]}>
          {point.distanceMetres}m away
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function PickupSuggestion({
  points,
  selectedId,
  onSelect,
  onReset,
}: PickupSuggestionProps) {
  const { colors } = useThemeStore();
  if (points.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Smart Pickup</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Walk a bit, save more</Text>
        </View>
        {selectedId && (
          <Pressable onPress={onReset} style={[styles.resetBtn, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.resetText, { color: colors.accent }]}>◉ My location</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {points.map((p, i) => (
          <PickupCard
            key={p.id}
            point={p}
            isSelected={selectedId === p.id}
            onSelect={() => onSelect(p)}
            index={i}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    fontSize: 16,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
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
  scroll: {
    marginHorizontal: -spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    minWidth: 150,
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  walkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 3,
    marginBottom: spacing.sm,
  },
  walkIcon: {
    fontSize: 12,
  },
  walkTime: {
    ...typography.micro,
  },
  cardName: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  savingsRow: {
    marginBottom: 2,
  },
  saving: {
    fontSize: 16,
    fontWeight: '800',
  },
  distance: {
    ...typography.micro,
  },
});
