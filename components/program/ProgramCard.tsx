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
  isPartial?: boolean;
  isCurrent: boolean;
  isReturningUser?: boolean;
  availabilityLabel?: string | null;
}

export function ProgramCard({
  day,
  isLocked,
  isCompleted,
  isPartial = false,
  isCurrent,
  isReturningUser = false,
  availabilityLabel,
}: ProgramCardProps) {
  const { fontScale } = useWindowDimensions();
  const showDuration = fontScale <= 1.25;

  if (isCurrent) {
    return (
      <View
        className="rounded-[24px] bg-white px-6 py-6 border border-forest/10"
        style={{
          shadowColor: '#06290C',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.06,
          shadowRadius: 32,
          elevation: 6,
        }}
      >
        <View className="mb-3 flex-row items-baseline justify-between">
          <Text className="font-erode-semibold text-[32px] leading-[36px] text-forest">
            Day {day.id}
          </Text>
          <Text className="font-satoshi-bold text-[10px] uppercase tracking-[2px] text-forest">
            {isPartial ? 'PARTIAL' : isReturningUser ? 'WELCOME BACK' : 'TODAY'}
          </Text>
        </View>
        <Text className="font-satoshi-medium text-[20px] leading-[26px] text-forest mb-2.5">
          {day.title}
        </Text>
        <Text className="font-satoshi text-[16px] leading-[26px] text-forest/70 mb-5">
          {day.description}
        </Text>
        <View className="flex-row items-center justify-between border-t border-forest/[0.06] pt-4 mt-2">
          <Text className="font-satoshi-medium text-[13px] text-forest/60">
            Open today’s guidance
          </Text>
          {showDuration && (
            <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.4px] text-forest/50">
              {day.durationMinutes} min
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (isCompleted) {
    return (
      <View className="px-2 py-4 opacity-70">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <IconSymbol 
              name="checkmark" 
              size={12} 
              color={AppColors.forest} 
              style={{ marginRight: 8, opacity: 0.8 }}
            />
            <Text className="font-erode-medium text-[22px] text-forest">
              Day {day.id}
            </Text>
          </View>
          {showDuration && (
            <Text className="font-satoshi text-[12px] text-forest/40">
              {day.durationMinutes} min
            </Text>
          )}
        </View>
        <Text className="font-satoshi-medium text-[16px] leading-[24px] text-forest ml-5 mb-1.5">
          {day.title}
        </Text>
        <Text className="font-satoshi text-[14px] leading-[22px] text-forest/50 ml-5" numberOfLines={2}>
          {day.description}
        </Text>
      </View>
    );
  }

  if (isPartial) {
    return (
      <View className="px-2 py-4 opacity-85">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-erode-medium text-[22px] text-forest">
            Day {day.id}
          </Text>
          <Text className="font-satoshi-bold text-[10px] uppercase tracking-[2px] text-forest/50">
            PARTIAL
          </Text>
        </View>
        <Text className="font-satoshi-medium text-[16px] leading-[24px] text-forest ml-5 mb-1.5">
          {day.title}
        </Text>
        <Text className="font-satoshi text-[14px] leading-[22px] text-forest/55 ml-5" numberOfLines={2}>
          Revisit this day whenever you're ready and mark it fully complete.
        </Text>
      </View>
    );
  }

  if (isLocked) {
    return (
      <View className="px-2 py-4 opacity-40">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-erode-medium text-[22px] text-forest">
            Day {day.id}
          </Text>
        </View>
        <Text className="font-satoshi-medium text-[16px] leading-[24px] text-forest mb-1.5">
          {day.title}
        </Text>
        <Text className="font-satoshi text-[14px] leading-[22px] text-forest/50" numberOfLines={2}>
          {day.description}
        </Text>
        {availabilityLabel ? (
          <Text className="mt-3 font-satoshi-bold text-[10px] uppercase tracking-[1px] text-forest/40">
            {availabilityLabel}
          </Text>
        ) : null}
      </View>
    );
  }

  // Available, incomplete, not current (e.g. a skipped or ignored past day)
  return (
    <View className="px-2 py-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-erode-medium text-[22px] text-forest">
          Day {day.id}
        </Text>
        {showDuration && (
          <Text className="font-satoshi text-[12px] text-forest/60">
            {day.durationMinutes} min
          </Text>
        )}
      </View>
      <Text className="font-satoshi-medium text-[16px] leading-[24px] text-forest mb-1.5">
        {day.title}
      </Text>
      <Text className="font-satoshi text-[14px] leading-[22px] text-forest/70" numberOfLines={2}>
        {day.description}
      </Text>
    </View>
  );
}
