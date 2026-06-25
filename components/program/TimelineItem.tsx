import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { useReducedMotionPreference } from '@/lib/motion/accessibility';

interface TimelineItemProps {
  children: React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
  isLocked: boolean;
  isNextLocked?: boolean;
  isCompleted: boolean;
  isPartial?: boolean;
  isSkipped?: boolean;
  isCurrent: boolean;
  onLayout?: (event: import('react-native').LayoutChangeEvent) => void;
}

export function TimelineItem({
  children,
  isFirst,
  isLast,
  isLocked,
  isNextLocked,
  isCompleted,
  isPartial = false,
  isSkipped = false,
  isCurrent,
  onLayout,
}: TimelineItemProps) {
  // Connector Line
  const connectorColor = isCompleted
    ? 'bg-forest/20'
    : isLocked
      ? 'bg-forest/5'
      : 'bg-forest/10';

  // Pulse animation for Current Day
  const prefersReducedMotion = useReducedMotionPreference();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (isCurrent && !prefersReducedMotion) {
      scale.value = withRepeat(
        withTiming(1.6, { duration: 1500, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
      opacity.value = withRepeat(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
      return;
    }

    cancelAnimation(scale);
    cancelAnimation(opacity);
    scale.value = 1;
    opacity.value = 0;
  }, [isCurrent, opacity, prefersReducedMotion, scale]);

  const animatedRingStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const animatedRingStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 1.3 }],
    opacity: opacity.value * 0.4,
  }));

  // Render the dot based on status
  const renderDot = () => {
    if (isCurrent) {
      return (
        <View className="w-5 h-5 rounded-full bg-forest items-center justify-center" />
      );
    }
    if (isCompleted) {
      return (
        <View className="w-5 h-5 rounded-full bg-[#E3F3E5] border border-forest/15 items-center justify-center">
          <Svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20,6 9,17 4,12" />
          </Svg>
        </View>
      );
    }
    if (isPartial) {
      return (
        <View className="w-5 h-5 rounded-full border border-forest/30 bg-transparent items-center justify-center">
          <View className="w-1.5 h-1.5 rounded-full bg-forest/60" />
        </View>
      );
    }
    if (isSkipped) {
      return (
        <View className="w-1.5 h-1.5 rounded-full bg-forest/20" />
      );
    }
    if (isLocked) {
      return (
        <View className="w-2 h-2 rounded-full border border-forest/10 bg-transparent" />
      );
    }
    // Available Day
    return (
      <View className="w-5 h-5 rounded-full border border-forest/25 bg-transparent" />
    );
  };

  return (
    <View 
      className="flex-row items-start relative mb-4" 
      onLayout={onLayout}
      style={{ zIndex: isCurrent ? 10 : 1 }}
    >
      {/* 
        Vertical connector line. Maps to CSS: 
        left: 9px, top: 28px, bottom: -16px, width: 2px 
      */}
      {!isLast && (
        <View 
          className={`absolute left-[9px] top-[28px] -bottom-[16px] w-[2px] rounded-full ${connectorColor}`} 
        />
      )}

      {/* Node column: 20px wide */}
      <View className="w-[20px] mt-[18px] items-center justify-center relative z-10 mr-[14px]">
        {/* Pulsing rings for Current Day */}
        {isCurrent && (
          <View className="absolute items-center justify-center">
             <Animated.View
               style={[
                 animatedRingStyle2,
                 {
                   position: 'absolute',
                   width: 20,
                   height: 20,
                   borderRadius: 10,
                   backgroundColor: '#06290C',
                 },
               ]}
             />
            <Animated.View
               style={[
                 animatedRingStyle1,
                 {
                   position: 'absolute',
                   width: 20,
                   height: 20,
                   borderRadius: 10,
                   backgroundColor: '#06290C',
                 },
               ]}
             />
          </View>
        )}
        
        {/* Actual Node */}
        {renderDot()}
      </View>

      {/* Card column */}
      <View className="flex-1">
        {children}
      </View>
    </View>
  );
}
