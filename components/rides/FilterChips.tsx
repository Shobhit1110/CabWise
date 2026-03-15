import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { Filter } from '../../utils/pickupScore';

interface FilterChipsProps {
  active: Filter;
  onChange: (filter: Filter) => void;
  counts?: Record<Filter, number>;
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Cheapest', value: 'cheapest' },
  { label: 'Fastest', value: 'fastest' },
  { label: 'Shared', value: 'shared' },
  { label: 'Premium', value: 'premium' },
  { label: 'Electric', value: 'electric' },
];

export function FilterChips({ active, onChange, counts }: FilterChipsProps) {
  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const count = counts?.[filter.value];
        const isActive = active === filter.value;
        const disabled = count === 0 && filter.value !== 'cheapest' && filter.value !== 'fastest';

        return (
          <Pressable
            key={filter.value}
            style={[
              styles.chip,
              isActive && styles.chipActive,
              disabled && styles.chipDisabled,
            ]}
            onPress={() => !disabled && onChange(filter.value)}
          >
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
                disabled && styles.labelDisabled,
              ]}
              numberOfLines={1}
            >
              {filter.label}
            </Text>
            {count !== undefined && count > 0 && (
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text style={[styles.count, isActive && styles.countActive]}>{count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 4,
  },
  chipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  labelActive: {
    color: '#fff',
  },
  labelDisabled: {
    color: '#999',
  },
  countBadge: {
    backgroundColor: '#ddd',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  count: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
  countActive: {
    color: '#fff',
  },
});
