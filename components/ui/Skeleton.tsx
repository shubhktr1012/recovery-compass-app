import React, { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={twMerge('bg-gray-200', className)}
      style={[animatedStyle, { width, height, borderRadius }]}
    />
  );
}

export function SkeletonLine(props: Omit<SkeletonProps, 'height'>) {
  return <Skeleton height={16} width="100%" {...props} />;
}

export function SkeletonTitle(props: Omit<SkeletonProps, 'height' | 'width'>) {
  return <Skeleton height={28} width="60%" {...props} />;
}

export function SkeletonCard(props: Omit<SkeletonProps, 'height' | 'width' | 'borderRadius'>) {
  return <Skeleton height={160} width="100%" borderRadius={24} {...props} />;
}

export function SkeletonCircle(props: Omit<SkeletonProps, 'height' | 'width' | 'borderRadius'>) {
  return <Skeleton height={48} width={48} borderRadius={24} {...props} />;
}

export default Skeleton;
