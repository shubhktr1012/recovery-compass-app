import React, { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotionPreference } from '@/lib/motion/accessibility';
import {
  MotionDistance,
  MotionDurations,
  MotionEasing,
} from '@/lib/motion/tokens';

interface ScreenEntranceProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function ScreenEntrance({
  children,
  className,
  delay = 0,
  distance = MotionDistance.screenY,
  style,
}: ScreenEntranceProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  const opacity = useSharedValue(prefersReducedMotion ? 1 : 0);
  const translateY = useSharedValue(prefersReducedMotion ? 0 : distance);

  useEffect(() => {
    if (prefersReducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    opacity.value = 0;
    translateY.value = distance;
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: MotionDurations.screen,
        easing: MotionEasing.standard,
      })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: MotionDurations.screen,
        easing: MotionEasing.standard,
      })
    );
  }, [delay, distance, opacity, prefersReducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View className={className} style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
