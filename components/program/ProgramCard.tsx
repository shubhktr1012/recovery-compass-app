import React from 'react';
import { Text, View } from 'react-native';
import { ProgramDay } from '@/constants/program-data';

interface ProgramCardProps {
  day: ProgramDay;
  isLocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
}

export function ProgramCard({ day, isLocked, isCompleted, isCurrent }: ProgramCardProps) {
  const containerClassName = isLocked
    ? 'bg-white/70 border-gray-200'
    : isCurrent
      ? 'bg-sage border-forest'
      : 'bg-white border-gray-200';

  const titleClassName = isLocked ? 'text-gray-400' : 'text-forest';
  const bodyClassName = isLocked ? 'text-gray-400' : 'text-gray-600';
  const statusLabel = isLocked ? 'Locked' : isCompleted ? 'Completed' : isCurrent ? 'Current Day' : 'Unlocked';

  return (
    <View className={`rounded-3xl border p-4 ${containerClassName}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`font-erode-semibold text-xl ${titleClassName}`}>Day {day.id}</Text>
        <Text className={`font-satoshi-medium text-xs uppercase ${isLocked ? 'text-gray-400' : 'text-forest/70'}`}>
          {statusLabel}
        </Text>
      </View>
      <Text className={`font-satoshi-bold text-base mb-1 ${titleClassName}`}>{day.title}</Text>
      <Text className={`font-satoshi text-sm leading-5 mb-3 ${bodyClassName}`}>{day.description}</Text>
      <Text className={`font-satoshi-medium text-xs ${isLocked ? 'text-gray-400' : 'text-forest/70'}`}>
        {day.durationMinutes} min action
      </Text>
    </View>
  );
}
