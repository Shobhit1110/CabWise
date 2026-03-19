import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useThemeStore } from '../../store/themeStore';
import type { LatLng, PickupPoint } from '../../types';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

/** Decode Google's encoded polyline into coordinate pairs */
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

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
  const mapRef = useRef<MapView>(null);
  const { colors } = useThemeStore();
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  const initialRegion = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : undefined;

  // Fetch directions route when origin/destination change
  useEffect(() => {
    if (!origin || !destination) {
      setRouteCoords([]);
      return;
    }

    if (!MAPS_KEY) {
      // Fallback: straight line
      setRouteCoords([
        { latitude: origin.lat, longitude: origin.lng },
        { latitude: destination.lat, longitude: destination.lng },
      ]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${encodeURIComponent(MAPS_KEY)}`;
        const res = await fetch(url);
        const json = await res.json();

        if (cancelled) return;

        if (json.routes?.[0]?.overview_polyline?.points) {
          const decoded = decodePolyline(json.routes[0].overview_polyline.points);
          setRouteCoords(decoded);
        } else {
          // Fallback to straight line
          setRouteCoords([
            { latitude: origin.lat, longitude: origin.lng },
            { latitude: destination.lat, longitude: destination.lng },
          ]);
        }
      } catch {
        if (!cancelled) {
          setRouteCoords([
            { latitude: origin.lat, longitude: origin.lng },
            { latitude: destination.lat, longitude: destination.lng },
          ]);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  // Fit to route markers
  useEffect(() => {
    if (!mapRef.current || !origin || !destination) return;

    const coords = [
      { latitude: origin.lat, longitude: origin.lng },
      { latitude: destination.lat, longitude: destination.lng },
    ];
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 60, bottom: 200, left: 60 },
      animated: true,
    });
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  if (!initialRegion) return <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]} />;

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={initialRegion}
      showsTraffic={true}
      showsMyLocationButton={false}
      customMapStyle={mapStyle}
    >
      {/* Origin marker */}
      {origin && (
        <Marker
          coordinate={{ latitude: origin.lat, longitude: origin.lng }}
          title="Pickup"
          pinColor="#10b981"
        />
      )}

      {/* Destination marker */}
      {destination && (
        <Marker
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          title="Drop-off"
          pinColor="#ef4444"
        />
      )}

      {/* Pickup points */}
      {pickupPoints.map((point) => (
        <Marker
          key={point.id}
          coordinate={{
            latitude: point.location.lat,
            longitude: point.location.lng,
          }}
          title={point.name}
          description={`Save £${point.avgSavingGBP}`}
          pinColor="#6366f1"
        />
      ))}

      {/* Route polyline */}
      {routeCoords.length > 1 && (
        <>
          {/* Shadow line */}
          <Polyline
            coordinates={routeCoords}
            strokeColor="rgba(0,0,0,0.1)"
            strokeWidth={6}
          />
          {/* Main route line */}
          <Polyline
            coordinates={routeCoords}
            strokeColor={colors.accent}
            strokeWidth={4}
            lineDashPattern={undefined}
          />
        </>
      )}
    </MapView>
  );
}

// Subtle custom map style for a cleaner look
const mapStyle = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
];

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
  },
});
