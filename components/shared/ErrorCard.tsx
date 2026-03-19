import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { triggerHaptic } from '../../utils/haptics';

interface Props {
  message?: string;
  onRetry: () => void;
}

export function ErrorCard({ message, onRetry }: Props) {
  const { colors } = useThemeStore();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}
      accessibilityRole="alert"
      accessibilityLabel={`Error: ${message || 'Failed to load rides'}. Tap retry to try again.`}
    >
      <Text style={styles.icon}>!</Text>
      <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message || 'Failed to load ride quotes. Check your connection and try again.'}
      </Text>
      <Pressable
        style={styles.retryBtn}
        onPress={() => { triggerHaptic('medium'); onRetry(); }}
        accessibilityRole="button"
        accessibilityLabel="Retry loading rides"
      >
        <LinearGradient
          colors={[colors.danger, '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.retryGradient}
        >
          <Text style={styles.retryText}>Retry</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginVertical: spacing.md,
  },
  icon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryBtn: {
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  retryGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  retryText: {
    color: '#fff',
    ...typography.callout,
    fontWeight: '600',
  },
});
