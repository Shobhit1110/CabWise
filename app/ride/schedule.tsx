import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { useRideStore } from '../../store/rideStore';
import { ScheduleSheet } from '../../components/shared/ScheduleSheet';
import { triggerHaptic } from '../../utils/haptics';

const FEATURES = [
  {
    icon: '💰',
    title: 'Beat the surge',
    desc: 'Book early and skip surge pricing during peak hours.',
  },
  {
    icon: '⏰',
    title: 'Plan ahead',
    desc: 'Schedule up to 7 days in advance for airport runs, meetings, or events.',
  },
  {
    icon: '📊',
    title: 'Compare first',
    desc: 'See prices across Uber, Bolt & more before you lock in your time.',
  },
  {
    icon: '🔔',
    title: 'Get reminders',
    desc: "We'll notify you before your ride so you're ready at the door.",
  },
];

export default function ScheduleInfoScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { scheduledTime, setScheduledTime } = useRideStore();
  const [sheetVisible, setSheetVisible] = useState(false);

  function formatLabel(d: Date): string {
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const now = new Date();
    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
    const day = isToday ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${day} at ${h12}:${m} ${ampm}`;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80' }}
            style={styles.heroImage}
            accessibilityLabel="Person waiting for a ride"
          />
          <View style={[styles.heroOverlay, { backgroundColor: colors.bg }]} />
        </View>

        <View style={styles.body}>
          {/* Back button */}
          <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
          </Pressable>

          <Text style={[styles.title, { color: colors.text }]}>Schedule a Ride</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Plan your journey in advance and let CabWise find you the best deal when it's time to go.
          </Text>

          {/* Current status */}
          {scheduledTime && (
            <View style={[styles.statusCard, { backgroundColor: colors.accent + '14', borderColor: colors.accent + '30' }]}>
              <Text style={[styles.statusLabel, { color: colors.accent }]}>Scheduled for</Text>
              <Text style={[styles.statusTime, { color: colors.text }]}>{formatLabel(scheduledTime)}</Text>
              <Pressable
                style={[styles.clearBtn, { backgroundColor: colors.chipBg }]}
                onPress={() => { triggerHaptic('light'); setScheduledTime(null); }}
              >
                <Text style={[styles.clearText, { color: colors.textMuted }]}>Clear</Text>
              </Pressable>
            </View>
          )}

          {/* Features */}
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.title} style={[styles.featureRow, { backgroundColor: colors.card }]}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <Pressable
            style={[styles.cta, { backgroundColor: colors.accent }]}
            onPress={() => { triggerHaptic('medium'); setSheetVisible(true); }}
            accessibilityRole="button"
            accessibilityLabel="Pick a time"
          >
            <Text style={styles.ctaText}>
              {scheduledTime ? 'Change Time' : 'Pick a Time'}
            </Text>
          </Pressable>

          <Pressable style={styles.rideNowBtn} onPress={() => { setScheduledTime(null); router.back(); }}>
            <Text style={[styles.rideNowText, { color: colors.textMuted }]}>Ride now instead</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ScheduleSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSchedule={(time) => { setScheduledTime(time); setSheetVisible(false); }}
        onRideNow={() => { setScheduledTime(null); setSheetVisible(false); router.back(); }}
        currentSchedule={scheduledTime}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroWrap: {
    height: 220,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    opacity: 0.85,
  },
  body: {
    paddingHorizontal: spacing.xl,
    marginTop: -spacing.xl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  backText: {
    ...typography.callout,
    fontWeight: '600',
  },
  title: {
    ...typography.largeTitle,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  statusCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  statusLabel: {
    ...typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statusTime: {
    ...typography.headline,
    marginBottom: spacing.sm,
  },
  clearBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  clearText: {
    ...typography.caption,
    fontWeight: '500',
  },
  features: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    ...typography.caption,
    lineHeight: 18,
  },
  cta: {
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ctaText: {
    color: '#fff',
    ...typography.callout,
    fontWeight: '700',
  },
  rideNowBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xxl,
  },
  rideNowText: {
    ...typography.callout,
  },
});
