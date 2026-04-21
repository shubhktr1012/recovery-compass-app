import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';

interface TimelineItemProps {
  children: React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
  isLocked: boolean;
  isNextLocked?: boolean;
  isCompleted: boolean;
  isPartial?: boolean;
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
  isCurrent,
  onLayout,
}: TimelineItemProps) {
  // Connector Line
  const connectorColor = isCompleted ? 'bg-forest/18' : 'bg-forest/[0.08]';

  // Node styles
  const isLockedOrNext = isLocked || isNextLocked;
  const dotColorClass = isCurrent
    ? 'bg-forest'
    : isCompleted
      ? 'bg-forest'
      : isPartial
        ? 'bg-[#D8E7D9] border-2 border-forest/50'
        : 'bg-transparent border-2 border-forest/20';

  // Pulse animation for Current Day
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (isCurrent) {
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
    }
  }, [isCurrent, scale, opacity]);

  const animatedRingStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const animatedRingStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 1.3 }],
    opacity: opacity.value * 0.4,
  }));

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
        <View className={`w-5 h-5 rounded-full items-center justify-center ${dotColorClass}`}>
          {isCompleted && (
            <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E3F3E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="20,6 9,17 4,12" />
            </Svg>
          )}
        </View>
      </View>

      {/* Card column */}
      <View className="flex-1">
        {children}
      </View>
    </View>
  );
}
