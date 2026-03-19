import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Switch,
  FlatList,
  Alert,
} from 'react-native';
import { useAlertStore, PriceAlert } from '../../store/alertStore';
import { useRideStore } from '../../store/rideStore';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { triggerHaptic } from '../../utils/haptics';

const THRESHOLD_OPTIONS = [1.0, 1.2, 1.5, 2.0];

function AlertRow({ alert }: { alert: PriceAlert }) {
  const { colors } = useThemeStore();
  const { removeAlert, toggleAlert } = useAlertStore();

  return (
    <View style={[styles.alertRow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <View style={styles.alertInfo}>
        <Text style={[styles.alertRoute, { color: colors.text }]} numberOfLines={1}>
          {alert.originLabel} → {alert.destLabel}
        </Text>
        <Text style={[styles.alertThreshold, { color: colors.textMuted }]}>
          Alert when surge &lt; {alert.surgeThreshold}x
          {alert.provider ? ` · ${alert.provider}` : ' · Any provider'}
        </Text>
      </View>
      <Switch
        value={alert.enabled}
        onValueChange={() => {
          triggerHaptic('selection');
          toggleAlert(alert.id);
        }}
        trackColor={{ true: colors.accent, false: colors.border }}
        thumbColor="#fff"
      />
      <Pressable
        onPress={() => {
          triggerHaptic('light');
          removeAlert(alert.id);
        }}
        hitSlop={8}
      >
        <Text style={[styles.deleteBtn, { color: colors.danger }]}>✕</Text>
      </Pressable>
    </View>
  );
}

export function PriceAlertSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useThemeStore();
  const { origin, destination, originLabel, destLabel } = useRideStore();
  const { alerts, addAlert, requestPermission } = useAlertStore();
  const [selectedThreshold, setSelectedThreshold] = useState(1.2);

  const handleCreateAlert = async () => {
    if (!origin || !destination) {
      Alert.alert('Set Route', 'Select a destination before creating a price alert.');
      return;
    }

    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Notifications Required',
        'Enable notifications in Settings to receive price alerts.',
      );
      return;
    }

    triggerHaptic('success');
    addAlert({
      originLabel: originLabel || 'Your location',
      destLabel: destLabel || 'Destination',
      originLat: origin.lat,
      originLng: origin.lng,
      destLat: destination.lat,
      destLng: destination.lng,
      surgeThreshold: selectedThreshold,
      provider: null,
      enabled: true,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>🔔 Price Alerts</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={[styles.closeBtn, { color: colors.textMuted }]}>✕</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Get notified when surge drops below your threshold
          </Text>

          {/* Threshold selector */}
          <View style={styles.thresholdRow}>
            {THRESHOLD_OPTIONS.map((t) => (
              <Pressable
                key={t}
                style={[
                  styles.thresholdChip,
                  {
                    backgroundColor: selectedThreshold === t ? colors.accent : colors.chipBg,
                  },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedThreshold(t);
                }}
              >
                <Text
                  style={[
                    styles.thresholdText,
                    { color: selectedThreshold === t ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {t === 1.0 ? 'No surge' : `< ${t}x`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Create button */}
          <Pressable
            style={[styles.createBtn, { backgroundColor: colors.accent }]}
            onPress={handleCreateAlert}
          >
            <Text style={styles.createBtnText}>
              + Create alert for current route
            </Text>
          </Pressable>

          {/* Existing alerts */}
          {alerts.length > 0 && (
            <>
              <Text style={[styles.listLabel, { color: colors.textMuted }]}>
                Active alerts ({alerts.length})
              </Text>
              <FlatList
                data={alerts}
                keyExtractor={(a) => a.id}
                renderItem={({ item }) => <AlertRow alert={item} />}
                style={styles.list}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}

          {alerts.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No alerts yet. Create one to be notified when prices drop.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.headline,
  },
  closeBtn: {
    fontSize: 20,
    fontWeight: '600',
  },
  sectionLabel: {
    ...typography.callout,
    marginBottom: spacing.lg,
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  thresholdChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  thresholdText: {
    ...typography.caption,
    fontWeight: '600',
  },
  createBtn: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  createBtnText: {
    color: '#fff',
    ...typography.callout,
    fontWeight: '700',
  },
  listLabel: {
    ...typography.micro,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  list: {
    maxHeight: 250,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  alertInfo: {
    flex: 1,
  },
  alertRoute: {
    ...typography.callout,
    fontWeight: '600',
  },
  alertThreshold: {
    ...typography.caption,
    marginTop: 2,
  },
  deleteBtn: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.callout,
    textAlign: 'center',
  },
});
