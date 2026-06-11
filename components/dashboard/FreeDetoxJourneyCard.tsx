import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { ProgramIcon } from '@/components/dashboard/ExplorePrograms';
import { PressableScale } from '@/components/motion/PressableScale';
import { AppTypography } from '@/constants/typography';
import {
  FREE_DETOX_PROGRAM_SLUG,
  FREE_DETOX_TOTAL_DAYS,
  getFreeDetoxUnlockedThroughDay,
  getNextFreeDetoxDay,
  type FreeProgramProgressRecord,
} from '@/lib/free-program-progress';
import { buildDayDetailRoute } from '@/lib/navigation/routes';
import { MotionScale } from '@/lib/motion/tokens';

type FreeDetoxJourneyCardProps = {
  progress?: FreeProgramProgressRecord | null;
  variant?: 'free-tier' | 'bonus';
};

const DETOX_DAY_NUMBERS = Array.from({ length: FREE_DETOX_TOTAL_DAYS }, (_, index) => index + 1);

export function FreeDetoxJourneyCard({ progress, variant = 'free-tier' }: FreeDetoxJourneyCardProps) {
  const router = useRouter();
  const nextDay = getNextFreeDetoxDay(progress);
  const isComplete = Boolean(progress?.completedAt || progress?.completedDays.includes(FREE_DETOX_TOTAL_DAYS));
  const completedDays = progress?.completedDays ?? [];
  const partialDays = progress?.partialDays ?? [];
  const completedCount = completedDays.length;
  const unlockedThroughDay = getFreeDetoxUnlockedThroughDay(progress);

  const progressPercent = Math.round((completedCount / FREE_DETOX_TOTAL_DAYS) * 100);

  const ctaLabel = isComplete ? 'Review Timeline' : completedCount > 0 ? `Resume Day ${nextDay}` : 'Start Program';

  const openDay = (dayNumber: number) => {
    router.push(
      buildDayDetailRoute({
        programSlug: FREE_DETOX_PROGRAM_SLUG,
        dayNumber,
      })
    );
  };

  return (
    <View className="relative overflow-hidden rounded-[28px] border border-[#C5E0C9]/65 shadow-sm shadow-forest/5">
      {/* Premium Diagonal Gradient Background */}
      <LinearGradient
        colors={['#EAF5ED', '#FAFCFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative background ambient highlight */}
      <View
        className="absolute -right-12 -top-12 w-28 h-28 rounded-full bg-[#A1CFA7]/15 blur-2xl"
        pointerEvents="none"
      />

      <View className="p-5 flex-col gap-4">
        {/* Upper row: Icon & Titles */}
        <View className="flex-row items-center gap-3.5">
          <View className="h-12 w-12 rounded-[16px] bg-white items-center justify-center border border-[#C5E0C9]/45 shadow-sm shadow-forest/3">
            <ProgramIcon category="detox" />
          </View>

          <View className="flex-1">
            <Text className="text-forest mt-0.5" style={AppTypography.displayCardSm}>
              Free Detox Program
            </Text>
          </View>
        </View>

        {/* Short description */}
        <Text className="text-forest/50" style={[AppTypography.body, { lineHeight: 18.5 }]}>
          A gentle reset for sleep, energy, gut health, stress, and cravings.
        </Text>

        {/* Progress meter widget */}
        <View className="bg-white/60 border border-[#C5E0C9]/40 rounded-[20px] p-3.5">
          <View className="flex-row justify-between items-center">
            <Text className="text-forest/45 font-bold text-[9px] tracking-[1.2px]" style={AppTypography.eyebrow}>
              YOUR PROGRESS
            </Text>
            <Text className="text-forest/75 font-semibold text-[11px]" style={AppTypography.metaMedium}>
              {isComplete ? 'All days complete!' : `${completedCount} of ${FREE_DETOX_TOTAL_DAYS} days done`}
            </Text>
          </View>

          <View className="h-1.5 w-full bg-forest/5 rounded-full mt-2 overflow-hidden">
            <View
              className="h-full bg-[#5A8F65] rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>

        {/* Timeline Review Section */}
        <View className="border-t border-[#C5E0C9]/40 pt-3">
          <Text className="text-forest/45 font-bold text-[9px] tracking-[1.2px]" style={AppTypography.eyebrow}>
            DAILY TIMELINE
          </Text>

          <View className="relative flex-row justify-between items-center py-2 mt-2 px-1">
            {/* Connected horizontal line container */}
            <View style={{ position: 'absolute', left: 18, right: 18, top: 20, height: 2 }} pointerEvents="none">
              <View style={{ flex: 1, backgroundColor: 'rgba(6,41,12,0.06)', height: '100%' }} />
              {unlockedThroughDay > 1 && (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    backgroundColor: '#5A8F65',
                    width: `${((unlockedThroughDay - 1) / (FREE_DETOX_TOTAL_DAYS - 1)) * 100}%`,
                  }}
                />
              )}
            </View>

            {/* Timeline Nodes */}
            {DETOX_DAY_NUMBERS.map((dayNumber) => {
              const isLocked = dayNumber > unlockedThroughDay;
              const isCompleted = completedDays.includes(dayNumber);
              const isPartial = partialDays.includes(dayNumber) && !isCompleted;
              const isCurrent = !isComplete && dayNumber === nextDay;

              const statusSuffix = isCompleted ? ' completed' : isPartial ? ' started' : isCurrent ? ' current' : '';

              if (isCompleted) {
                return (
                  <PressableScale
                    key={dayNumber}
                    accessibilityRole="button"
                    accessibilityLabel={`Open Detox Day ${dayNumber}${statusSuffix}`}
                    disabled={isLocked}
                    onPress={() => openDay(dayNumber)}
                    pressScale={MotionScale.press}
                    className="w-9 h-9 rounded-full bg-[#EAF5ED] border border-[#5A8F65] items-center justify-center shadow-sm shadow-forest/2"
                  >
                    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5A8F65" strokeWidth="3">
                      <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </PressableScale>
                );
              }

              if (isCurrent) {
                return (
                  <PressableScale
                    key={dayNumber}
                    accessibilityRole="button"
                    accessibilityLabel={`Open Detox Day ${dayNumber}${statusSuffix}`}
                    disabled={isLocked}
                    onPress={() => openDay(dayNumber)}
                    pressScale={MotionScale.press}
                    className="w-9 h-9 items-center justify-center"
                  >
                    <View className="absolute inset-0 rounded-full border border-forest/15 scale-110 opacity-75" />
                    <View className="w-8 h-8 rounded-full bg-forest items-center justify-center shadow-md shadow-forest/15">
                      <Text className="text-white text-[12px] font-bold" style={AppTypography.buttonSm}>
                        {dayNumber}
                      </Text>
                    </View>
                  </PressableScale>
                );
              }

              if (isLocked) {
                return (
                  <View
                    key={dayNumber}
                    className="w-9 h-9 rounded-full bg-white/45 border border-forest/6 items-center justify-center"
                  >
                    <Text className="text-forest/25 text-[11px]" style={AppTypography.body}>
                      {dayNumber}
                    </Text>
                  </View>
                );
              }

              // Unlocked day (not completed, not current)
              return (
                <PressableScale
                  key={dayNumber}
                  accessibilityRole="button"
                  accessibilityLabel={`Open Detox Day ${dayNumber}${statusSuffix}`}
                  disabled={isLocked}
                  onPress={() => openDay(dayNumber)}
                  pressScale={MotionScale.press}
                  className="w-9 h-9 rounded-full bg-white border border-[#C5E0C9] items-center justify-center shadow-sm shadow-forest/2"
                >
                  <Text className="text-forest/80 text-[12px] font-bold" style={AppTypography.buttonSm}>
                    {dayNumber}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* Primary CTA Action Button at the bottom */}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          onPress={() => openDay(nextDay)}
          pressScale={MotionScale.pressLarge}
          className="bg-forest rounded-full py-3 px-4 flex-row items-center justify-center gap-2 mt-2 shadow-sm active:opacity-95"
        >
          <Text className="text-white text-[13px] font-bold" style={AppTypography.buttonSm}>
            {ctaLabel}
          </Text>
          <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <Path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </PressableScale>
      </View>
    </View>
  );
}
