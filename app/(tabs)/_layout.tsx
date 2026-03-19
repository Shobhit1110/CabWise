import { Tabs } from 'expo-router';
import { View, Text, Platform, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore, radii } from '../../store/themeStore';

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const { colors } = useThemeStore();
  const icons: Record<string, string> = { Home: '⌂', History: '☰', Account: '●' };
  const scale = useSharedValue(1);
  const dotWidth = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.18 : 1, { damping: 14, stiffness: 220 });
    dotWidth.value = withTiming(focused ? 20 : 0, { duration: 250 });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    width: dotWidth.value,
    height: dotWidth.value > 0 ? 3 : 0,
    borderRadius: 1.5,
    marginTop: dotWidth.value > 0 ? 4 : 0,
    overflow: 'hidden',
  }));

  return (
    <View style={tabStyles.iconContainer}>
      <Animated.View style={iconStyle}>
        <Text style={{ fontSize: 20, color: focused ? colors.accent : colors.tabInactive }}>
          {icons[name] || '•'}
        </Text>
      </Animated.View>
      <Animated.View style={dotStyle}>
        {focused && (
          <LinearGradient
            colors={[colors.gradient1, colors.gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: 1.5 }}
          />
        )}
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'web' ? 68 : 88,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'web' ? 8 : 28,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 0,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon name="Home" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ focused, color }) => <TabIcon name="History" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarLabel: 'Account',
          tabBarIcon: ({ focused, color }) => <TabIcon name="Account" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
});
