import React, { useCallback, useMemo, useRef, memo } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent, ScrollView, Text, View } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import Svg, { Path } from 'react-native-svg';

import { useProgram, usePrograms } from '@/content';
import { useProfile } from '@/providers/profile';
import { useMinuteClock } from '@/hooks/useMinuteClock';
import { EMPTY_FINALIZED_DAY_STATES, useFinalizedDayStates } from '@/hooks/useFinalizedDayStates';
import { useOwnedPrograms } from '@/hooks/useOwnedPrograms';
import { buildDayStateProgressSummary } from '@/lib/day-state-summary';
import {
  formatUnlockLabel,
  getProgramActiveDay,
  getProgramLastFinalizedDay,
  getProgramNextUnlockAt,
  getProgramScheduledDay,
} from '@/lib/programs/schedule';
import {
  formatScheduledProgramStartLabel,
  getProgramScheduleStartSource,
  isProgramStartPending,
} from '@/lib/programs/lifecycle';
import { TimelineItem } from '@/components/program/TimelineItem';
import { ProgramCard } from '@/components/program/ProgramCard';
import { ExplorePrograms } from '@/components/dashboard/ExplorePrograms';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { ProgramWatermark } from '@/components/ui/TabWatermarks';
import { DayContent, ProgramSlug } from '@/types/content';
import { programQueryKey } from '@/hooks/contentQueryUtils';
import { AppTypography } from '@/constants/typography';

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



const ProgramTimelineNode = memo(({ 
  day, 
  isFirst, 
  isLast, 
  isLocked, 
  isCompleted, 
  isPartial,
  isSkipped,
  isCurrent, 
  isReturningUser, 
  activeProgram,
  nextLockedDayNumber,
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
      isNextLocked={isLocked && day.dayNumber === nextLockedDayNumber}
      isCompleted={isCompleted}
      isPartial={isPartial}
      isSkipped={isSkipped}
      isCurrent={isCurrent}
      onLayout={onLayout}
    >
      <ProgramCard
        day={{
          id: day.dayNumber,
          title: day.dayTitle,
          description: getDayPreview(day),
          durationMinutes: day.estimatedMinutes ?? 5,
        }}
        isLocked={isLocked}
        isNextLocked={isLocked && day.dayNumber === nextLockedDayNumber}
        isCompleted={isCompleted}
        isPartial={isPartial}
        isSkipped={isSkipped}
        isCurrent={isCurrent}
        isReturningUser={isReturningUser}
        availabilityLabel={availabilityLabel}
        onPress={isLocked ? undefined : onPress}
      />
    </TimelineItem>
  );
});
ProgramTimelineNode.displayName = 'ProgramTimelineNode';

