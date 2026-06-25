import React, { useCallback } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useReducedMotionPreference } from '@/lib/motion/accessibility';
import {
  MotionDurations,
  MotionEasing,
  MotionScale,
} from '@/lib/motion/tokens';
import type { MotionHaptic } from '@/lib/motion/tokens';

type PressableScaleStyle = PressableProps['style'];

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  animatedStyle?: StyleProp<ViewStyle>;
  className?: string;
  haptic?: MotionHaptic;
  pressScale?: number;
  style?: PressableScaleStyle;
}

async function runHaptic(haptic: MotionHaptic) {
  try {
    if (haptic === 'none') return;
    if (haptic === 'light') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (haptic === 'medium') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (haptic === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    await Haptics.selectionAsync();
  } catch {
    // Haptics are best-effort and should never block the interaction.
  }
}

export function PressableScale({
  animatedStyle,
  disabled,
  haptic = 'selection',
  onPress,
  onPressIn,
  onPressOut,
  pressScale = MotionScale.press,
  style,
  ...props
}: PressableScaleProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  const scale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (!disabled && !prefersReducedMotion) {
        scale.value = withTiming(pressScale, {
          duration: MotionDurations.pressIn,
          easing: MotionEasing.soft,
        });
      }
      onPressIn?.(event);
    },
    [disabled, onPressIn, pressScale, prefersReducedMotion, scale]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (!prefersReducedMotion) {
        scale.value = withTiming(1, {
          duration: MotionDurations.pressOut,
          easing: MotionEasing.standard,
        });
      }
      onPressOut?.(event);
    },
    [onPressOut, prefersReducedMotion, scale]
  );

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;
      void runHaptic(haptic);
      onPress?.(event);
    },
    [disabled, haptic, onPress]
  );

  return (
    <Animated.View style={[scaleStyle, animatedStyle]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
      />
    </Animated.View>
  );
}
