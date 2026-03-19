import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';

// Mock hourly surge data — would come from surge_history table in production
const HOURLY_SURGE: { hour: number; multiplier: number }[] = [
  { hour: 0, multiplier: 1.0 }, { hour: 1, multiplier: 1.0 },
  { hour: 2, multiplier: 1.0 }, { hour: 3, multiplier: 1.0 },
  { hour: 4, multiplier: 1.0 }, { hour: 5, multiplier: 1.0 },
  { hour: 6, multiplier: 1.1 }, { hour: 7, multiplier: 1.4 },
  { hour: 8, multiplier: 1.6 }, { hour: 9, multiplier: 1.3 },
  { hour: 10, multiplier: 1.1 }, { hour: 11, multiplier: 1.0 },
  { hour: 12, multiplier: 1.1 }, { hour: 13, multiplier: 1.0 },
  { hour: 14, multiplier: 1.0 }, { hour: 15, multiplier: 1.1 },
  { hour: 16, multiplier: 1.2 }, { hour: 17, multiplier: 1.5 },
  { hour: 18, multiplier: 1.7 }, { hour: 19, multiplier: 1.4 },
  { hour: 20, multiplier: 1.2 }, { hour: 21, multiplier: 1.1 },
  { hour: 22, multiplier: 1.3 }, { hour: 23, multiplier: 1.5 },
];

const MAX_SURGE = Math.max(...HOURLY_SURGE.map((h) => h.multiplier));
const CHART_HEIGHT = 80;
const DISPLAY_HOURS = [0, 6, 9, 12, 17, 21];

function getBarColor(multiplier: number, accent: string, success: string, warning: string, danger: string) {
  if (multiplier <= 1.0) return success;
  if (multiplier <= 1.2) return accent;
  if (multiplier <= 1.5) return warning;
  return danger;
}

function getBestWindow(data: typeof HOURLY_SURGE): { start: number; end: number } {
  let bestStart = 0;
  let bestSum = Infinity;
  // Find best 3-hour window
  for (let i = 0; i <= data.length - 3; i++) {
    const sum = data[i].multiplier + data[i + 1].multiplier + data[i + 2].multiplier;
    if (sum < bestSum) {
      bestSum = sum;
      bestStart = i;
    }
  }
  return { start: bestStart, end: bestStart + 2 };
}

function formatHour(h: number): string {
  if (h === 0) return '12a';
  if (h < 12) return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
}

export function SurgeChart() {
  const { colors } = useThemeStore();
  const currentHour = new Date().getHours();
  const best = getBestWindow(HOURLY_SURGE);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
      accessibilityRole="summary"
      accessibilityLabel="Surge pricing chart showing best times to book"
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Best Time to Book</Text>
        <View style={[styles.bestBadge, { backgroundColor: colors.successSoft }]}>
          <Text style={[styles.bestText, { color: colors.success }]}>
            ● {formatHour(best.start)}–{formatHour(best.end + 1)}
          </Text>
        </View>
      </View>

      <View style={styles.chart}>
        {HOURLY_SURGE.map(({ hour, multiplier }) => {
          const height = (multiplier / MAX_SURGE) * CHART_HEIGHT;
          const barColor = getBarColor(multiplier, colors.accent, colors.success, colors.warning, colors.danger);
          const isCurrent = hour === currentHour;
          const isInBest = hour >= best.start && hour <= best.end;

          return (
            <View key={hour} style={styles.barCol}>
              <View style={[styles.bar, { height, backgroundColor: barColor, opacity: isInBest ? 1 : 0.5 }]}>
                {isCurrent && <View style={[styles.currentDot, { backgroundColor: colors.text }]} />}
              </View>
              {DISPLAY_HOURS.includes(hour) && (
                <Text style={[styles.hourLabel, { color: colors.textMuted }]}>
                  {formatHour(hour)}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>No surge</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>High</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.callout,
    fontWeight: '700',
  },
  bestBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  bestText: {
    ...typography.micro,
    fontWeight: '700',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 20,
    gap: 2,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    borderRadius: 2,
    alignItems: 'center',
    minHeight: 4,
  },
  currentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    top: -6,
  },
  hourLabel: {
    ...typography.micro,
    marginTop: 4,
    fontSize: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    ...typography.micro,
  },
});
