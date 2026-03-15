import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { launchProviderApp } from '../../utils/deepLink';
import { useRideStore } from '../../store/rideStore';
import type { Quote } from '../../types';

interface QuickBookButtonProps {
  cheapest: Quote | null;
}

export function QuickBookButton({ cheapest }: QuickBookButtonProps) {
  const [locked, setLocked] = useState<Quote | null>(null);
  const [countdown, setCountdown] = useState(90);
  const { origin, destination } = useRideStore();

  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      setCountdown((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setLocked(null);
          return 90;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleQuickBook = () => {
    if (cheapest) {
      setLocked(cheapest);
      setCountdown(90);
    }
  };

  const handleConfirm = async () => {
    if (!locked || !origin || !destination) return;
    try {
      await launchProviderApp(locked, origin, destination);
    } catch {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Open Provider App',
          `This would open ${locked.name} to book your ride for ${locked.priceDisplay}.`,
        );
      }
    }
    setLocked(null);
    setCountdown(90);
  };

  if (!cheapest) return null;

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <View style={styles.lockedInfo}>
          <Text style={styles.lockedPrice}>{locked.priceDisplay}</Text>
          <Text style={styles.lockedDetail}>
            {locked.name} · Price locked for {countdown}s
          </Text>
        </View>
        <View style={styles.lockedButtons}>
          <Pressable
            style={styles.cancelBtn}
            onPress={() => { setLocked(null); setCountdown(90); }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Confirm Booking</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable style={styles.bookBtn} onPress={handleQuickBook}>
      <View style={styles.bookContent}>
        <View>
          <Text style={styles.bookLabel}>Quick Book — Cheapest ride</Text>
          <Text style={styles.bookDetail}>
            {cheapest.name} · {cheapest.priceDisplay} · {Math.round(cheapest.etaSeconds / 60)} min
          </Text>
        </View>
        <Text style={styles.bookArrow}>→</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bookBtn: {
    backgroundColor: '#111',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 20,
  },
  bookContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  bookDetail: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  bookArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  lockedContainer: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  lockedInfo: {
    marginBottom: 12,
  },
  lockedPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  lockedDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  lockedButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
