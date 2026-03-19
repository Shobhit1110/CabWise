import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const SPRING_CONFIG = { damping: 18, stiffness: 150, mass: 0.8 };
const TIMING_CONFIG = { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

/** Fade-in + slide-up on mount */
export function useFadeInUp(delay = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [20, 0]) }],
  }));

  return animatedStyle;
}

/** Scale-in spring animation */
export function useScaleIn(delay = 0) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, SPRING_CONFIG));
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
}

/** Staggered list item animation */
export function useStaggerItem(index: number, baseDelay = 50) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * baseDelay,
      withSpring(1, { damping: 20, stiffness: 120 }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [30, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.95, 1]) },
    ],
  }));

  return animatedStyle;
}

/** Press scale feedback */
export function usePressAnimation() {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}

/** Pulse animation for live indicators */
export function usePulse(active = true) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (active) {
      const pulse = () => {
        opacity.value = withTiming(0.3, { duration: 800 }, () => {
          opacity.value = withTiming(1, { duration: 800 });
        });
      };
      const interval = setInterval(pulse, 1600);
      pulse();
      return () => clearInterval(interval);
    } else {
      opacity.value = 1;
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
}

export { SPRING_CONFIG, TIMING_CONFIG };
export { Animated };
