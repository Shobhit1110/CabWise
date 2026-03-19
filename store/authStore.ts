import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = 'cabwise_auth_user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'apple' | 'google';
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  /** Whether the sign-in sheet should be visible */
  showAuthSheet: boolean;
  /** Callback to run after successful sign-in */
  pendingAction: (() => void) | null;

  loadUser: () => Promise<void>;
  signIn: (user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  openAuthSheet: (onSuccess?: () => void) => void;
  closeAuthSheet: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  showAuthSheet: false,
  pendingAction: null,

  loadUser: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      if (raw) {
        set({ user: JSON.parse(raw), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  signIn: async (user: AuthUser) => {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } catch {
      // storage failure — continue
    }
    const { pendingAction } = get();
    set({ user, showAuthSheet: false, pendingAction: null });
    // Run the action the user was trying to perform
    pendingAction?.();
  },

  signOut: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch {
      // non-fatal
    }
    set({ user: null });
  },

  openAuthSheet: (onSuccess) => {
    set({ showAuthSheet: true, pendingAction: onSuccess ?? null });
  },

  closeAuthSheet: () => {
    set({ showAuthSheet: false, pendingAction: null });
  },
}));
