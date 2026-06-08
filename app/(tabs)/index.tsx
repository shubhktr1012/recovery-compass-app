import { View, ScrollView, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Redirect, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useDay, useProgram, usePrograms } from '@/content';
import { useMinuteClock } from '@/hooks/useMinuteClock';
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
import { useProfile } from '@/providers/profile';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { JournalCheckIn } from '@/components/dashboard/JournalCheckIn';
import { MyPrograms } from '@/components/dashboard/MyPrograms';
import { ExplorePrograms } from '@/components/dashboard/ExplorePrograms';
import { FreeDetoxJourneyCard } from '@/components/dashboard/FreeDetoxJourneyCard';
import { StaggeredItem } from '@/components/motion/StaggeredItem';
import type { DayContent, ProgramSlug } from '@/types/content';
import { programDayQueryKey, programQueryKey } from '@/hooks/contentQueryUtils';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { useOwnedPrograms } from '@/hooks/useOwnedPrograms';
import { useDailySteps } from '@/hooks/useDailySteps';
import { EMPTY_FINALIZED_DAY_STATES, useFinalizedDayStates } from '@/hooks/useFinalizedDayStates';
import { hasAnyProgramEntitlement } from '@/lib/access/entitlements';
import { resolveDashboardStatItems } from '@/lib/dashboard-statistics';
import { buildDayStateProgressSummary, buildRollingCompletionSummary } from '@/lib/day-state-summary';
import { PAYWALL_ROUTE, buildDayDetailRoute } from '@/lib/navigation/routes';
import { resolveProfileIdentity } from '@/lib/profile-identity';
import type { QuestionnaireAnswersSnapshot } from '@/lib/program-statistics';
import { StepPermissionPrompt } from '@/components/steps/StepPermissionPrompt';
import { isPublicCatalogProgram } from '@/content/programs/metadata';
import { useFreeDetoxProgress } from '@/hooks/useFreeDetoxProgress';
import { FREE_DETOX_PROGRAM_SLUG, getNextFreeDetoxDay } from '@/lib/free-program-progress';

const EMPTY_DAY_NUMBERS: number[] = [];

function getGreetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFreeDetoxDayPreview(day: DayContent) {
  const introCard = day.cards.find((card) => card.type === 'intro');
  if (introCard?.type === 'intro') {
    return introCard.goal;
  }

  const lessonCard = day.cards.find((card) => card.type === 'lesson');
  if (lessonCard?.type === 'lesson') {
    return lessonCard.highlight ?? lessonCard.paragraphs[0] ?? "Open today's detox guidance and keep moving.";
  }

  return "Open today's detox guidance and keep moving.";
}

