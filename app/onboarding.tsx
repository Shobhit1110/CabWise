import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../store/onboardingStore';
import { useThemeStore, spacing, radii, typography, shadows } from '../store/themeStore';
import { useFadeInUp, usePressAnimation } from '../utils/animations';
import { triggerHaptic } from '../utils/haptics';

const { width, height: SCREEN_H } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: string;
  accentColor: string;
  title: string;
  subtitle: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: '⟐',
    accentColor: '#6366F1',
    title: 'Compare All Rides',
    subtitle: 'One tap, every option',
    description:
      'See prices from Uber, Bolt, FreeNow & more — side by side. Always know the cheapest, fastest, and best-rated ride.',
  },
  {
    id: '2',
    icon: '£',
    accentColor: '#10B981',
    title: 'Save Money Instantly',
    subtitle: 'Smart pickup suggestions',
    description:
      'Walk a few steps to a smarter pickup point and save up to £3 per ride. We show you exactly where and how much.',
  },
  {
    id: '3',
    icon: '⚡',
    accentColor: '#F59E0B',
    title: 'Price Alerts & Quick Book',
    subtitle: 'Never overpay again',
    description:
      'Set alerts for surge drops, lock in prices for 90 seconds, and book directly in your favourite provider app.',
  },
  {
    id: '4',
    icon: '◎',
    accentColor: '#8B5CF6',
    title: 'Enable Location',
    subtitle: 'Find rides near you',
    description:
      'We need your location to find nearby pickup points, show accurate ETAs, and compare rides in real-time.',
  },
];

/* ── Animated illustration per slide ─────────── */

function SlideIllustration({ icon, accentColor }: { icon: string; accentColor: string }) {
  const pulse = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1, true,
    );
  }, []);

  const outerRing = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.12]) }],
    opacity: interpolate(pulse.value, [0, 0.5, 1], [0.15, 0.3, 0.15]),
  }));

  const innerFloat = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  return (
    <View style={illustStyles.container}>
      <Animated.View style={[illustStyles.outerRing, { borderColor: accentColor }, outerRing]} />
      <Animated.View style={[illustStyles.middleRing, { borderColor: accentColor + '30' }]} />
      <Animated.View style={innerFloat}>
        <LinearGradient
          colors={[accentColor, accentColor + 'AA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={illustStyles.iconCircle}
        >
          <Text style={illustStyles.iconText}>{icon}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const illustStyles = StyleSheet.create({
  container: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  middleRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '300',
  },
});

/* ── Progress dots ─────────── */

function Dot({ active }: { active: boolean }) {
  const { colors } = useThemeStore();
  const w = useSharedValue(active ? 24 : 8);

  useEffect(() => {
    w.value = withSpring(active ? 24 : 8, { damping: 15, stiffness: 180 });
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    width: w.value,
  }));

  return active ? (
    <Animated.View style={animStyle}>
      <LinearGradient
        colors={[colors.gradient1, colors.gradient2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.dotGradient}
      />
    </Animated.View>
  ) : (
    <Animated.View
      style={[styles.dot, { backgroundColor: colors.border }, animStyle]}
    />
  );
}

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { markComplete } = useOnboardingStore();
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const headerStyle = useFadeInUp();
  const { animatedStyle: btnPress, onPressIn, onPressOut } = usePressAnimation();

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = async () => {
    triggerHaptic('light');
    if (isLast) {
      await Location.requestForegroundPermissionsAsync();
      markComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleSkip = () => {
    triggerHaptic('light');
    markComplete();
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <SlideIllustration icon={item.icon} accentColor={item.accentColor} />
      <Text style={[styles.slideTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.slideSubtitle, { color: item.accentColor }]}>{item.subtitle}</Text>
      <Text style={[styles.slideDescription, { color: colors.textSecondary }]}>
        {item.description}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Subtle top gradient wash */}
      <LinearGradient
        colors={[SLIDES[currentIndex].accentColor + '12', 'transparent']}
        style={styles.bgGradient}
      />

      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={[styles.logo, { color: colors.text }]}>
          Cab<Text style={{ color: colors.accent }}>Wise</Text>
        </Text>
        {!isLast && (
          <Pressable onPress={handleSkip} hitSlop={12} style={[styles.skipBtn, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </Pressable>
        )}
      </Animated.View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        bounces={false}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === currentIndex} />
          ))}
        </View>

        <Animated.View style={btnPress}>
          <Pressable
            onPress={handleNext}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Enable location and get started' : 'Next slide'}
          >
            <LinearGradient
              colors={[colors.gradient1, colors.gradient2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>
                {isLast ? 'Get Started' : 'Continue'}
              </Text>
              <View style={styles.nextArrowCircle}>
                <Text style={styles.nextArrow}>→</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.45,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  skipBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  skipText: {
    ...typography.callout,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl + 8,
  },
  slideTitle: {
    ...typography.largeTitle,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  slideSubtitle: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  slideDescription: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 23,
    opacity: 0.85,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotGradient: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: radii.xl,
    gap: spacing.md,
    ...shadows.md,
  },
  nextBtnText: {
    color: '#fff',
    ...typography.headline,
  },
  nextArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextArrow: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
