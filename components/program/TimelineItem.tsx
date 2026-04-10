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
  isCurrent: boolean;
  onLayout?: (event: import('react-native').LayoutChangeEvent) => void;
}

export function TimelineItem({
  children,
  isFirst,
  isLast,
  isLocked,
  isCompleted,
  isCurrent,
  onLayout,
}: TimelineItemProps) {
  // Line logic: Top line connects from previous. Bottom line connects to next.
  const topConnectorColor = isLocked ? 'bg-gray-200' : 'bg-forest';
  // Bottom line is only solid forest if THIS item is fully completed, mapping to the next.
  const bottomConnectorColor = isCompleted ? 'bg-forest' : 'bg-gray-200';

  const dotClassName = isLocked
    ? 'bg-surface border-[2px] border-gray-200'
    : isCurrent
      ? 'bg-forest border-[1px] border-forest'
      : isCompleted
        ? 'bg-forest'
        : 'bg-white border-[2px] border-forest/40';

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
      <View className="items-center w-6 mr-4">
        {!isFirst && <View className={`w-[2.5px] h-6 ${topConnectorColor}`} />}
        <View className="w-5 h-5 items-center justify-center my-0.5">
          {isCurrent && (
            <Animated.View
              style={[
                animatedRingStyle,
                {
                  position: 'absolute',
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: '#06290C',
                },
              ]}
            />
          )}
          <View className={`w-3.5 h-3.5 rounded-full z-10 ${dotClassName}`} />
        </View>
        {!isLast && <View className={`w-[2.5px] flex-1 min-h-[48px] ${bottomConnectorColor}`} />}
      </View>
      <View className="flex-1 pb-6">{children}</View>
    </View>
  );
}
