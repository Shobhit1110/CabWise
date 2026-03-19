import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeStore, spacing, typography } from '../../store/themeStore';

interface LocationRowProps {
  type: 'origin' | 'destination';
  label: string;
  onPress?: () => void;
  placeholder?: boolean;
}

export function LocationRow({ type, label, onPress, placeholder }: LocationRowProps) {
  const { colors } = useThemeStore();
  const isOrigin = type === 'origin';

  const inner = (
    <View style={[styles.container, placeholder && styles.placeholder]}>
      <View style={styles.iconCol}>
        <View style={[
          styles.dot,
          { backgroundColor: isOrigin ? colors.success : colors.danger },
        ]}>
          <View style={styles.dotInner} />
        </View>
        {isOrigin && <View style={[styles.connector, { backgroundColor: colors.borderLight }]} />}
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.typeLabel, { color: colors.textMuted }]}>
          {isOrigin ? 'PICKUP' : 'DROP-OFF'}
        </Text>
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${isOrigin ? 'Pickup' : 'Drop-off'}: ${label}`}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  placeholder: {
    opacity: 0.5,
  },
  iconCol: {
    alignItems: 'center',
    width: 24,
    marginRight: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  connector: {
    width: 2,
    height: 20,
    marginTop: 4,
    borderRadius: 1,
  },
  textCol: {
    flex: 1,
  },
  typeLabel: {
    ...typography.micro,
    letterSpacing: 1,
    marginBottom: 2,
  },
  label: {
    ...typography.body,
    fontWeight: '500',
  },
});
