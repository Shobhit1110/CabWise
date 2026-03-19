import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore, spacing, radii, typography } from '../../store/themeStore';
import { usePressAnimation } from '../../utils/animations';
import { triggerHaptic } from '../../utils/haptics';
import type { Filter } from '../../utils/pickupScore';

interface FilterChipsProps {
  active: Filter;
  onChange: (filter: Filter) => void;
  counts?: Record<Filter, number>;
}

const FILTERS: { label: string; value: Filter; icon: string }[] = [
  { label: 'Recommended', value: 'cheapest', icon: '' },
  { label: 'Fastest', value: 'fastest', icon: '' },
  { label: 'Shared', value: 'shared', icon: '' },
  { label: 'Premium', value: 'premium', icon: '' },
  { label: 'Green', value: 'electric', icon: '' },
];

function Chip({
  filter,
  isActive,
  count,
  disabled,
  onPress,
}: {
  filter: typeof FILTERS[number];
  isActive: boolean;
  count: number | undefined;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeStore();
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.chip,
          !isActive && { backgroundColor: colors.chipBg },
          isActive && { overflow: 'hidden' as const },
          disabled && styles.chipDisabled,
        ]}
        onPress={() => { if (!disabled) { triggerHaptic('selection'); onPress(); } }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${filter.label} filter${count !== undefined ? `, ${count} rides` : ''}${isActive ? ', selected' : ''}`}
        accessibilityState={{ selected: isActive, disabled }}
      >
        {isActive && (
          <LinearGradient
            colors={[colors.gradient1, colors.gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <Text
          style={[
            styles.label,
            { color: colors.textSecondary },
            isActive && { color: '#fff' },
            disabled && { color: colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {filter.label}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.border }]}>
            <Text style={[styles.count, { color: isActive ? '#fff' : colors.textMuted }]}>{count}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function FilterChips({ active, onChange, counts }: FilterChipsProps) {
  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const count = counts?.[filter.value];
        const isActive = active === filter.value;
        const disabled = count === 0 && filter.value !== 'cheapest' && filter.value !== 'fastest';

        return (
          <Chip
            key={filter.value}
            filter={filter}
            isActive={isActive}
            count={count}
            disabled={disabled}
            onPress={() => onChange(filter.value)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipIcon: {
    fontSize: 12,
  },
  label: {
    ...typography.caption,
  },
  countBadge: {
    borderRadius: radii.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  count: {
    ...typography.micro,
  },
});
