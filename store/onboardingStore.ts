import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'cabwise_onboarding_complete';

interface OnboardingStore {
  hasCompletedOnboarding: boolean | null; // null = loading
  markComplete: () => void;
  loadState: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  hasCompletedOnboarding: null,

  loadState: async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({ hasCompletedOnboarding: value === 'true' });
    } catch {
      set({ hasCompletedOnboarding: false });
    }
  },

  markComplete: async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // Storage failure — continue anyway
    }
    set({ hasCompletedOnboarding: true });
  },
}));
