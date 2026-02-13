import React from 'react';
import { View } from 'react-native';

interface TimelineItemProps {
  children: React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
  isLocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
}

export function TimelineItem({
  children,
  isFirst,
  isLast,
  isLocked,
  isCompleted,
  isCurrent,
}: TimelineItemProps) {
  const connectorColorClassName = isLocked ? 'bg-gray-200' : 'bg-forest/30';
  const dotClassName = isLocked
    ? 'bg-white border-gray-300'
    : isCurrent
      ? 'bg-forest border-forest'
      : isCompleted
        ? 'bg-forest/80 border-forest/80'
        : 'bg-white border-forest/40';

  return (
    <View className="flex-row">
      <View className="items-center mr-4">
        {!isFirst && <View className={`w-0.5 h-5 ${connectorColorClassName}`} />}
        <View className={`w-4 h-4 rounded-full border-2 ${dotClassName}`} />
        {!isLast && <View className={`w-0.5 flex-1 min-h-16 ${connectorColorClassName}`} />}
      </View>
      <View className="flex-1 pb-5">{children}</View>
    </View>
  );
}
