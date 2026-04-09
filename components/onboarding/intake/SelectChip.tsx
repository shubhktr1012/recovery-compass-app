import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SelectChip({ label, selected, onPress }: SelectChipProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1 : 0.95, { damping: 15, stiffness: 150 }) }],
    backgroundColor: withTiming(selected ? 'rgba(6, 41, 12, 0.04)' : '#FFFFFF', { duration: 150 }),
    borderColor: withTiming(selected ? 'rgba(6, 41, 12, 0.25)' : 'rgba(6, 41, 12, 0.08)', { duration: 150 }),
  }));

  return (
    <AnimatedPressable 
      onPress={onPress}
      style={[animatedStyle, { borderWidth: 1 }]}
      className="px-5 py-3 rounded-full"
    >
      <Text 
        className={`font-satoshi text-[14px] ${
          selected ? 'font-satoshi-bold text-forest' : 'text-forest/60'
        }`}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
