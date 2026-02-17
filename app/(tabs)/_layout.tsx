import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

import { AppColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

function TabIcon({
  focused,
  name,
}: {
  focused: boolean;
  name: 'house.fill' | 'list.bullet.rectangle.portrait.fill' | 'book.fill' | 'person.fill';
}) {
  return (
    <Pressable
      pointerEvents="none"
      className={`items-center justify-center rounded-full transition-all duration-200 ${focused ? 'bg-forest scale-105' : 'bg-transparent'} w-11 h-11`}
      style={
        focused
          ? {
              shadowColor: AppColors.forest,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.24,
              shadowRadius: 8,
              elevation: 5,
            }
          : undefined
      }
    >
      <IconSymbol
        name={name}
        size={21}
        color={focused ? AppColors.white : 'rgba(5, 41, 12, 0.58)'}
      />
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
      style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }, props.style]}
    >
      {props.children}
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          marginHorizontal: 26,
          bottom: 20,
          height: 66,
          borderRadius: 999,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(5, 41, 12, 0.1)',
          overflow: 'hidden',
          backgroundColor: 'transparent',
          shadowColor: AppColors.black,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 14,
          elevation: 8,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={90}
            tint="light"
            style={{
              flex: 1,
              backgroundColor:
                Platform.OS === 'android'
                  ? 'rgba(230, 242, 239, 0.96)'
                  : 'rgba(230, 242, 239, 0.82)',
            }}
          />
        ),
        tabBarButton: renderTabButton,
        tabBarItemStyle: {
          paddingVertical: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="house.fill" />,
        }}
      />
      <Tabs.Screen
        name="program"
        options={{
          title: 'Program',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="list.bullet.rectangle.portrait.fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="book.fill" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="person.fill" />,
        }}
      />
    </Tabs>
  );
}
