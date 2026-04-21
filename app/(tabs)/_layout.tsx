import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

function TabIcon({
  focused,
  name,
}: {
  focused: boolean;
  name: 'house.fill' | 'list.bullet.rectangle.portrait.fill' | 'book.fill' | 'person.fill';
}) {
  return (
    <View style={styles.tabIconContainer} pointerEvents="none">
      <View style={styles.iconWrapper}>
        <IconSymbol
          name={name}
          size={24}
          color={focused ? AppColors.white : 'rgba(227, 243, 229, 0.5)'}
        />
        {/* Subtle active indicator under the icon */}
        {focused && <View style={styles.activeIndicator} />}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);
  const isDashboardRoute = pathname === '/';

  const renderTabButton = (props: BottomTabBarButtonProps) => (
    <Pressable
      accessibilityState={props.accessibilityState}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole={props.accessibilityRole}
      testID={props.testID}
      onPress={(event) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPress?.(event);
      }}
      onLongPress={props.onLongPress}
      style={styles.tabButton}
    >
      {props.children}
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: isDashboardRoute ? 'none' : 'flex',
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
        },
        tabBarButton: renderTabButton,
        tabBarItemStyle: {
          paddingVertical: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon focused={focused} name="house.fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="program"
        options={{
          title: 'Program',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon focused={focused} name="list.bullet.rectangle.portrait.fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'My Journal',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon focused={focused} name="book.fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon focused={focused} name="person.fill" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.white,
  },
});
