import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Image,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore, spacing, radii, typography, shadows } from '../../store/themeStore';
import { useStaggerItem, usePressAnimation, useFadeInUp } from '../../utils/animations';

interface RideHistory {
  id: string;
  provider: string;
  from: string;
  to: string;
  price: string;
  date: string;
  status: 'completed' | 'cancelled';
  vehicleClass: string;
}

const MOCK_HISTORY: RideHistory[] = [
  {
    id: '1', provider: 'Uber', from: 'Paddington Station', to: 'Canary Wharf',
    price: '£24.50', date: '14 Mar 2026, 9:15 AM', status: 'completed', vehicleClass: 'Premium',
  },
  {
    id: '2', provider: 'Bolt', from: "King's Cross", to: 'Heathrow T5',
    price: '£38.00', date: '12 Mar 2026, 6:30 PM', status: 'completed', vehicleClass: 'Standard',
  },
  {
    id: '3', provider: 'Uber', from: 'Soho', to: 'Shoreditch',
    price: '£12.80', date: '10 Mar 2026, 11:45 PM', status: 'cancelled', vehicleClass: 'Shared',
  },
  {
    id: '4', provider: 'Bolt', from: 'Liverpool Street', to: 'Camden Town',
    price: '£15.20', date: '8 Mar 2026, 3:00 PM', status: 'completed', vehicleClass: 'Standard',
  },
  {
    id: '5', provider: 'FreeNow', from: 'Westminster', to: 'Greenwich',
    price: '£19.90', date: '5 Mar 2026, 10:20 AM', status: 'completed', vehicleClass: 'Electric',
  },
];

const providerColors: Record<string, string> = {
  Uber: '#000',
  Bolt: '#34D186',
  FreeNow: '#C41E68',
};

const PROVIDER_LOGOS: Record<string, any> = {
  Uber: require('../../assets/providers/uber.png'),
  Bolt: require('../../assets/providers/bolt.png'),
  FreeNow: require('../../assets/providers/freenow.png'),
};

function HistoryCard({ item, index }: { item: RideHistory; index: number }) {
  const { colors } = useThemeStore();
  const staggerStyle = useStaggerItem(index, 70);
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressAnimation();
  const isCompleted = item.status === 'completed';

  return (
    <Animated.View style={[staggerStyle, pressStyle]}>
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: isCompleted ? `${colors.success}12` : `${colors.danger}12`,
            borderColor: isCompleted ? `${colors.success}30` : `${colors.danger}30`,
            borderWidth: 1,
            shadowColor: colors.shadow,
          },
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={styles.cardHeader}>
          <View style={styles.providerInfo}>
            {PROVIDER_LOGOS[item.provider] ? (
              <Image source={PROVIDER_LOGOS[item.provider]} style={styles.providerLogo} />
            ) : (
              <View style={[styles.providerDot, { backgroundColor: providerColors[item.provider] || '#666' }]} />
            )}
            <View>
              <Text style={[styles.providerName, { color: colors.text }]}>{item.provider}</Text>
              <Text style={[styles.vehicleClass, { color: colors.textMuted }]}>{item.vehicleClass}</Text>
            </View>
          </View>
          <View style={styles.priceCol}>
            <Text style={[styles.price, { color: colors.text }]}>{item.price}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isCompleted ? colors.successSoft : colors.dangerSoft },
            ]}>
              <Text style={[
                styles.statusText,
                { color: isCompleted ? colors.success : colors.danger },
              ]}>
                {isCompleted ? '✓ Done' : '✕ Cancelled'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.route, { backgroundColor: colors.bgSecondary }]}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.success }]}>
              <View style={styles.dotInner} />
            </View>
            <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>{item.from}</Text>
          </View>
          <View style={[styles.routeLine, { borderColor: colors.border }]} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]}>
              <View style={styles.dotInner} />
            </View>
            <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>{item.to}</Text>
          </View>
        </View>

        <Text style={[styles.date, { color: colors.textMuted }]}>{item.date}</Text>
      </Pressable>
    </Animated.View>
  );
}

type FilterType = 'all' | 'completed' | 'cancelled';
const FILTER_OPTIONS: { label: string; value: FilterType; icon: string }[] = [
  { label: 'All', value: 'all', icon: '≡' },
  { label: 'Completed', value: 'completed', icon: '✓' },
  { label: 'Cancelled', value: 'cancelled', icon: '✕' },
];

export default function HistoryScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const { colors } = useThemeStore();
  const headerStyle = useFadeInUp();

  const filtered = MOCK_HISTORY.filter(
    (r) => filter === 'all' || r.status === filter
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Animated.View style={headerStyle}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Ride History</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {MOCK_HISTORY.length} rides total
            </Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.headerBadgeText, { color: colors.accent }]}>
              £{MOCK_HISTORY.reduce((s, r) => s + parseFloat(r.price.replace('£', '')), 0).toFixed(0)} total
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((f) => {
          const isActive = filter === f.value;
          return (
            <Pressable
              key={f.value}
              style={[
                styles.filterChip,
                !isActive && { backgroundColor: colors.chipBg },
                isActive && { overflow: 'hidden' as const },
              ]}
              onPress={() => setFilter(f.value)}
            >
              {isActive && (
                <LinearGradient
                  colors={[colors.gradient1, colors.gradient2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <Text style={[styles.filterIcon, isActive && { color: '#fff' }]}>{f.icon}</Text>
              <Text style={[
                styles.filterText,
                { color: colors.textSecondary },
                isActive && { color: '#fff' },
              ]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <HistoryCard item={item} index={index} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>—</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No rides yet</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Your ride history will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.callout,
    marginTop: 2,
  },
  headerBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginTop: spacing.xs,
  },
  headerBadgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  filterIcon: {
    fontSize: 12,
  },
  filterText: {
    ...typography.caption,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  providerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  providerDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  providerName: {
    ...typography.body,
    fontWeight: '600',
  },
  vehicleClass: {
    ...typography.micro,
    marginTop: 1,
  },
  priceCol: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  statusText: {
    ...typography.micro,
  },
  route: {
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  routeLine: {
    width: 0,
    height: 12,
    marginLeft: 5,
    marginVertical: 2,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  routeText: {
    ...typography.callout,
    flex: 1,
  },
  date: {
    ...typography.caption,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.callout,
    textAlign: 'center',
  },
});