function FreeTierHomeScreen() {
  const { profile } = useProfile();
  const freeDetoxProgress = useFreeDetoxProgress(profile?.id, Boolean(profile?.id));
  const onboardingQuery = useOnboardingResponse();
  const onboardingResponse = onboardingQuery.data ?? null;
  const { program: detoxProgram } = useProgram(FREE_DETOX_PROGRAM_SLUG);
  const { programs, isLoading: isProgramsLoading } = usePrograms();
  const recommendedProgram = profile?.recommended_program ?? null;
  const explorePrograms = useMemo(
    () => programs.filter((program) => isPublicCatalogProgram(program.slug)),
    [programs]
  );
  const detoxDayNumber = getNextFreeDetoxDay(freeDetoxProgress.progress);
  const detoxDay = detoxProgram?.days.find((day) => day.dayNumber === detoxDayNumber) ?? null;
  const detoxCompleted = Boolean(
    freeDetoxProgress.progress?.completedAt ||
    freeDetoxProgress.progress?.completedDays.includes(detoxProgram?.totalDays ?? 6)
  );
  const detoxStarted = Boolean((freeDetoxProgress.progress?.completedDays.length ?? 0) > 0);
  const profileIdentity = resolveProfileIdentity({
    displayName: profile?.display_name,
    fullName: onboardingResponse?.full_name,
    email: profile?.email ?? null,
    fallbackLabel: 'Friend',
  });

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="light" />
      <ScrollView contentContainerClassName="flex-grow pb-32" bounces={false} showsVerticalScrollIndicator={false}>
        <DashboardHeader
          greetingLabel={getGreetingLabel()}
          firstName={profileIdentity.displayName}
          avatarLetter={profileIdentity.initial}
          avatarUrl={profile?.avatar_url ?? null}
          activeProgramName="Free Access"
          programEyebrow="Access:"
        />

        <View
          className="bg-surface rounded-t-[32px] -mt-[24px] px-5 pt-6 pb-28 relative z-10 flex-col gap-5"
          style={{ minHeight: 600 }}
        >
          <StaggeredItem index={0}>
            <ActionCard
              dayTitle={
                detoxDay?.dayTitle ? (
                  detoxDay.dayTitle.split(' ').map((word, i, arr) =>
                    i === arr.length - 1 ? <Text key={i} className="font-erode-medium-italic">{word}</Text> : `${word} `
                  )
                ) : (
                  <><Text>6-Day Detox</Text> <Text className="font-erode-medium-italic">Program</Text></>
                )
              }
              dayPreview={detoxDay ? getFreeDetoxDayPreview(detoxDay) : 'Start with the free 6-day reset.'}
              estimatedMinutes={detoxDay?.estimatedMinutes ?? 10}
              activeProgram={FREE_DETOX_PROGRAM_SLUG}
              resolvedDayNumber={detoxDayNumber}
              ctaLabel={detoxCompleted ? 'Review' : detoxStarted ? 'Continue' : 'Start'}
            />
          </StaggeredItem>

          <StaggeredItem index={1}>
            <ExplorePrograms
              title="Explore Programs"
              programs={explorePrograms}
              isLoading={isProgramsLoading}
              recommendedProgramSlug={recommendedProgram}
              emptyMessage="Programs are still syncing. Please check again shortly."
            />
          </StaggeredItem>
        </View>
      </ScrollView>
    </View>
  );
}

