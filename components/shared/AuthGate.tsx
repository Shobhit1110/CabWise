import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { useAuthStore, type AuthUser } from '../../store/authStore';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { triggerHaptic } from '../../utils/haptics';

/**
 * A modal bottom-sheet that appears when an unauthenticated user
 * tries a protected action (book, save route, set alert, etc.).
 *
 * Mount once in _layout.tsx — it reads visibility from authStore.
 */
export function AuthGate() {
  const { showAuthSheet, closeAuthSheet, signIn } = useAuthStore();
  const { colors } = useThemeStore();

  if (!showAuthSheet) return null;

  const handleApple = () => {
    triggerHaptic('light');
    // TODO: replace with real Apple Sign-In SDK call
    const mockUser: AuthUser = {
      id: 'apple_001',
      name: 'CabWise User',
      email: 'user@icloud.com',
      provider: 'apple',
    };
    signIn(mockUser);
  };

  const handleGoogle = () => {
    triggerHaptic('light');
    // TODO: replace with real Google Sign-In SDK call
    const mockUser: AuthUser = {
      id: 'google_001',
      name: 'CabWise User',
      email: 'user@gmail.com',
      provider: 'google',
    };
    signIn(mockUser);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={closeAuthSheet}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={closeAuthSheet}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <Text style={[styles.title, { color: colors.text }]}>Sign in to continue</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Create an account to book rides, save routes, and set price alerts.
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            {Platform.OS === 'ios' && (
              <Pressable
                style={[styles.btn, styles.appleBtn]}
                onPress={handleApple}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Apple"
              >
                <Text style={styles.appleIcon}>{'\uF8FF'}</Text>
                <Text style={[styles.btnText, { color: '#fff' }]}>Sign in with Apple</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.btn, styles.googleBtn, { borderColor: colors.border }]}
              onPress={handleGoogle}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.btnText, { color: colors.text }]}>Sign in with Google</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <Text style={[styles.legal, { color: colors.textMuted }]}>
            By continuing you agree to CabWise's Terms of Service and Privacy Policy.
          </Text>

          {/* Skip */}
          <Pressable style={styles.skipBtn} onPress={closeAuthSheet}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Not now</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
    ...shadows.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  buttons: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingVertical: 14,
  },
  appleBtn: {
    backgroundColor: '#000',
  },
  appleIcon: {
    fontSize: 18,
    color: '#fff',
  },
  googleBtn: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  btnText: {
    ...typography.callout,
    fontWeight: '500',
  },
  legal: {
    ...typography.micro,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.callout,
  },
});
