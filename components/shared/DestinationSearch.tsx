import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
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
    location: null, // resolved on select via Place Details
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

  const hasApiKey = MAPS_KEY && MAPS_KEY !== 'AIza...';

  // Debounced Places autocomplete
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

  // Fallback: filter hardcoded list when no API key
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
      // Resolve lat/lng from Google Place Details
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
        <View style={[styles.dot, styles.dotDest]} />
        <Text style={styles.selectedText} numberOfLines={1}>
          {currentLabel}
        </Text>
        <Text style={styles.change}>Change</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={[styles.dot, styles.dotDest]} />
        <TextInput
          style={styles.input}
          placeholder="Where to?"
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setExpanded(true)}
        />
        {expanded && (
          <Pressable
            onPress={() => {
              setExpanded(false);
              setQuery('');
            }}
          >
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        )}
      </View>
      {expanded && (
        <View style={styles.dropdown}>
          <Text style={styles.sectionTitle}>
            {hasApiKey && query.length >= 3 ? 'Search results' : 'Popular destinations'}
          </Text>
          {searching && (
            <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 12 }} />
          )}
          {!searching && results.map((d) => (
            <Pressable
              key={d.id}
              style={styles.item}
              onPress={() => handleSelect(d)}
            >
              <Text style={styles.itemName}>{d.name}</Text>
              <Text style={styles.itemArea}>{d.area}</Text>
            </Pressable>
          ))}
          {!searching && results.length === 0 && (
            <Text style={styles.empty}>No matching destinations</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dotDest: {
    backgroundColor: '#ef4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    paddingVertical: 4,
  },
  cancel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedText: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
  change: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  dropdown: {
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 15,
    color: '#111',
  },
  itemArea: {
    fontSize: 12,
    color: '#999',
  },
  empty: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
