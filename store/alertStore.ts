import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ALERTS_KEY = 'cabwise_price_alerts';

export interface PriceAlert {
  id: string;
  originLabel: string;
  destLabel: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  surgeThreshold: number; // alert when surge drops below this
  provider: string | null; // null = any provider
  enabled: boolean;
  createdAt: number;
}

interface AlertStore {
  alerts: PriceAlert[];
  permissionGranted: boolean;
  loadAlerts: () => void;
  addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  requestPermission: () => Promise<boolean>;
  checkSurgeAndNotify: (currentSurge: number, routeLabel: string) => void;
}

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function generateId() {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
  permissionGranted: false,

  loadAlerts: async () => {
    try {
      const raw = await AsyncStorage.getItem(ALERTS_KEY);
      if (raw) {
        set({ alerts: JSON.parse(raw) });
      }
    } catch {
      // Fail silently
    }
  },

  addAlert: async (alertData) => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: generateId(),
      createdAt: Date.now(),
    };
    const updated = [...get().alerts, newAlert];
    set({ alerts: updated });
    try {
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
    } catch {
      // Fail silently
    }
  },

  removeAlert: async (id) => {
    const updated = get().alerts.filter((a) => a.id !== id);
    set({ alerts: updated });
    try {
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
    } catch {
      // Fail silently
    }
  },

  toggleAlert: async (id) => {
    const updated = get().alerts.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a,
    );
    set({ alerts: updated });
    try {
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
    } catch {
      // Fail silently
    }
  },

  requestPermission: async () => {
    if (Platform.OS === 'web') {
      set({ permissionGranted: false });
      return false;
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      set({ permissionGranted: true });
      return true;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    set({ permissionGranted: granted });
    return granted;
  },

  checkSurgeAndNotify: async (currentSurge, routeLabel) => {
    const { alerts, permissionGranted } = get();
    if (!permissionGranted) return;

    const matchingAlerts = alerts.filter(
      (a) => a.enabled && currentSurge < a.surgeThreshold,
    );

    for (const alert of matchingAlerts) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Surge has dropped!',
          body: `Prices on ${routeLabel} are back to ${currentSurge}x — below your ${alert.surgeThreshold}x threshold.`,
          data: { alertId: alert.id },
        },
        trigger: null, // Send immediately
      });
    }
  },
}));
