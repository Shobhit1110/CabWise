import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { launchProviderApp } from '../../utils/deepLink';
import { useRideStore } from '../../store/rideStore';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { usePressAnimation, usePulse } from '../../utils/animations';
import { triggerHaptic } from '../../utils/haptics';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import type { Quote } from '../../types';

const PROVIDER_LOGOS: Record<string, any> = {
  uber: require('../../assets/providers/uber.png'),
  bolt: require('../../assets/providers/bolt.png'),
  freenow: require('../../assets/providers/freenow.png'),
  wheely: require('../../assets/providers/wheely.png'),
};

interface QuickBookButtonProps {
  cheapest: Quote | null;
  fastest?: Quote | null;
}

function QuickOption({ quote, label, highlight, onPress }: { quote: Quote; label: string; highlight: string; onPress: () => void }) {
  const { colors } = useThemeStore();
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressAnimation();

  return (
    <Animated.View style={[{ flex: 1 }, pressStyle]}>
      <Pressable
        style={[optStyles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${quote.name} for ${quote.priceDisplay}`}
      >
        <View style={optStyles.header}>
          {PROVIDER_LOGOS[quote.provider] ? (
            <Image source={PROVIDER_LOGOS[quote.provider]} style={optStyles.logo} />
          ) : (
            <View style={[optStyles.logoDot, { backgroundColor: colors.accent }]} />
          )}
          <Text style={[optStyles.label, { color: colors.textMuted }]}>{label}</Text>
        </View>
        <Text style={[optStyles.highlight, { color: colors.text }]}>{highlight}</Text>
        <Text style={[optStyles.detail, { color: colors.textMuted }]}>
          {quote.name} · {Math.round(quote.etaSeconds / 60)} min
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const optStyles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  logo: {
    width: 20,
    height: 20,
    borderRadius: 6,
    resizeMode: 'contain',
  },
  logoDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  label: {
    ...typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 20,
  },
  highlight: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  detail: {
    ...typography.micro,
    marginTop: 2,
  },
});

export function QuickBookButton({ cheapest, fastest }: QuickBookButtonProps) {
  const [locked, setLocked] = useState<Quote | null>(null);
  const [countdown, setCountdown] = useState(90);
  const { origin, destination } = useRideStore();
  const { colors } = useThemeStore();
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressAnimation();

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
      requireAuth(() => {
        triggerHaptic('medium');
        setLocked(cheapest);
        setCountdown(90);
      });
    }
  };

  const handleConfirm = async () => {
    if (!locked || !origin || !destination) return;
    try {
      triggerHaptic('success');
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

  const showFastest = !!fastest;
  const progressPct = (countdown / 90) * 100;

  if (locked) {
    return (
      <View style={[styles.lockedContainer, { backgroundColor: colors.successSoft, borderColor: colors.success }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.success, width: `${progressPct}%` }]} />
        <View style={styles.lockedInfo}>
          <View style={styles.lockedTop}>
            <Text style={[styles.lockedPrice, { color: colors.text }]}>{locked.priceDisplay}</Text>
            <View style={[styles.timerBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.timerText}>{countdown}s</Text>
            </View>
          </View>
          <Text style={[styles.lockedDetail, { color: colors.textSecondary }]}>
            {locked.name} · Price locked
          </Text>
        </View>
        <View style={styles.lockedButtons}>
          <Pressable
            style={[styles.cancelBtn, { backgroundColor: colors.chipBg }]}
            onPress={() => { setLocked(null); setCountdown(90); }}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
            <LinearGradient
              colors={[colors.success, '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmGradient}
            >
              <Text style={styles.confirmText}>Confirm Booking</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.quickRow}>
      <QuickOption
        quote={cheapest}
        label="Best price"
        highlight={cheapest.priceDisplay}
        onPress={handleQuickBook}
      />
      {showFastest && (
        <QuickOption
          quote={fastest}
          label="Fastest"
          highlight={`${Math.round(fastest.etaSeconds / 60)} min`}
          onPress={() => {
            requireAuth(() => {
              triggerHaptic('medium');
              setLocked(fastest);
              setCountdown(90);
            });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  lockedContainer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 2,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
    borderRadius: 2,
    opacity: 0.4,
  },
  lockedInfo: {
    marginBottom: spacing.md,
  },
  lockedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockedPrice: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  timerBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  timerText: {
    color: '#fff',
    ...typography.caption,
    fontWeight: '700',
  },
  lockedDetail: {
    ...typography.callout,
    marginTop: 3,
  },
  lockedButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.callout,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.md,
  },
  confirmText: {
    color: '#fff',
    ...typography.callout,
    fontWeight: '700',
  },
});
