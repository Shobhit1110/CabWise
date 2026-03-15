import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { FareBreakdown as FareBreakdownType } from '../../types';

interface FareBreakdownProps {
  breakdown: FareBreakdownType;
  currency?: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function FareBreakdown({ breakdown, currency = '£' }: FareBreakdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setOpen(!open)} style={styles.toggle}>
        <Text style={styles.toggleText}>
          {open ? 'Hide fare details' : 'View fare details'}
        </Text>
        <Text style={styles.arrow}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View style={styles.details}>
          <Row label="Base fare" value={`${currency}${breakdown.baseFare.toFixed(2)}`} />
          <Row label="Distance" value={`${currency}${breakdown.distanceCharge.toFixed(2)}`} />
          <Row label="Time" value={`${currency}${breakdown.timeCharge.toFixed(2)}`} />
          {breakdown.surgePremium > 0 && (
            <Row label="Surge premium" value={`${currency}${breakdown.surgePremium.toFixed(2)}`} />
          )}
          {breakdown.tolls > 0 && (
            <Row label="Tolls & charges" value={`${currency}${breakdown.tolls.toFixed(2)}`} />
          )}
          <Row label="Booking fee" value={`${currency}${breakdown.bookingFee.toFixed(2)}`} />
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.totalValue}>{`${currency}${breakdown.total.toFixed(2)}`}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 8,
    color: '#3b82f6',
    marginLeft: 4,
  },
  details: {
    marginTop: 8,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowLabel: {
    fontSize: 12,
    color: '#666',
  },
  rowValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
});
