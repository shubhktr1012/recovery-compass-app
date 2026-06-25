import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { AppColors, AppRadii, AppShadows } from '@/constants/theme';
import { TabBarScrollFade } from '@/components/navigation/TabBarScrollFade';
import { useReducedMotionPreference } from '@/lib/motion/accessibility';
import { MotionDurations } from '@/lib/motion/tokens';
import { getFloatingTabBarBottomOffset } from '@/lib/navigation/tab-bar-layout';
import {
  TabBarMetricsProvider,
  useReportTabBarHeight,
} from '@/components/navigation/TabBarMetricsProvider';

const INACTIVE = AppColors.inkSubtle;
const ACTIVE = AppColors.white;

const TAB_SPRING = {
  damping: 34,
  stiffness: 230,
  mass: 0.85,
} as const;

type TabSlotLayout = { x: number; width: number };

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProgramIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function JournalIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const TAB_CONFIG = [
  { name: 'index', label: 'Today', Icon: HomeIcon },
  { name: 'program', label: 'Program', Icon: ProgramIcon },
  { name: 'journal', label: 'Journal', Icon: JournalIcon },
  { name: 'profile', label: 'Profile', Icon: ProfileIcon },
] as const;

type TabName = (typeof TAB_CONFIG)[number]['name'];

function TabItem({
  icon: Icon,
  label,
  focused,
}: {
  icon: React.ComponentType<{ color: string }>;
  label: string;
  focused: boolean;
}) {
  const color = focused ? ACTIVE : INACTIVE;
  return (
    <View style={styles.tabItem}>
      <Icon color={color} />
      <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="clip" style={[styles.tabLabel, { color }]}>
        {label}
      </Text>
    </View>
  );
}

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const reportTabBarHeight = useReportTabBarHeight();
  const prefersReducedMotion = useReducedMotionPreference();
  const [tabLayouts, setTabLayouts] = useState<Partial<Record<TabName, TabSlotLayout>>>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const hasPositionedPill = useRef(false);

  const bottomOffset = getFloatingTabBarBottomOffset(insets);

  const movePillToIndex = useCallback(
    (index: number, animated: boolean) => {
      const tabName = TAB_CONFIG[index]?.name;
      if (!tabName) return;

      const layout = tabLayouts[tabName];
      if (!layout) return;

      if (prefersReducedMotion || !animated) {
        pillX.value = layout.x;
        pillWidth.value = layout.width;
        pillOpacity.value = 1;
        return;
      }

      pillX.value = withSpring(layout.x, TAB_SPRING);
      pillWidth.value = withSpring(layout.width, TAB_SPRING);
      pillOpacity.value = withTiming(1, { duration: MotionDurations.fast });
    },
    [pillOpacity, pillWidth, pillX, prefersReducedMotion, tabLayouts]
  );

  useEffect(() => {
    const tabName = TAB_CONFIG[state.index]?.name;
    const hasLayout = Boolean(tabName && tabLayouts[tabName]);
    movePillToIndex(state.index, hasPositionedPill.current && hasLayout);
    if (hasLayout) {
      hasPositionedPill.current = true;
    }
  }, [movePillToIndex, state.index, tabLayouts]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ translateX: pillX.value }],
    width: pillWidth.value,
  }));

  const handleTabLayout = useCallback((tabName: TabName, x: number, width: number) => {
    setTabLayouts((current) => {
      const existing = current[tabName];
      if (existing?.x === x && existing?.width === width) {
        return current;
      }
      return { ...current, [tabName]: { x, width } };
    });
  }, []);

  return (
    <View style={[styles.tabBarOuter, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View
        style={styles.tabBarGroup}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (height > 0) {
            reportTabBarHeight(height);
          }
        }}
      >
        <Animated.View pointerEvents="none" style={[styles.slidingPill, pillAnimatedStyle]} />
        {TAB_CONFIG.map((tab) => {
          const routeIndex = state.routes.findIndex((route) => route.name === tab.name);
          const focused = state.index === routeIndex;

          return (
            <Pressable
              key={tab.name}
              style={styles.tabButton}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                handleTabLayout(tab.name, x, width);
              }}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                const event = navigation.emit({
                  type: 'tabPress',
                  target: state.routes[routeIndex]?.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented && routeIndex >= 0) {
                  navigation.navigate(tab.name);
                }
              }}
              onLongPress={() => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: state.routes[routeIndex]?.key,
                });
              }}
            >
              <TabItem icon={tab.Icon} label={tab.label} focused={focused} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <TabBarMetricsProvider>
      <View style={styles.tabLayoutRoot}>
        <Tabs
          tabBar={(props) => <FloatingTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Today' }} />
          <Tabs.Screen name="program" options={{ title: 'Program' }} />
          <Tabs.Screen name="journal" options={{ title: 'My Journal' }} />
          <Tabs.Screen name="profile" options={{ title: 'Account' }} />
        </Tabs>
        <TabBarScrollFade />
      </View>
    </TabBarMetricsProvider>
  );
}

const styles = StyleSheet.create({
  tabLayoutRoot: {
    flex: 1,
  },
  tabBarOuter: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 50,
  },
  tabBarGroup: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 2,
    minHeight: 62,
    padding: 6,
    backgroundColor: AppColors.canvas,
    borderRadius: AppRadii.xl,
    borderWidth: 1,
    borderColor: AppColors.hairline,
    ...AppShadows.tab,
  },
  slidingPill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    borderRadius: AppRadii.xl - 6,
    backgroundColor: AppColors.forest,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
    borderRadius: AppRadii.xl - 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    zIndex: 1,
  },
  tabItem: {
    width: '100%',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: Platform.OS === 'android' ? 2 : 4,
  },
  tabLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.2,
    textAlign: 'center',
    width: '100%',
  },
});
