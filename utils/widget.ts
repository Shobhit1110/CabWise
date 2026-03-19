/**
 * CabWise Widget Data Provider
 *
 * Provides the data layer for iOS/Android home screen widgets.
 * The widget shows the quickest ride to a saved destination (e.g., "Work").
 *
 * ## Setup Requirements
 *
 * ### Android (react-native-android-widget)
 * 1. Install: npx expo install react-native-android-widget
 * 2. Add the widget plugin to app.json plugins array
 * 3. Create the widget UI in this module
 * 4. Requires a development build (not Expo Go)
 *
 * ### iOS (expo-apple-targets)
 * 1. Install: npx expo install expo-apple-targets
 * 2. Create a WidgetKit extension target
 * 3. Share data via App Groups
 * 4. Requires a development build
 *
 * ## Data Flow
 * Widget reads cached data from AsyncStorage (shared via App Groups on iOS).
 * The main app periodically updates `WIDGET_DATA_KEY` with latest quickest ride info.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const WIDGET_DATA_KEY = 'cabwise_widget_data';

export interface WidgetData {
  provider: string;
  price: string;
  eta: string;
  destination: string;
  updatedAt: number;
}

/** Save latest ride data for the widget to display */
export async function updateWidgetData(data: WidgetData): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
  } catch {
    // Silently fail — widget update is non-critical
  }
}

/** Read cached widget data */
export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Clear widget data (e.g., on logout) */
export async function clearWidgetData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WIDGET_DATA_KEY);
  } catch {
    // Silently fail
  }
}
