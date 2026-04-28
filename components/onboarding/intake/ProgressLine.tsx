import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface ProgressLineProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressLine({ currentStep, totalSteps }: ProgressLineProps) {
  const progress = Math.min((currentStep + 1) / totalSteps, 1);

  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress * 100}%`, { duration: 400 }),
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(6,41,12,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#06290C', // forest
    borderRadius: 999,
  },
});
