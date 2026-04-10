import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppColors } from '@/constants/theme';

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
  isReturningUser?: boolean;
}

export function ProgramCard({ day, isLocked, isCompleted, isCurrent, isReturningUser = false }: ProgramCardProps) {
  const { fontScale } = useWindowDimensions();

  let containerClassName = 'rounded-3xl p-5 border ';
  if (isCurrent) {
    containerClassName += 'bg-[#E3F3E5] border-[#06290C]';
  } else if (isCompleted) {
    containerClassName += 'bg-transparent border-[#06290C]/10';
  } else if (isLocked) {
    containerClassName += 'bg-transparent border-transparent opacity-40';
  } else {
    containerClassName += 'bg-white border-gray-200';
  }

  const titleColor = isLocked || isCompleted ? 'text-forest/70' : 'text-forest';
  const bodyColor = isLocked || isCompleted ? 'text-forest/60' : 'text-gray-700';

  const statusLabel = isLocked ? 'LOCKED' : isCompleted ? 'COMPLETED' : isCurrent ? (isReturningUser ? 'WELCOME BACK' : 'TODAY') : 'AVAILABLE';
  const statusColor = isLocked
    ? 'text-forest/40'
    : isCompleted
      ? 'text-success'
      : isCurrent
        ? 'text-forest'
        : 'text-forest/70';

  // DYNAMIC TYPOGRAPHY DISTILLATION
  // Hide non-critical labels if the user needs large text
  const showStatusLabel = fontScale <= 1.15 || isCurrent;
  const showDuration = fontScale <= 1.25 && !isLocked;

  return (
    <View
      className={containerClassName}
      style={
        isCurrent
          ? {
              shadowColor: '#06290C',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.08,
              shadowRadius: 20,
              elevation: 4,
            }
          : undefined
      }
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className={`font-erode-semibold text-[22px] ${titleColor}`}>Day {day.id}</Text>
        {showStatusLabel ? (
          <View 
            className={`flex-row items-center ${isCompleted ? 'bg-sage pl-1 pr-2 py-0.5 rounded-lg border border-success/10' : ''}`}
          >
            {isCompleted && (
              <IconSymbol 
                name="checkmark.circle.fill" 
                size={12} 
                color={AppColors.success} 
                style={{ marginRight: 6 }}
              />
            )}
            <Text className={`font-satoshi-bold text-[10px] uppercase tracking-[2px] ${statusColor}`}>
              {statusLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <Text className={`font-satoshi-bold text-lg mb-1.5 ${titleColor}`}>{day.title}</Text>
      <Text className={`font-satoshi text-base leading-6 ${showDuration ? 'mb-4' : ''} ${bodyColor}`}>
        {day.description}
      </Text>
      {showDuration && (
        <Text className={`font-satoshi-medium text-xs ${isCompleted ? 'text-forest/40' : 'text-forest/70'}`}>
          {day.durationMinutes} min action
        </Text>
      )}
    </View>
  );
}
