import { create } from 'zustand';

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  card: string;
  cardElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  chipBg: string;
  inputBg: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  shadow: string;
  shimmer: string;
  overlay: string;
  gradient1: string;
  gradient2: string;
}

const lightColors: ThemeColors = {
  bg: '#F5F6FA',
  bgSecondary: '#EEEEF3',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  tabBar: '#FFFFFF',
  tabActive: '#0F172A',
  tabInactive: '#94A3B8',
  chipBg: '#F1F5F9',
  inputBg: '#F8FAFC',
  accent: '#6366F1',
  accentSoft: '#EEF2FF',
  success: '#10B981',
  successSoft: '#ECFDF5',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  shadow: 'rgba(15, 23, 42, 0.08)',
  shimmer: '#E2E8F0',
  overlay: 'rgba(0,0,0,0.4)',
  gradient1: '#6366F1',
  gradient2: '#8B5CF6',
};

const darkColors: ThemeColors = {
  bg: '#0B0F1A',
  bgSecondary: '#111827',
  card: '#1E293B',
  cardElevated: '#253349',
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  border: '#334155',
  borderLight: '#1E293B',
  tabBar: '#111827',
  tabActive: '#F1F5F9',
  tabInactive: '#64748B',
  chipBg: '#1E293B',
  inputBg: '#1E293B',
  accent: '#818CF8',
  accentSoft: '#1E1B4B',
  success: '#34D399',
  successSoft: '#064E3B',
  danger: '#F87171',
  dangerSoft: '#450A0A',
  warning: '#FBBF24',
  warningSoft: '#451A03',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shimmer: '#334155',
  overlay: 'rgba(0,0,0,0.6)',
  gradient1: '#818CF8',
  gradient2: '#A78BFA',
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Border radius scale
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

// Typography
export const typography = {
  largeTitle: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  headline: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  callout: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  micro: { fontSize: 10, fontWeight: '600' as const },
} as const;

// Shadow presets
export const shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

interface ThemeStore {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  colors: lightColors,
  toggleTheme: () =>
    set((state) => ({
      isDark: !state.isDark,
      colors: state.isDark ? lightColors : darkColors,
    })),
}));
