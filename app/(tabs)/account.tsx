import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  Switch,
  Platform,
} from 'react-native';
import { useState } from 'react';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useFadeInUp, useStaggerItem } from '../../utils/animations';
import { triggerHaptic } from '../../utils/haptics';

interface MenuItem {
  id: string;
  label: string;
  subtitle?: string;
  type: 'link' | 'toggle';
  icon: string;
}

const PROVIDER_LOGO_IMAGES: Record<string, any> = {
  uber: require('../../assets/providers/uber.png'),
  bolt: require('../../assets/providers/bolt.png'),
  freenow: require('../../assets/providers/freenow.png'),
  wheely: require('../../assets/providers/wheely.png'),
};

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Preferences',
    items: [
      { id: 'notifications', label: 'Push Notifications', type: 'toggle', icon: '' },
      { id: 'darkMode', label: 'Dark Mode', type: 'toggle', icon: '' },
      { id: 'currency', label: 'Currency', subtitle: 'GBP (£)', type: 'link', icon: '' },
      { id: 'defaultVehicle', label: 'Default Vehicle', subtitle: 'Standard', type: 'link', icon: '' },
    ],
  },
  {
    title: 'Connected Accounts',
    items: [
      { id: 'uber', label: 'Uber', subtitle: 'Not connected', type: 'link', icon: '' },
      { id: 'bolt', label: 'Bolt', subtitle: 'Not connected', type: 'link', icon: '' },
      { id: 'freenow', label: 'FreeNow', subtitle: 'Not connected', type: 'link', icon: '' },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: 'help', label: 'Help & FAQ', type: 'link', icon: '❓' },
      { id: 'privacy', label: 'Privacy Policy', type: 'link', icon: '🔒' },
      { id: 'terms', label: 'Terms of Service', type: 'link', icon: '📄' },
      { id: 'about', label: 'About CabWise', subtitle: 'v0.1.0', type: 'link', icon: 'ℹ️' },
    ],
  },
];

function StatCard({ value, label, icon, index }: { value: string; label: string; icon: string; index: number }) {
  const { colors } = useThemeStore();
  const staggerStyle = useStaggerItem(index, 100);

  return (
    <Animated.View style={[styles.statCard, { backgroundColor: colors.card, shadowColor: colors.shadow }, staggerStyle]}>
      <LinearGradient
        colors={[colors.gradient1, colors.gradient2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.statAccent}
      />
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </Animated.View>
  );
}

export default function AccountScreen() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    notifications: true,
  });
  const { isDark, colors, toggleTheme } = useThemeStore();
  const { user, signOut, openAuthSheet } = useAuthStore();
  const headerStyle = useFadeInUp();

  const handleToggle = (id: string) => {
    if (id === 'darkMode') {
      toggleTheme();
      return;
    }
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getToggleValue = (id: string) => {
    if (id === 'darkMode') return isDark;
    return toggles[id] ?? false;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={headerStyle}>
          <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>CW</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>CabWise User</Text>
                <Text style={[styles.profileEmail, { color: colors.textMuted }]}>Sign in to sync rides</Text>
              </View>
            </View>

            <View style={styles.signInButtons}>
              {Platform.OS === 'ios' && (
                <Pressable
                  style={[styles.signInButton, styles.appleButton]}
                  onPress={() => triggerHaptic('light')}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Apple"
                >
                  <Text style={styles.appleIcon}></Text>
                  <Text style={[styles.signInText, { color: '#fff' }]}>Sign in with Apple</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.signInButton, styles.googleButton, { borderColor: colors.border }]}
                onPress={() => triggerHaptic('light')}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Google"
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={[styles.signInText, { color: colors.text }]}>Sign in with Google</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <View style={styles.statsRow}>
          <StatCard value="5" label="Rides" icon="" index={0} />
          <StatCard value="£12" label="Saved" icon="" index={1} />
          <StatCard value="3" label="Apps" icon="" index={2} />
        </View>

        {MENU_SECTIONS.map((section, sIdx) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.menuItem,
                    idx < section.items.length - 1 && [styles.menuItemBorder, { borderBottomColor: colors.borderLight }],
                  ]}
                  onPress={() => triggerHaptic('light')}
                  accessibilityRole={item.type === 'toggle' ? 'switch' : 'button'}
                  accessibilityLabel={item.label}
                  accessibilityState={item.type === 'toggle' ? { checked: getToggleValue(item.id) } : undefined}
                >
                  <View style={styles.menuLeft}>
                    {PROVIDER_LOGO_IMAGES[item.id] ? (
                      <Image source={PROVIDER_LOGO_IMAGES[item.id]} style={styles.providerBadge} />
                    ) : item.icon ? (
                      <View style={[styles.menuIconWrap, { backgroundColor: colors.bgSecondary }]}>
                        <Text style={styles.menuIcon}>{item.icon}</Text>
                      </View>
                    ) : null}
                    <View>
                      <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                      {item.type === 'link' && item.subtitle && !PROVIDER_LOGO_IMAGES[item.id] ? null : null}
                    </View>
                  </View>
                  {item.type === 'toggle' ? (
                    <Switch
                      value={getToggleValue(item.id)}
                      onValueChange={() => handleToggle(item.id)}
                      trackColor={{ false: colors.border, true: colors.accent }}
                      thumbColor="#fff"
                    />
                  ) : (
                    <View style={styles.menuRight}>
                      {item.subtitle && (
                        <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{item.subtitle}</Text>
                      )}
                      <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          style={[styles.signOutButton, { borderColor: colors.danger }]}
          onPress={() => {
            triggerHaptic('warning');
            if (user) signOut();
          }}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
        </Pressable>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>CabWise v0.1.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    ...typography.callout,
    fontWeight: '600',
  },
  profileEmail: {
    ...typography.caption,
    marginTop: 2,
  },
  signInButtons: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 11,
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleIcon: {
    fontSize: 18,
    color: '#fff',
  },
  googleButton: {
    backgroundColor: 'transparent',
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  signInText: {
    ...typography.callout,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    minHeight: 80,
    overflow: 'hidden',
    ...shadows.sm,
  },
  statAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    ...typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.micro,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 16,
  },
  providerBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  menuLabel: {
    ...typography.body,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuSubtitle: {
    ...typography.callout,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  signOutButton: {
    marginHorizontal: spacing.xl,
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signOutText: {
    ...typography.callout,
    fontWeight: '600',
  },
  versionText: {
    ...typography.micro,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