function HomeScreenContent({ activeProgram }: { activeProgram: ProgramSlug }) {
  const { access, profile, progress, resumeProgramFromPause } = useProfile();
  const router = useRouter();
  const onboardingQuery = useOnboardingResponse();
  const onboardingResponse = onboardingQuery.data ?? null;
  const { program } = useProgram(activeProgram);
  const { programs } = usePrograms();
  const { ownedPrograms, isLoading: isOwnedProgramsLoading } = useOwnedPrograms();
  const dailySteps = useDailySteps();
  const queryClient = useQueryClient();
  const now = useMinuteClock();
  const userId = profile?.id ?? access.ownerUserId ?? null;
  const freeDetoxProgress = useFreeDetoxProgress(userId, Boolean(userId));
  const finalizedDayStatesQuery = useFinalizedDayStates(userId, activeProgram);
  const finalizedDayStates = finalizedDayStatesQuery.data ?? EMPTY_FINALIZED_DAY_STATES;
  const dayStateSummary = useMemo(
    () => buildDayStateProgressSummary(finalizedDayStates),
    [finalizedDayStates]
  );
  const rollingCompletionSummary = useMemo(
    () => buildRollingCompletionSummary(finalizedDayStates),
    [finalizedDayStates]
  );
  const hasFinalizedDayStateTruth = finalizedDayStates.length > 0;
  const completedDaysForStats = hasFinalizedDayStateTruth
    ? dayStateSummary.completedDays
    : progress?.completedDays ?? EMPTY_DAY_NUMBERS;
  const partialDaysForStats = hasFinalizedDayStateTruth
    ? dayStateSummary.partialDays
    : progress?.partialDays ?? EMPTY_DAY_NUMBERS;

  const programTotalDays = program?.totalDays ?? 1;
  const scheduleStartSource = getProgramScheduleStartSource(access);
  const isScheduledStartPending = isProgramStartPending(access, now);
  const isProgramPaused = access.programState === 'paused';
  const unlockedDayNumber = access.completionState === 'completed'
    ? programTotalDays
    : isProgramPaused
      ? access.currentDay ?? 1
    : isScheduledStartPending
      ? 1
    : scheduleStartSource
      ? getProgramScheduledDay(scheduleStartSource, programTotalDays, now)
      : access.currentDay ?? 1;
  const activeDayNumber = access.completionState === 'completed'
    ? null
    : isScheduledStartPending || access.programState === 'paused'
      ? null
    : scheduleStartSource
      ? getProgramActiveDay(scheduleStartSource, programTotalDays, now)
      : unlockedDayNumber;
  const lastFinalizedDayNumber = scheduleStartSource && !isScheduledStartPending
    ? getProgramLastFinalizedDay(scheduleStartSource, programTotalDays, now)
    : Math.max(0, ...(progress?.completedDays ?? []), ...(progress?.partialDays ?? []));
  const previewDayNumber = isProgramPaused
    ? unlockedDayNumber
    : activeDayNumber ?? Math.min(lastFinalizedDayNumber + 1, programTotalDays);
  const nextUnlockLabel = access.completionState === 'completed'
    ? null
    : isScheduledStartPending
      ? formatScheduledProgramStartLabel(access.scheduledStartDate, now)
      : formatUnlockLabel(getProgramNextUnlockAt(scheduleStartSource, programTotalDays, now), now);
  const isCurrentSessionLocked = activeDayNumber == null && access.completionState !== 'completed' && !isProgramPaused;

  const { day: currentDay } = useDay(activeProgram, previewDayNumber);
  const resolvedDayNumber = currentDay?.dayNumber ?? previewDayNumber;

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: programQueryKey(activeProgram) });
      void queryClient.invalidateQueries({
        queryKey: programDayQueryKey(activeProgram, previewDayNumber),
      });
    }, [activeProgram, previewDayNumber, queryClient])
  );

  const dayPreview = (() => {
    if (!currentDay) return program?.description ?? '';
    const introCard = currentDay.cards.find((c) => c.type === 'intro');
    if (introCard?.type === 'intro') return introCard.goal;
    const lessonCard = currentDay.cards.find((c) => c.type === 'lesson');
    if (lessonCard?.type === 'lesson') return lessonCard.highlight ?? lessonCard.paragraphs[0] ?? program?.description ?? '';
    return program?.description ?? '';
  })();

  const journalCard = currentDay?.cards.find((card) => card.type === 'journal');
  const handleResumeProgram = useCallback(async () => {
    await resumeProgramFromPause(activeProgram);
    router.push(buildDayDetailRoute({ programSlug: activeProgram, dayNumber: unlockedDayNumber }));
  }, [activeProgram, resumeProgramFromPause, router, unlockedDayNumber]);
  const profileIdentity = resolveProfileIdentity({
    displayName: profile?.display_name,
    fullName: onboardingResponse?.full_name,
    email: profile?.email ?? null,
    fallbackLabel: 'Friend',
  });
  const avatarUrl = profile?.avatar_url ?? null;
  const avatarLetter = profileIdentity.initial;
  const statsItems = useMemo(
    () =>
      resolveDashboardStatItems({
        programSlug: activeProgram,
        currentDayNumber: unlockedDayNumber,
        dailySteps: {
          isLoading: dailySteps.isLoading,
          permissionState: dailySteps.summary?.permissionState,
          steps: dailySteps.summary?.steps,
        },
        totalDays: programTotalDays,
        completedDays: completedDaysForStats,
        partialDays: partialDaysForStats,
        currentStreak: hasFinalizedDayStateTruth ? dayStateSummary.currentStreak : undefined,
        rollingCompletion: hasFinalizedDayStateTruth ? rollingCompletionSummary : null,
        hasAudio: program?.hasAudio ?? false,
        onboardingResponse,
        questionnaireAnswers:
          (profile?.questionnaire_answers as QuestionnaireAnswersSnapshot | null) ?? null,
        isBaselineLoading:
          onboardingQuery.isLoading &&
          !onboardingResponse &&
          !profile?.questionnaire_answers,
      }),
    [
      activeProgram,
      unlockedDayNumber,
      dailySteps.isLoading,
      dailySteps.summary?.permissionState,
      dailySteps.summary?.steps,
      onboardingQuery.isLoading,
      onboardingResponse,
      profile?.questionnaire_answers,
      program?.hasAudio,
      programTotalDays,
      completedDaysForStats,
      partialDaysForStats,
      dayStateSummary.currentStreak,
      rollingCompletionSummary,
      hasFinalizedDayStateTruth,
    ]
  );

  if (!program) {
    return null;
  }

  const ownedProgramSlugSet = new Set([
    activeProgram,
    ...ownedPrograms.map((entry) => entry.slug),
  ]);
  const explorePrograms = isOwnedProgramsLoading
    ? []
    : programs.filter((entry) => !ownedProgramSlugSet.has(entry.slug) && isPublicCatalogProgram(entry.slug));
  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="light" />
      <ScrollView contentContainerClassName="flex-grow pb-32" bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <DashboardHeader
          greetingLabel={getGreetingLabel()}
          firstName={profileIdentity.displayName}
          avatarLetter={avatarLetter}
          avatarUrl={avatarUrl}
          activeProgramName={program.name}
        />

        {/* CONTENT AREA */}
        <View 
          className="bg-surface rounded-t-[32px] -mt-[24px] px-5 pt-6 pb-28 relative z-10 flex-col gap-5"
          style={{ minHeight: 600 }}
        >
          
          <StaggeredItem index={0}>
            <ActionCard
              dayTitle={
                isProgramPaused ? (
                  <>
                    <Text>Ready to</Text> <Text className="font-erode-medium-italic">continue?</Text>
                  </>
                ) : currentDay?.dayTitle ? currentDay.dayTitle.split(' ').map((word, i, arr) =>
                  i === arr.length - 1 ? <Text key={i} className="font-erode-medium-italic">{word}</Text> : `${word} `
                ) : <><Text>Your next</Text> <Text className="font-erode-medium-italic">recovery step.</Text></>
              }
              dayPreview={
                isProgramPaused
                  ? `You left off on Day ${unlockedDayNumber}. Resume when you are ready.`
                  : dayPreview
              }
              estimatedMinutes={currentDay?.estimatedMinutes ?? 5}
              activeProgram={activeProgram}
              resolvedDayNumber={resolvedDayNumber}
              isLocked={isCurrentSessionLocked}
              availabilityLabel={isCurrentSessionLocked ? nextUnlockLabel : null}
              ctaLabel={isProgramPaused ? 'Resume' : 'Continue'}
              onPress={isProgramPaused ? handleResumeProgram : undefined}
            />
          </StaggeredItem>

          <StaggeredItem index={1}>
            <StatsRow
              items={statsItems}
            />
          </StaggeredItem>

          <StaggeredItem index={2}>
            <JournalCheckIn
              prompt={
                journalCard?.type === 'journal'
                  ? journalCard.prompt
                  : 'Take a minute to note what stood out today.'
              }
            />
          </StaggeredItem>
          
          <StaggeredItem index={3}>
            <FreeDetoxJourneyCard progress={freeDetoxProgress.progress} variant="bonus" />
          </StaggeredItem>

          <StaggeredItem index={4}>
            <MyPrograms
              activeCount={ownedProgramSlugSet.size}
            />
          </StaggeredItem>

          <StaggeredItem index={5}>
            <ExplorePrograms
              programs={explorePrograms}
              isLoading={isOwnedProgramsLoading}
            />
          </StaggeredItem>

        </View>
      </ScrollView>

      <StepPermissionPrompt
        enableStepTracking={dailySteps.enableStepTracking}
        isEnabling={dailySteps.isEnabling}
        isLoading={dailySteps.isLoading}
        summary={dailySteps.summary}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { access, isLoading, profile } = useProfile();

  if (isLoading) {
    return null;
  }

  if (!hasAnyProgramEntitlement(access)) {
    return profile?.free_tier_activated_at ? <FreeTierHomeScreen /> : <Redirect href={PAYWALL_ROUTE} />;
  }

  return <HomeScreenContent activeProgram={access.ownedProgram as ProgramSlug} />;
}
