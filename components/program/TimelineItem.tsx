import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface TimelineItemProps {
  children: React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
  isLocked: boolean;
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
  isCompleted,
  isPartial = false,
  isCurrent,
  onLayout,
}: TimelineItemProps) {
  // Line logic: Top line connects from previous. Bottom line connects to next.
  const topConnectorColor = isLocked ? 'bg-forest/10' : 'bg-forest';
  // Bottom line is only solid forest if THIS item is fully completed, mapping to the next.
  const bottomConnectorColor = isCompleted ? 'bg-forest' : isPartial ? 'bg-forest/30' : 'bg-forest/10';

  const dotClassName = isLocked
    ? 'bg-transparent border border-forest/20 w-2 h-2 rounded-full'
    : isCurrent
      ? 'bg-forest w-2.5 h-2.5 rounded-full'
      : isPartial
        ? 'bg-[#D8E7D9] border border-forest/50 w-2 h-2 rounded-full'
      : isCompleted
        ? 'bg-forest/40 w-2 h-2 rounded-full'
        : 'bg-surface border border-forest/40 w-2 h-2 rounded-full';

  // Pulse animation for Current Day
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (isCurrent) {
      scale.value = withRepeat(
        withTiming(1.8, { duration: 1500, easing: Easing.out(Easing.quad) }),
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

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View 
      className="flex-row" 
      onLayout={onLayout}
    >
      <View className="items-center w-6 mr-5">
        {!isFirst && <View className={`w-[2px] h-6 ${topConnectorColor}`} />}
        <View className="w-6 h-6 items-center justify-center my-1 relative">
          {isCurrent && (
            <Animated.View
              style={[
                animatedRingStyle,
                {
                  position: 'absolute',
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#06290C',
                },
              ]}
            />
          )}
          <View className={`z-10 ${dotClassName}`} />
        </View>
        {!isLast && <View className={`w-[2px] flex-1 min-h-[48px] ${bottomConnectorColor}`} />}
      </View>
      <View className="flex-1 pb-10">{children}</View>
    </View>
  );
}
