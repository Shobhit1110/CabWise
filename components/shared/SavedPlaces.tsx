import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { usePlacesStore, type SavedPlace } from '../../store/placesStore';
import { triggerHaptic } from '../../utils/haptics';
import type { LatLng } from '../../types';

const PLACE_ICONS: Record<SavedPlace['type'], string> = {
  home: '⌂',
  work: '◻',
  custom: '★',
};

interface Props {
  onSelect: (location: LatLng, label: string) => void;
}

export function SavedPlaces({ onSelect }: Props) {
  const { places, addPlace, removePlace } = usePlacesStore();
  const { colors } = useThemeStore();

  const home = places.find((p) => p.type === 'home');
  const work = places.find((p) => p.type === 'work');
  const custom = places.filter((p) => p.type === 'custom');

  const handlePress = (place: SavedPlace) => {
    triggerHaptic('light');
    onSelect(place.location, place.label);
  };

  const handleLongPress = (place: SavedPlace) => {
    triggerHaptic('warning');
    Alert.alert(
      'Remove Place',
      `Remove "${place.label}" from saved places?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removePlace(place.id),
        },
      ],
    );
  };

  const quickSlots = [
    { type: 'home' as const, place: home, emptyLabel: 'Set Home' },
    { type: 'work' as const, place: work, emptyLabel: 'Set Work' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.quickRow}>
        {quickSlots.map(({ type, place, emptyLabel }) => (
          <Pressable
            key={type}
            style={[styles.quickChip, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => place && handlePress(place)}
            onLongPress={() => place && handleLongPress(place)}
            accessibilityRole="button"
            accessibilityLabel={place ? `Go to ${place.label}` : emptyLabel}
          >
            <Text style={styles.chipIcon}>{PLACE_ICONS[type]}</Text>
            <Text
              style={[
                styles.chipLabel,
                { color: place ? colors.text : colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {place ? place.label : emptyLabel}
            </Text>
          </Pressable>
        ))}
      </View>

      {custom.length > 0 && (
        <View style={styles.customRow}>
          {custom.map((place) => (
            <Pressable
              key={place.id}
              style={[styles.customChip, { backgroundColor: colors.chipBg }]}
              onPress={() => handlePress(place)}
              onLongPress={() => handleLongPress(place)}
              accessibilityRole="button"
              accessibilityLabel={`Go to ${place.label}`}
            >
              <Text style={styles.customIcon}>★</Text>
              <Text style={[styles.customLabel, { color: colors.text }]} numberOfLines={1}>
                {place.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipLabel: {
    ...typography.callout,
    flex: 1,
  },
  customRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  customIcon: {
    fontSize: 12,
  },
  customLabel: {
    ...typography.caption,
  },
});
