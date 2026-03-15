import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import type { PickupPoint, LatLng } from '../../types';

interface PickupSuggestionProps {
  points: PickupPoint[];
  selectedId: string | null;
  onSelect: (point: PickupPoint) => void;
  onReset: () => void;
}

export function PickupSuggestion({
  points,
  selectedId,
  onSelect,
  onReset,
}: PickupSuggestionProps) {
  if (points.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Pickup Points</Text>
        {selectedId && (
          <Pressable onPress={onReset}>
            <Text style={styles.reset}>Use my location</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.subtitle}>Walk a bit, save on your ride</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {points.map((p) => (
          <Pressable
            key={p.id}
            style={[styles.card, selectedId === p.id && styles.cardActive]}
            onPress={() => onSelect(p)}
          >
            <Text style={styles.cardName} numberOfLines={1}>
              {p.name}
            </Text>
            <View style={styles.cardRow}>
              <Text style={styles.saving}>Save £{p.avgSavingGBP.toFixed(1)}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.detail}>
                {Math.round(p.avgWalkSecs / 60)} min walk
              </Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.detail}>{p.distanceMetres}m</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    marginBottom: 8,
  },
  reset: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  scroll: {
    marginHorizontal: -16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    backgroundColor: '#f8faf8',
    borderRadius: 10,
    padding: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  saving: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  detail: {
    fontSize: 11,
    color: '#666',
  },
  dot: {
    fontSize: 11,
    color: '#ccc',
    marginHorizontal: 4,
  },
});
