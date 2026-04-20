import React, { useCallback, useMemo, useRef, memo } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent, ScrollView, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import { useProgram } from '@/content';
import { useProfile } from '@/providers/profile';
import { formatUnlockLabel, getProgramNextUnlockAt, getProgramScheduledDay } from '@/lib/programs/schedule';
import { TimelineItem } from '@/components/program/TimelineItem';
import { ProgramCard } from '@/components/program/ProgramCard';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { DayContent, ProgramSlug } from '@/types/content';
import { programQueryKey } from '@/hooks/contentQueryUtils';

function getDayPreview(day: DayContent) {
  const introCard = day.cards.find((card) => card.type === 'intro');
  if (introCard?.type === 'intro') {
    return introCard.goal;
  }

  const lessonCard = day.cards.find((card) => card.type === 'lesson');
  if (lessonCard?.type === 'lesson') {
    return lessonCard.highlight ?? lessonCard.paragraphs[0] ?? 'Open today’s guidance and keep moving.';
  }

  return 'Open today’s guidance and keep moving.';
}

const SquishPressable = ({ children, disabled, onPress, className }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) scale.value = withTiming(0.97, { duration: 180, easing: Easing.inOut(Easing.cubic) });
  };
  const handlePressOut = () => {
    if (!disabled) scale.value = withTiming(1, { duration: 240, easing: Easing.inOut(Easing.cubic) });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      className={className}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const ProgramTimelineNode = memo(({ 
  day, 
  isFirst, 
  isLast, 
  isLocked, 
  isCompleted, 
  isPartial,
  isCurrent, 
  isReturningUser, 
  activeProgram,
  availabilityLabel,
  onLayout,
  onPress,
}: any) => {
  return (
    <TimelineItem
      key={`${activeProgram}-${day.dayNumber}`}
      isFirst={isFirst}
      isLast={isLast}
      isLocked={isLocked}
      isCompleted={isCompleted}
      isPartial={isPartial}
      isCurrent={isCurrent}
      onLayout={onLayout}
    >
      <SquishPressable
        disabled={isLocked}
        onPress={onPress}
        className={isLocked ? "opacity-70" : ""}
      >
        <ProgramCard
          day={{
            id: day.dayNumber,
            title: day.dayTitle,
            description: getDayPreview(day),
            durationMinutes: day.estimatedMinutes ?? 5,
          }}
          isLocked={isLocked}
          isCompleted={isCompleted}
          isPartial={isPartial}
          isCurrent={isCurrent}
          isReturningUser={isReturningUser}
          availabilityLabel={availabilityLabel}
        />
      </SquishPressable>
    </TimelineItem>
  );
});
ProgramTimelineNode.displayName = 'ProgramTimelineNode';

function ProgramScreenContent({ activeProgram }: { activeProgram: ProgramSlug }) {
  const router = useRouter();
  const { access, progress } = useProfile();
  const queryClient = useQueryClient();
  const { program } = useProgram(activeProgram);
  const totalDays = program?.totalDays ?? 1;

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: programQueryKey(activeProgram) });
    }, [activeProgram, queryClient])
  );

  const { completedDays, partialDays, currentDay } = useMemo(() => {
    const derivedCurrentDay = access.startedAt
      ? getProgramScheduledDay(access.startedAt, totalDays)
      : access.currentDay ?? 1;

    return {
      currentDay: access.completionState === 'completed' ? totalDays : derivedCurrentDay,
      completedDays: progress?.completedDays ?? [],
      partialDays: progress?.partialDays ?? [],
    };
  }, [access.completionState, access.currentDay, access.startedAt, progress?.completedDays, progress?.partialDays, totalDays]);
  const isArchivedReset = activeProgram === 'six_day_reset' && access.purchaseState === 'owned_archived';
  const completedCount = completedDays.length;
  const progressPercent = Math.max(0, Math.min(100, Math.round((completedCount / totalDays) * 100)));
  const nextUnlockLabel = useMemo(() => {
    if (access.completionState === 'completed') return null;
    return formatUnlockLabel(getProgramNextUnlockAt(access.startedAt, totalDays));
  }, [access.completionState, access.startedAt, totalDays]);
  const nextLockedDayNumber = access.completionState === 'completed' ? null : Math.min(currentDay + 1, totalDays);

  // Determine if user has been away for 3+ days (72 hours)
  const isReturningUser = useMemo(() => {
    if (!progress?.updatedAt) return false;
    const hoursSinceUpdate = (Date.now() - new Date(progress.updatedAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate >= 72;
  }, [progress?.updatedAt]);

  // Haptics & Scroll Tracking
  const daysContainerY = useRef<number>(0);
  const currentDayRelativeY = useRef<number | null>(null);
  const currentDayHeight = useRef<number | null>(null);
  const hasFiredHaptic = useRef<boolean>(false);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (currentDayRelativeY.current === null || currentDayHeight.current === null) return;
    
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    const scrollCenterY = contentOffset.y + (layoutMeasurement.height / 2);
    
    // Calculate absolute Y boundaries relative to the ScrollView content
    const absoluteTop = daysContainerY.current + currentDayRelativeY.current;
    
    // We add a tighter hit box (middle 50% of the card) down so it snaps specifically 
    // when they are solidly viewing it, not just crossing the top edge.
    const snapTop = absoluteTop + (currentDayHeight.current * 0.25);
    const snapBottom = absoluteTop + (currentDayHeight.current * 0.75);
    
    if (scrollCenterY >= snapTop && scrollCenterY <= snapBottom) {
      if (!hasFiredHaptic.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        hasFiredHaptic.current = true;
      }
    } else {
      hasFiredHaptic.current = false;
    }
  }, []);

  if (!program) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <PaperGrain />
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerClassName="p-6 pb-32"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="mb-10 pt-4">
          <Text className="font-satoshi-bold text-[10px] uppercase tracking-[2.6px] text-forest/30 mb-2">Current Journey</Text>
          <Text className="font-erode-medium text-[44px] leading-[48px] tracking-tight text-forest mb-4 pr-4">{program.name}</Text>
          <Text className="font-satoshi text-[16px] leading-[26px] text-forest/60 pr-8">
            {program.description}
          </Text>

          <View className="mt-12">
            <View className="mb-4">
              <Text className="font-satoshi-bold text-[11px] uppercase tracking-[2px] text-forest/40 mb-1">
                Day {Math.min(currentDay, program.totalDays)} of {totalDays}
              </Text>
              <Text className="font-erode-medium text-[32px] leading-[36px] text-forest">
                {progressPercent}% Complete
              </Text>
              {nextUnlockLabel && access.completionState !== 'completed' ? (
                <Text className="font-satoshi-medium text-[12px] text-forest/50 mt-2">
                  {nextUnlockLabel}
                </Text>
              ) : null}
            </View>

            <View className="h-[3px] w-full bg-forest/[0.06] rounded-full overflow-hidden">
              <View
                className="h-full bg-forest rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          </View>

          {isArchivedReset ? (
            <View className="mt-8 rounded-[20px] border border-forest/[0.08] bg-[#F6F7F4] px-5 py-5 shadow-sm shadow-[#06290C]/5">
              <Text className="font-satoshi-bold text-[10px] uppercase tracking-[2px] text-forest/50 mb-2">
                Completed Path
              </Text>
              <Text className="font-satoshi text-[14px] leading-[22px] text-forest/70">
                Your 6-Day Control journey is complete and archived. You can revisit any completed day whenever you want.
              </Text>
            </View>
          ) : null}
        </View>

        {program.days.length === 0 ? (
          <View className="rounded-3xl border border-dashed border-gray-300 bg-white px-5 py-6">
            <Text className="font-satoshi text-center text-gray-500">
              This program is unlocked, but its daily timeline is still syncing.
            </Text>
          </View>
        ) : (
          <View onLayout={(e) => { daysContainerY.current = e.nativeEvent.layout.y; }}>
            <Text className="mb-4 font-satoshi text-[11px] uppercase tracking-[3px] text-forest/35">
              Day Timeline
            </Text>
            {program.days.map((day, index) => {
              const isCompleted = completedDays.includes(day.dayNumber);
              const isPartial = partialDays.includes(day.dayNumber) && !isCompleted;
              const isLocked = isArchivedReset || day.dayNumber > currentDay;
              const isCurrent = day.dayNumber === currentDay && !isCompleted;
              const availabilityLabel =
                isLocked && day.dayNumber === nextLockedDayNumber
                  ? nextUnlockLabel
                  : null;

              return (
                <ProgramTimelineNode
                  key={`${activeProgram}-${day.dayNumber}`}
                  day={day}
                  isFirst={index === 0}
                  isLast={index === program.days.length - 1}
                  isLocked={isLocked}
                  isCompleted={isCompleted}
                  isPartial={isPartial}
                  isCurrent={isCurrent}
                  isReturningUser={isReturningUser}
                  activeProgram={activeProgram}
                  availabilityLabel={availabilityLabel}
                  onPress={() =>
                    router.push(`/day-detail?programSlug=${activeProgram}&dayNumber=${day.dayNumber}` as Href)
                  }
                  onLayout={isCurrent ? (e: any) => {
                    currentDayRelativeY.current = e.nativeEvent.layout.y;
                    currentDayHeight.current = e.nativeEvent.layout.height;
                  } : undefined}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ProgramScreen() {
  const { access, isLoading } = useProfile();

  if (isLoading || !access.ownedProgram || access.purchaseState === 'not_owned') {
    return null;
  }

  return <ProgramScreenContent activeProgram={access.ownedProgram as ProgramSlug} />;
}
