import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

// ─── Brand tokens ───────────────────────────────────────────────────────────
const FOREST = '#06290C';
const INACTIVE = 'rgba(6,41,12,0.32)';

// ─── SVG Tab Icons (inline, matching spec exactly) ───────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function JournalIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

// ─── Tab item (icon + label) ─────────────────────────────────────────────────
function TabItem({
  icon: Icon,
  label,
  focused,
}: {
  icon: React.ComponentType<{ color: string }>;
  label: string;
  focused: boolean;
}) {
  const color = focused ? FOREST : INACTIVE;
  return (
    <View style={styles.tabItem}>
      <Icon color={color} />
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        ellipsizeMode="clip"
        style={[styles.tabLabel, { color }]}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Custom floating tab bar ─────────────────────────────────────────────────
function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: {
  state: any;
  descriptors: any;
  navigation: any;
}) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.OS === 'android'
    ? Math.max(insets.bottom + 8, 14)
    : Math.max(insets.bottom - 12, 4);

  const tabs = [
    { name: 'index',   label: 'Home',    Icon: HomeIcon },
    { name: 'program', label: 'Program', Icon: ProgramIcon },
    { name: 'journal', label: 'Journal', Icon: JournalIcon },
    { name: 'profile', label: 'Profile', Icon: ProfileIcon },
  ];

  return (
    <View style={[styles.tabBarOuter, { bottom: bottomOffset }]} pointerEvents="box-none">
      {/* ── Glass pill ── */}
      <View style={styles.tabBarShadowWrap}>
        <BlurView
          intensity={60}
          tint="light"
          style={styles.blurView}
        >
          <View style={styles.tabBarInner}>
            {tabs.map((tab, i) => {
              const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
              const focused = state.index === routeIndex;

              return (
                <Pressable
                  key={tab.name}
                  style={styles.tabButton}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: state.routes[routeIndex]?.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
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
        </BlurView>
      </View>
    </View>
  );
}

// ─── Root layout ─────────────────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="program" options={{ title: 'Program' }} />
      <Tabs.Screen name="journal" options={{ title: 'My Journal' }} />
      <Tabs.Screen name="profile" options={{ title: 'Account' }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
  },
  tabBarShadowWrap: {
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 24,
  },
  blurView: {
    borderRadius: 28,
    overflow: 'hidden',
    // Fallback background for Android where BlurView may be less effective
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.88)',
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 12,
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
    letterSpacing: Platform.OS === 'android' ? 0.2 : 0.4,
    textAlign: 'center',
    width: '100%',
  },
});
