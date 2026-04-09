import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface CompassCTAProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CompassCTA({ 
  label, 
  onPress, 
  disabled = false, 
  loading = false,
  variant = 'primary'
}: CompassCTAProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(disabled ? 0.4 : 1, { duration: 200 }),
  }));

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPress={onPress}
      style={animatedStyle}
      className={`w-full flex-row items-center justify-center rounded-full py-4 px-6 ${
        variant === 'primary' 
          ? 'bg-forest shadow-lg shadow-forest/15' 
          : 'bg-surface border border-forest/10'
      }`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#06290C'} />
      ) : (
        <Text 
          className={`font-satoshi-bold text-[15px] tracking-[0.3px] ${
            variant === 'primary' ? 'text-white' : 'text-forest'
          }`}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}
