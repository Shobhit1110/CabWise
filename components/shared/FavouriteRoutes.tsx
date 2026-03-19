import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { useRoutesStore, type FavouriteRoute } from '../../store/routesStore';
import { triggerHaptic } from '../../utils/haptics';
import type { LatLng } from '../../types';

interface Props {
  onSelect: (origin: LatLng, originLabel: string, dest: LatLng, destLabel: string) => void;
}

export function FavouriteRoutes({ onSelect }: Props) {
  const { routes, removeRoute } = useRoutesStore();
  const { colors } = useThemeStore();

  if (routes.length === 0) return null;

  const handlePress = (route: FavouriteRoute) => {
    triggerHaptic('light');
    onSelect(route.origin, route.originLabel, route.destination, route.destLabel);
  };

  const handleLongPress = (route: FavouriteRoute) => {
    triggerHaptic('warning');
    Alert.alert(
      'Remove Route',
      `Remove "${route.originLabel} → ${route.destLabel}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeRoute(route.id),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textMuted }]}>FREQUENT ROUTES</Text>
      <View style={styles.list}>
        {routes.slice(0, 5).map((route) => (
          <Pressable
            key={route.id}
            style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => handlePress(route)}
            onLongPress={() => handleLongPress(route)}
            accessibilityRole="button"
            accessibilityLabel={`${route.originLabel} to ${route.destLabel}, used ${route.useCount} times`}
          >
            <View style={styles.routeInfo}>
              <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
                {route.originLabel}
              </Text>
              <Text style={[styles.arrow, { color: colors.textMuted }]}>→</Text>
              <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
                {route.destLabel}
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.countText, { color: colors.accent }]}>
                {route.useCount}×
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  heading: {
    ...typography.micro,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    ...shadows.sm,
  },
  routeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routeText: {
    ...typography.caption,
    flex: 1,
  },
  arrow: {
    ...typography.caption,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginLeft: spacing.sm,
  },
  countText: {
    ...typography.micro,
  },
});
