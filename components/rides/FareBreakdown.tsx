import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeStore, spacing, radii, typography } from '../../store/themeStore';
import type { FareBreakdown as FareBreakdownType } from '../../types';

interface FareBreakdownProps {
  breakdown: FareBreakdownType;
  currency?: string;
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const { colors } = useThemeStore();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: highlight ? colors.warning : colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: highlight ? colors.warning : colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

export function FareBreakdown({ breakdown, currency = '£' }: FareBreakdownProps) {
  const [open, setOpen] = useState(false);
  const { colors } = useThemeStore();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setOpen(!open)} style={styles.toggle}>
        <Text style={[styles.toggleText, { color: colors.accent }]}>
          {open ? 'Hide details' : 'Fare details'}
        </Text>
        <Text style={[styles.arrow, { color: colors.accent }]}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View style={[styles.details, { backgroundColor: colors.bgSecondary }]}>
          <Row label="Base fare" value={`${currency}${breakdown.baseFare.toFixed(2)}`} />
          <Row label="Distance" value={`${currency}${breakdown.distanceCharge.toFixed(2)}`} />
          <Row label="Time" value={`${currency}${breakdown.timeCharge.toFixed(2)}`} />
          {breakdown.surgePremium > 0 && (
            <Row label="Surge premium" value={`${currency}${breakdown.surgePremium.toFixed(2)}`} highlight />
          )}
          {breakdown.tolls > 0 && (
            <Row label="Tolls & charges" value={`${currency}${breakdown.tolls.toFixed(2)}`} />
          )}
          <Row label="Booking fee" value={`${currency}${breakdown.bookingFee.toFixed(2)}`} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Estimated total</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>{`${currency}${breakdown.total.toFixed(2)}`}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toggleText: {
    ...typography.caption,
  },
  arrow: {
    fontSize: 8,
  },
  details: {
    marginTop: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowLabel: {
    ...typography.caption,
  },
  rowValue: {
    ...typography.caption,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  totalLabel: {
    ...typography.callout,
    fontWeight: '700',
  },
  totalValue: {
    ...typography.callout,
    fontWeight: '700',
  },
});
