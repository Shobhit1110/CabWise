import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface LocationRowProps {
  type: 'origin' | 'destination';
  label: string;
  onPress?: () => void;
  placeholder?: boolean;
}

export function LocationRow({ type, label, onPress, placeholder }: LocationRowProps) {
  const inner = (
    <View style={[styles.container, placeholder && styles.placeholder]}>
      <View style={styles.icon}>
        <View
          style={[
            styles.dot,
            type === 'origin' ? styles.dotOrigin : styles.dotDest,
          ]}
        />
      </View>
      <View style={styles.text}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }

  return inner;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  placeholder: {
    opacity: 0.6,
  },
  icon: {
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotOrigin: {
    backgroundColor: '#10b981',
  },
  dotDest: {
    backgroundColor: '#ef4444',
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: '#111',
  },
});
