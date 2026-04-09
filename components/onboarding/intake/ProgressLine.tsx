import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface ProgressLineProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressLine({ currentStep, totalSteps }: ProgressLineProps) {
  const progress = Math.min((currentStep + 1) / totalSteps, 1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress * 100}%`, { duration: 350 }),
  }));

  return (
    <View className="h-[2px] w-full items-start overflow-hidden rounded-full bg-forest/8 mt-4">
      <Animated.View 
        className="h-full bg-forest" 
        style={animatedStyle} 
      />
    </View>
  );
}
