import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LatLng, PickupPoint } from '../../types';

interface RideMapProps {
  userLocation: LatLng | null;
  pickupPoints: PickupPoint[];
  origin: LatLng | null;
  destination: LatLng | null;
}

export function RideMap({ userLocation, pickupPoints, origin, destination }: RideMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Map View</Text>
      {userLocation && (
        <Text style={styles.coords}>
          Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </Text>
      )}
      {pickupPoints.length > 0 && (
        <Text style={styles.info}>{pickupPoints.length} pickup points nearby</Text>
      )}
      {origin && destination && (
        <Text style={styles.info}>Route set</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f4f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  coords: {
    fontSize: 13,
    color: '#777',
  },
  info: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
});