function FreeProgramDiscoveryScreen() {
  const { profile } = useProfile();
  const { programs, isLoading } = usePrograms();
  const recommendedProgram = profile?.recommended_program ?? null;
  const sortedPrograms = useMemo(() => {
    if (!recommendedProgram) {
      return programs;
    }

    return [...programs].sort((left, right) => {
      const leftRecommended = left.slug === recommendedProgram ? 1 : 0;
      const rightRecommended = right.slug === recommendedProgram ? 1 : 0;
      return rightRecommended - leftRecommended;
    });
  }, [programs, recommendedProgram]);

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="light" />
      <ScrollView contentContainerClassName="flex-grow pb-32" bounces={false} showsVerticalScrollIndicator={false}>
        <View className="bg-forest px-6 pt-16 pb-12 relative overflow-hidden">
          <ProgramWatermark
            width={280}
            height={170}
            opacity={0.08}
            style={{ position: 'absolute', right: -20, top: 28 }}
          />

          <Text className="uppercase text-sage/55" style={[AppTypography.metaMedium, { letterSpacing: 2 }]}>
            Program Library
          </Text>
          <Text className="text-white mt-2" style={AppTypography.displayHeroTight}>
            Choose your <Text className="italic">journey.</Text>
          </Text>
          <Text className="text-sage/62 mt-3 max-w-[300px]" style={AppTypography.bodyCompact}>
            Your onboarding recommendation is saved. Unlock the program that fits now, or keep using free access until you are ready.
          </Text>
        </View>

        <View className="bg-surface rounded-t-[28px] -mt-7 px-5 pt-6 pb-[110px] relative z-20 flex-1">
          <PaperGrain />
          <View className="bg-white rounded-[24px] px-5 py-5 shadow-sm shadow-forest/5 mb-5">
            <Text className="uppercase text-forest/38" style={[AppTypography.eyebrow, { letterSpacing: 1.5 }]}>
              No active program yet
            </Text>
            <Text className="text-forest mt-1" style={AppTypography.displayCardSm}>
              Browse before you commit.
            </Text>
            <Text className="text-forest/55 mt-2" style={AppTypography.body}>
              Buying a program will unlock the daily timeline. Buying more later will add it to your program library.
            </Text>
          </View>

          <ExplorePrograms
            title="Available Programs"
            programs={sortedPrograms}
            isLoading={isLoading}
            recommendedProgramSlug={recommendedProgram}
            emptyMessage="Programs are still syncing. Please check again shortly."
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ProgramScreenContent({
  activeProgram,
  isCompletedReview = false,
}: {
  activeProgram: ProgramSlug;
  isCompletedReview?: boolean;
}) {
  const router = useRouter();
  const { access, profile, progress } = useProfile();
  const queryClient = useQueryClient();
  const { program } = useProgram(activeProgram);
  const now = useMinuteClock();
  const totalDays = program?.totalDays ?? 1;
  const isCompletedTimeline = isCompletedReview || access.completionState === 'completed';
  const scheduledStartPending = !isCompletedReview && isProgramStartPending(access, now);
  const finalizedDayStatesQuery = useFinalizedDayStates(profile?.id ?? access.ownerUserId ?? null, activeProgram);
  const finalizedDayStates = finalizedDayStatesQuery.data ?? EMPTY_FINALIZED_DAY_STATES;
  const dayStateSummary = useMemo(
    () => buildDayStateProgressSummary(finalizedDayStates),
    [finalizedDayStates]
  );
  const hasFinalizedDayStateTruth = finalizedDayStates.length > 0;

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: programQueryKey(activeProgram) });
    }, [activeProgram, queryClient])
  );

  const { activeDayNumber, completedDays, lastFinalizedDay, partialDays, unlockedThroughDay } = useMemo(() => {
    if (isCompletedReview) {
      const lastReviewDay = Math.max(0, ...finalizedDayStates.map((row) => row.dayNumber));

      return {
        activeDayNumber: null,
        completedDays: hasFinalizedDayStateTruth ? dayStateSummary.completedDays : [],
        lastFinalizedDay: Math.min(totalDays, lastReviewDay),
        partialDays: hasFinalizedDayStateTruth ? dayStateSummary.partialDays : [],
        unlockedThroughDay: totalDays,
      };
    }

    const scheduleStartSource = getProgramScheduleStartSource(access);
    const progressCompletedDays = hasFinalizedDayStateTruth
      ? dayStateSummary.completedDays
      : progress?.completedDays ?? [];
    const progressPartialDays = hasFinalizedDayStateTruth
      ? dayStateSummary.partialDays
      : progress?.partialDays ?? [];
    const derivedUnlockedDay = scheduledStartPending
      ? 1
      : access.programState === 'paused'
      ? access.currentDay ?? 1
      : scheduleStartSource
      ? getProgramScheduledDay(scheduleStartSource, totalDays, now)
      : access.currentDay ?? 1;
    const derivedActiveDay = scheduledStartPending || access.programState === 'paused'
      ? null
      : scheduleStartSource
      ? getProgramActiveDay(scheduleStartSource, totalDays, now)
      : derivedUnlockedDay;
    const derivedLastFinalizedDay = scheduleStartSource && !scheduledStartPending
      ? getProgramLastFinalizedDay(scheduleStartSource, totalDays, now)
      : Math.max(0, ...progressCompletedDays, ...progressPartialDays);
    const highestTouchedDay = Math.max(
      0,
      ...progressCompletedDays,
      ...progressPartialDays,
      access.currentDay ?? 0
    );
    const unlockedThroughDay = Math.min(
      totalDays,
      Math.max(derivedUnlockedDay, highestTouchedDay || 1)
    );

    return {
      activeDayNumber: isCompletedTimeline ? null : derivedActiveDay,
      completedDays: progressCompletedDays,
      lastFinalizedDay: Math.min(totalDays, derivedLastFinalizedDay),
      partialDays: progressPartialDays,
      unlockedThroughDay: isCompletedTimeline ? totalDays : unlockedThroughDay,
    };
  }, [access, dayStateSummary.completedDays, dayStateSummary.partialDays, finalizedDayStates, hasFinalizedDayStateTruth, isCompletedReview, isCompletedTimeline, now, progress?.completedDays, progress?.partialDays, scheduledStartPending, totalDays]);
  const isArchivedReset = !isCompletedReview && activeProgram === 'six_day_reset' && access.purchaseState === 'owned_archived';
  const completedCount = completedDays.length;
  const progressPercent = isCompletedTimeline
    ? 100
    : Math.max(0, Math.min(100, Math.round((completedCount / totalDays) * 100)));
  const nextUnlockLabel = useMemo(() => {
    if (isCompletedTimeline) return null;
    if (isProgramStartPending(access, now)) {
      return formatScheduledProgramStartLabel(access.scheduledStartDate, now);
    }
    return formatUnlockLabel(getProgramNextUnlockAt(getProgramScheduleStartSource(access), totalDays, now), now);
  }, [access, isCompletedTimeline, now, totalDays]);
  const nextLockedDayNumber = isCompletedTimeline
    ? null
    : scheduledStartPending
      ? 1
      : Math.min(unlockedThroughDay + 1, totalDays);

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
    
    const absoluteTop = daysContainerY.current + currentDayRelativeY.current;
    
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

  // Determine split Program Name (e.g. "6-Day Control" -> "6-Day" normal, "Control" italic)
  const nameParts = program.name.split(' ');
  const namePrefix = nameParts.slice(0, -1).join(' ');
  const nameItalic = nameParts[nameParts.length - 1];

  return (
    <View className="flex-1 bg-forest">
      <StatusBar style="light" />
      <ScrollView 
        contentContainerClassName="flex-grow"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER AREA */}
        <View className="bg-forest px-6 pt-16 pb-[52px] overflow-hidden relative">
          <ProgramWatermark
            width={280}
            height={170}
            opacity={0.06}
            style={{ position: 'absolute', right: -20, top: 50 }}
          />

          <View className="mb-[18px] relative z-10 mt-8">
            <Text className="uppercase text-sage/55" style={[AppTypography.metaMedium, { letterSpacing: 2 }]}>
              {isCompletedTimeline ? 'Completed Journey' : 'Current Journey'}
            </Text>
          </View>
          
          <Text className="tracking-[-0.6px] text-white relative z-10 pr-4" style={AppTypography.displayHeroTight}>
            {namePrefix} <Text className="italic">{nameItalic}</Text>
          </Text>
          
          <Text
            className="text-sage/60 pr-8 mt-2 relative z-10 max-w-[280px]"
            style={AppTypography.bodyCompact}
          >
            {isCompletedTimeline
              ? `You completed this reset. All ${totalDays} days are now available to revisit.` 
              : program.description}
          </Text>

          <View className="mt-4 relative z-10">
            <View className="flex-row justify-between items-baseline mb-2">
              <Text className="text-white tracking-[-0.4px]" style={AppTypography.displayMetric}>
                {isCompletedTimeline ? totalDays : Math.min(unlockedThroughDay, program.totalDays)} <Text className="text-sage/55 tracking-normal" style={AppTypography.label}>of {totalDays} days</Text>
              </Text>
              <Text className="text-sage/60" style={[AppTypography.metaMedium, { letterSpacing: 0.3 }]}>
                {progressPercent}% complete
              </Text>
            </View>

            <View className="h-[3px] w-full bg-sage/[0.18] rounded-full overflow-hidden">
              <View
                className="h-full bg-sage rounded-full"
                style={{ width: `${progressPercent}%`, backgroundColor: isCompletedTimeline ? 'rgba(93,207,122,0.7)' : '#E3F3E5' }}
              />
            </View>
            
            {nextUnlockLabel && !isCompletedTimeline ? (
              <Text className="text-sage/40 mt-[6px]" style={[AppTypography.meta, { letterSpacing: 0.2 }]}>
                {nextUnlockLabel}
              </Text>
            ) : null}
          </View>
        </View>

        {/* CONTENT AREA OVERLAP */}
        <View className="bg-surface rounded-t-[28px] -mt-7 pt-6 pb-[110px] relative z-20 flex-1">
          <PaperGrain />
          <View onLayout={(e) => { daysContainerY.current = e.nativeEvent.layout.y; }}>
            
            {isArchivedReset && isCompletedTimeline ? (
              <View className="mx-5 mb-4 bg-white rounded-[20px] px-[18px] py-4 shadow-sm shadow-forest/5" style={{ shadowColor: '#06290C', shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, borderLeftWidth: 3, borderLeftColor: '#06290C' }}>
                <Text className="uppercase text-forest/40" style={[AppTypography.eyebrow, { letterSpacing: 1.4 }]}>
                  {`What's Next`}
                </Text>
                <Text className="text-forest mt-1" style={AppTypography.displayCardSmTight}>
                  Ready for the <Text className="italic">full 90 days?</Text>
                </Text>
                <Text
                  className="text-forest/60 mt-1"
                  style={AppTypography.bodyCompact}
                >
                  {`You've broken the initial autopilot. The 90-Day Quit now takes you to lasting freedom.`}
                </Text>
                <View className="flex-row items-center bg-forest rounded-full px-4 py-2 mt-3 self-start">
                  <Svg width="11" height="11" viewBox="0 0 24 24" fill="#fff" stroke="none" className="mr-1.5">
                    <Path d="M5 3 L19 12 L5 21 Z" />
                  </Svg>
                  <Text className="text-white" style={AppTypography.metaMedium}>Explore 90-Day Quit</Text>
                </View>
              </View>
            ) : null}

            <Text className="uppercase text-forest/35 px-6 mb-4" style={[AppTypography.eyebrow, { letterSpacing: 1.6 }]}>
              {isCompletedTimeline ? `All ${totalDays} Days · Revisit Anytime` : 'Day Timeline'}
            </Text>

            <View className="px-5">
              {program.days.length === 0 ? (
                <View className="rounded-3xl border border-dashed border-gray-300 bg-white px-5 py-6 mt-4 mx-1">
                  <Text className="font-satoshi text-center text-gray-500">
                    This program is unlocked, but its daily timeline is still syncing.
                  </Text>
                </View>
              ) : (
                program.days.map((day, index) => {
                  const isCompleted = completedDays.includes(day.dayNumber);
                  const isPartial = partialDays.includes(day.dayNumber) && !isCompleted;
                  const isSkipped =
                    !isCompleted &&
                    !isPartial &&
                    day.dayNumber <= lastFinalizedDay;
                  const isLocked =
                    !isCompletedTimeline &&
                    (isArchivedReset ||
                      scheduledStartPending ||
                      (!isCompleted && !isPartial && !isSkipped && day.dayNumber > unlockedThroughDay));
                  const isCurrent =
                    day.dayNumber === activeDayNumber &&
                    !isCompleted &&
                    !isPartial &&
                    !isSkipped &&
                    day.dayNumber > lastFinalizedDay;
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
                      isSkipped={isSkipped}
                      isCurrent={isCurrent}
                      isReturningUser={isReturningUser}
                      activeProgram={activeProgram}
                      nextLockedDayNumber={nextLockedDayNumber}
                      availabilityLabel={availabilityLabel}
                      onPress={() =>
                        router.push(
                          isCompletedReview
                            ? (`/day-detail?programSlug=${activeProgram}&dayNumber=${day.dayNumber}&mode=review` as Href)
                            : (`/day-detail?programSlug=${activeProgram}&dayNumber=${day.dayNumber}` as Href)
                        )
                      }
                      onLayout={isCurrent ? (e: any) => {
                        currentDayRelativeY.current = e.nativeEvent.layout.y;
                        currentDayHeight.current = e.nativeEvent.layout.height;
                      } : undefined}
                    />
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function ProgramScreen() {
  const params = useLocalSearchParams<{ reviewProgram?: string | string[] }>();
  const { access, isLoading, profile } = useProfile();
  const { ownedPrograms, isLoading: isOwnedProgramsLoading } = useOwnedPrograms();
  const requestedReviewProgram = Array.isArray(params.reviewProgram)
    ? params.reviewProgram[0]
    : params.reviewProgram;
  const completedReviewProgram = ownedPrograms.find(
    (program) =>
      program.slug === requestedReviewProgram &&
      (program.purchaseState === 'owned_completed' ||
        program.completionState === 'completed' ||
        program.programState === 'completed')
  );

  if (isLoading || (requestedReviewProgram && isOwnedProgramsLoading)) {
    return null;
  }

  if (completedReviewProgram) {
    return (
      <ProgramScreenContent
        activeProgram={completedReviewProgram.slug}
        isCompletedReview
      />
    );
  }

  if (!access.ownedProgram || access.purchaseState === 'not_owned') {
    return profile?.free_tier_activated_at ? <FreeProgramDiscoveryScreen /> : null;
  }

  return <ProgramScreenContent activeProgram={access.ownedProgram as ProgramSlug} />;
}
