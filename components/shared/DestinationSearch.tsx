import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Constants from 'expo-constants';
import { useThemeStore, spacing, radii, typography } from '../../store/themeStore';
import type { LatLng } from '../../types';

interface Destination {
  id: string;
  name: string;
  area: string;
  location: LatLng;
}

const POPULAR: Destination[] = [
  { id: '1', name: 'Heathrow Airport', area: 'Hounslow', location: { lat: 51.47, lng: -0.4543 } },
  { id: '2', name: 'Kings Cross Station', area: 'Camden', location: { lat: 51.5322, lng: -0.124 } },
  { id: '3', name: 'Canary Wharf', area: 'Tower Hamlets', location: { lat: 51.5054, lng: -0.0235 } },
  { id: '4', name: 'Westminster', area: 'City of Westminster', location: { lat: 51.4975, lng: -0.1357 } },
  { id: '5', name: 'London Bridge', area: 'Southwark', location: { lat: 51.5079, lng: -0.0877 } },
  { id: '6', name: 'Paddington Station', area: 'City of Westminster', location: { lat: 51.5154, lng: -0.1755 } },
  { id: '7', name: 'Shoreditch High St', area: 'Hackney', location: { lat: 51.5233, lng: -0.0755 } },
  { id: '8', name: 'Camden Town', area: 'Camden', location: { lat: 51.5392, lng: -0.1426 } },
];

const MAPS_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_KEY
  ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY
  ?? '';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

async function searchPlaces(query: string): Promise<Destination[]> {
  if (!MAPS_KEY || MAPS_KEY === 'AIza...') return [];
  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
    `?input=${encodeURIComponent(query)}` +
    `&components=country:gb` +
    `&types=geocode|establishment` +
    `&key=${MAPS_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.predictions || []).map((p: PlacePrediction) => ({
    id: p.place_id,
    name: p.structured_formatting.main_text,
    area: p.structured_formatting.secondary_text || '',
    location: null,
  }));
}

async function getPlaceLocation(placeId: string): Promise<LatLng | null> {
  if (!MAPS_KEY || MAPS_KEY === 'AIza...') return null;
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}` +
    `&fields=geometry` +
    `&key=${MAPS_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const loc = data.result?.geometry?.location;
  if (!loc) return null;
  return { lat: loc.lat, lng: loc.lng };
}

interface DestinationSearchProps {
  onSelect: (location: LatLng, label: string) => void;
  currentLabel?: string;
}

export function DestinationSearch({ onSelect, currentLabel }: DestinationSearchProps) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [apiResults, setApiResults] = useState<Destination[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors } = useThemeStore();

  const hasApiKey = MAPS_KEY && MAPS_KEY !== 'AIza...';

  useEffect(() => {
    if (!hasApiKey || query.length < 3) {
      setApiResults([]);
      return;
    }
    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(query);
      setApiResults(results);
      setSearching(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const localResults = query
    ? POPULAR.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.area.toLowerCase().includes(query.toLowerCase()),
      )
    : POPULAR;

  const results = hasApiKey && query.length >= 3 ? apiResults : localResults;

  const handleSelect = async (dest: Destination) => {
    if (!dest.location && dest.id) {
      const loc = await getPlaceLocation(dest.id);
      if (loc) {
        onSelect(loc, dest.name);
      }
    } else if (dest.location) {
      onSelect(dest.location, dest.name);
    }
    setQuery('');
    setExpanded(false);
    setApiResults([]);
  };

  if (currentLabel && !expanded) {
    return (
      <Pressable style={styles.selected} onPress={() => setExpanded(true)}>
        <View style={styles.destIconCol}>
          <View style={[styles.destDot, { backgroundColor: colors.danger }]}>
            <View style={styles.destDotInner} />
          </View>
        </View>
        <View style={styles.selectedTextCol}>
          <Text style={[styles.typeLabel, { color: colors.textMuted }]}>DROP-OFF</Text>
          <Text style={[styles.selectedText, { color: colors.text }]} numberOfLines={1}>
            {currentLabel}
          </Text>
        </View>
        <View style={[styles.changeBadge, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.changeText, { color: colors.accent }]}>Change</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={styles.destIconCol}>
          <View style={[styles.destDot, { backgroundColor: colors.danger }]}>
            <View style={styles.destDotInner} />
          </View>
        </View>
        <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Where to?"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setExpanded(true)}
          />
        </View>
        {expanded && (
          <Pressable
            onPress={() => { setExpanded(false); setQuery(''); }}
            style={[styles.cancelBtn, { backgroundColor: colors.chipBg }]}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>✕</Text>
          </Pressable>
        )}
      </View>
      {expanded && (
        <View style={[styles.dropdown, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {hasApiKey && query.length >= 3 ? 'SEARCH RESULTS' : 'POPULAR DESTINATIONS'}
          </Text>
          {searching && (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: spacing.md }} />
          )}
          {!searching && results.map((d) => (
            <Pressable
              key={d.id}
              style={[styles.item, { borderBottomColor: colors.borderLight }]}
              onPress={() => handleSelect(d)}
              accessibilityRole="button"
              accessibilityLabel={`${d.name}, ${d.area}`}
            >
              <View style={[styles.itemIcon, { backgroundColor: colors.chipBg }]}>
                <Text style={styles.itemEmoji}>📍</Text>
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemName, { color: colors.text }]}>{d.name}</Text>
                <Text style={[styles.itemArea, { color: colors.textMuted }]}>{d.area}</Text>
              </View>
            </Pressable>
          ))}
          {!searching && results.length === 0 && (
            <Text style={[styles.empty, { color: colors.textMuted }]}>No matching destinations</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  destIconCol: {
    width: 24,
    alignItems: 'center',
  },
  destDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destDotInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: 2,
  },
  cancelBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  selectedTextCol: {
    flex: 1,
  },
  typeLabel: {
    ...typography.micro,
    letterSpacing: 1,
    marginBottom: 2,
  },
  selectedText: {
    ...typography.body,
    fontWeight: '500',
  },
  changeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  changeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  dropdown: {
    paddingBottom: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.micro,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 16,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    fontWeight: '500',
  },
  itemArea: {
    ...typography.caption,
    marginTop: 1,
  },
  empty: {
    ...typography.callout,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
