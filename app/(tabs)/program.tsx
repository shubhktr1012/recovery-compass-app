import React, { useCallback, useMemo, useRef, memo } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent, ScrollView, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withSpring } from 'react-native-reanimated';

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
  index, 
  isFirst, 
  isLast, 
  isLocked, 
  isCompleted, 
  isCurrent, 
  isReturningUser, 
  activeProgram,
  onLayout
}: any) => {
  return (
    <TimelineItem
      key={`${activeProgram}-${day.dayNumber}`}
      isFirst={isFirst}
      isLast={isLast}
      isLocked={isLocked}
      isCompleted={isCompleted}
      isCurrent={isCurrent}
      onLayout={onLayout}
    >
      <SquishPressable
        disabled={isLocked}
        onPress={() => router.push(`/day-detail?programSlug=${activeProgram}&dayNumber=${day.dayNumber}` as Href)}
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
          isCurrent={isCurrent}
          isReturningUser={isReturningUser}
        />
      </SquishPressable>
    </TimelineItem>
  );
});

export default function ProgramScreen() {
  const { access, progress } = useProfile();
  const activeProgram = (access.ownedProgram ?? 'six_day_reset') as ProgramSlug;
  const queryClient = useQueryClient();
  const { program } = useProgram(activeProgram);
  const totalDays = program?.totalDays ?? 1;

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: programQueryKey(activeProgram) });
    }, [activeProgram, queryClient])
  );

  const { completedDays, currentDay } = useMemo(() => {
    const derivedCurrentDay = access.startedAt
      ? getProgramScheduledDay(access.startedAt, totalDays)
      : access.currentDay ?? 1;

    return {
      currentDay: access.completionState === 'completed' ? totalDays : derivedCurrentDay,
      completedDays: progress?.completedDays ?? [],
    };
  }, [access.completionState, access.currentDay, access.startedAt, progress?.completedDays, totalDays]);
  const isArchivedReset = activeProgram === 'six_day_reset' && access.purchaseState === 'owned_archived';
  const nextUnlockLabel = useMemo(() => {
    if (access.completionState === 'completed') return null;
    return formatUnlockLabel(getProgramNextUnlockAt(access.startedAt, totalDays));
  }, [access.completionState, access.startedAt, totalDays]);

  // Determine if user has been away for 3+ days (72 hours)
  const isReturningUser = useMemo(() => {
    if (!progress?.updatedAt) return false;
    const hoursSinceUpdate = (Date.now() - new Date(progress.updatedAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate >= 72;
  }, [progress?.updatedAt]);

  if (!program) {
    return null;
  }

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

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <PaperGrain />
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerClassName="p-6 pb-32"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="mb-8 pt-2">
          <Text className="font-satoshi text-[11px] uppercase tracking-[3px] text-forest/35 mb-1">Your Program</Text>
          <Text className="font-erode-medium text-[40px] leading-[48px] tracking-tight text-forest mb-3">{program.name}</Text>
          <Text className="font-satoshi text-[14px] text-forest/40">
            Day {Math.min(currentDay, program.totalDays)} of {program.totalDays}
          </Text>
          <Text className="font-satoshi text-[13px] text-forest/30 mt-1">{program.description}</Text>
          {nextUnlockLabel ? (
            <Text className="mt-3 font-satoshi text-sm text-forest/70">
              {nextUnlockLabel}
            </Text>
          ) : null}
          {isArchivedReset ? (
            <Text className="font-satoshi text-sm text-forest/70 mt-3">
              Your 6-Day Control has been archived. The next step is upgrading into the 90-Day Smoking Reset.
            </Text>
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
            {program.days.map((day, index) => {
              const isCompleted = completedDays.includes(day.dayNumber);
              const isLocked = isArchivedReset || day.dayNumber > currentDay;
              const isCurrent = day.dayNumber === currentDay && !isCompleted;

              return (
                <ProgramTimelineNode
                  key={`${activeProgram}-${day.dayNumber}`}
                  day={day}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === program.days.length - 1}
                  isLocked={isLocked}
                  isCompleted={isCompleted}
                  isCurrent={isCurrent}
                  isReturningUser={isReturningUser}
                  activeProgram={activeProgram}
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
