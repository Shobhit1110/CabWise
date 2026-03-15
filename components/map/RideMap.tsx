import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import type { LatLng, PickupPoint } from '../../types';

interface RideMapProps {
  userLocation: LatLng | null;
  pickupPoints: PickupPoint[];
  origin: LatLng | null;
  destination: LatLng | null;
}

export function RideMap({
  userLocation,
  pickupPoints,
  origin,
  destination,
}: RideMapProps) {
  const initialRegion = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : undefined;

  if (!initialRegion) return <View style={styles.emptyContainer} />;

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={initialRegion}
      showsTraffic={true}
    >
      {userLocation && (
        <Marker
          coordinate={{
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          }}
          title="Your Location"
          pinColor="blue"
        />
      )}

      {pickupPoints.map((point) => (
        <Marker
          key={point.id}
          coordinate={{
            latitude: point.location.lat,
            longitude: point.location.lng,
          }}
          title={point.name}
          description={`Save £${point.avgSavingGBP}`}
          pinColor="green"
        />
      ))}

      {origin && destination && (
        <Polyline
          coordinates={[
            { latitude: origin.lat, longitude: origin.lng },
            { latitude: destination.lat, longitude: destination.lng },
          ]}
          strokeColor="#000"
          strokeWidth={2}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
