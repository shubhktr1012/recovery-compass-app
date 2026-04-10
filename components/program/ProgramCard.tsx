import React from 'react';
import { Text, View } from 'react-native';

interface ProgramCardDay {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
}

interface ProgramCardProps {
  day: ProgramCardDay;
  isLocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
}

export function ProgramCard({ day, isLocked, isCompleted, isCurrent }: ProgramCardProps) {
  const containerClassName = isLocked
    ? 'bg-white/70 border-gray-200'
    : isCurrent
      ? 'bg-sage border-forest shadow-sm'
      : isCompleted
        ? 'bg-white border-forest/15'
        : 'bg-white border-gray-200';

  const titleClassName = isLocked ? 'text-gray-400' : 'text-forest';
  const bodyClassName = isLocked ? 'text-gray-400' : 'text-gray-600';
  const statusLabel = isLocked ? 'Locked' : isCompleted ? 'Completed' : isCurrent ? 'Today' : 'Available';
  const statusClassName = isLocked
    ? 'bg-gray-100 text-gray-400'
    : isCompleted
      ? 'bg-forest text-white'
      : isCurrent
        ? 'bg-white text-forest'
        : 'bg-sage text-forest/80';

  return (
    <View className={`rounded-3xl border p-4 ${containerClassName}`}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className={`font-erode-semibold text-xl ${titleClassName}`}>Day {day.id}</Text>
        <View className={`rounded-full px-3 py-1 ${statusClassName}`}>
          <Text className="font-satoshi-medium text-[11px] uppercase tracking-[1.4px]">
            {statusLabel}
          </Text>
        </View>
      </View>
      <Text className={`font-satoshi-bold text-base mb-1 ${titleClassName}`}>{day.title}</Text>
      <Text className={`font-satoshi text-sm leading-5 mb-3 ${bodyClassName}`}>{day.description}</Text>
      <Text className={`font-satoshi-medium text-xs ${isLocked ? 'text-gray-400' : 'text-forest/70'}`}>
        {day.durationMinutes} min action
      </Text>
    </View>
  );
}
