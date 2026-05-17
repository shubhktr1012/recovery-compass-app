import { View, ScrollView, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
import { useProfile } from '@/providers/profile';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { JournalCheckIn } from '@/components/dashboard/JournalCheckIn';
import { MyPrograms } from '@/components/dashboard/MyPrograms';
import { ExplorePrograms } from '@/components/dashboard/ExplorePrograms';
import type { ProgramSlug } from '@/types/content';
import { programDayQueryKey, programQueryKey } from '@/hooks/contentQueryUtils';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { useOwnedPrograms } from '@/hooks/useOwnedPrograms';
import { useDailySteps } from '@/hooks/useDailySteps';
import { useFinalizedDayStates } from '@/hooks/useFinalizedDayStates';
import { resolveDashboardStatItems } from '@/lib/dashboard-statistics';
import { buildDayStateProgressSummary, buildRollingCompletionSummary } from '@/lib/day-state-summary';
import { resolveProfileIdentity } from '@/lib/profile-identity';
import type { QuestionnaireAnswersSnapshot } from '@/lib/program-statistics';
import { StepPermissionPrompt } from '@/components/steps/StepPermissionPrompt';

function getGreetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function HomeScreenContent({ activeProgram }: { activeProgram: ProgramSlug }) {
  const { access, profile, progress } = useProfile();
  const onboardingQuery = useOnboardingResponse();
  const onboardingResponse = onboardingQuery.data ?? null;
  const { program } = useProgram(activeProgram);
  const { programs } = usePrograms();
  const { ownedPrograms, isLoading: isOwnedProgramsLoading } = useOwnedPrograms();
  const dailySteps = useDailySteps();
  const queryClient = useQueryClient();
  const now = useMinuteClock();
  const userId = profile?.id ?? access.ownerUserId ?? null;
  const finalizedDayStatesQuery = useFinalizedDayStates(userId, activeProgram);
  const finalizedDayStates = finalizedDayStatesQuery.data ?? [];
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
    : progress?.completedDays ?? [];
  const partialDaysForStats = hasFinalizedDayStateTruth
    ? dayStateSummary.partialDays
    : progress?.partialDays ?? [];

  const programTotalDays = program?.totalDays ?? 1;
  const unlockedDayNumber = access.completionState === 'completed'
    ? programTotalDays
    : access.startedAt
      ? getProgramScheduledDay(access.startedAt, programTotalDays, now)
      : access.currentDay ?? 1;
  const activeDayNumber = access.completionState === 'completed'
    ? null
    : access.startedAt
      ? getProgramActiveDay(access.startedAt, programTotalDays, now)
      : unlockedDayNumber;
  const lastFinalizedDayNumber = access.startedAt
    ? getProgramLastFinalizedDay(access.startedAt, programTotalDays, now)
    : Math.max(0, ...(progress?.completedDays ?? []), ...(progress?.partialDays ?? []));
  const previewDayNumber = activeDayNumber ?? Math.min(lastFinalizedDayNumber + 1, programTotalDays);
  const nextUnlockLabel = access.completionState === 'completed'
    ? null
    : formatUnlockLabel(getProgramNextUnlockAt(access.startedAt, programTotalDays, now), now);
  const isCurrentSessionLocked = activeDayNumber == null && access.completionState !== 'completed';

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
    : programs.filter((entry) => !ownedProgramSlugSet.has(entry.slug));
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
          
          <ActionCard
            dayTitle={
              currentDay?.dayTitle ? currentDay.dayTitle.split(' ').map((word, i, arr) => 
                i === arr.length - 1 ? <Text key={i} className="font-erode-medium-italic">{word}</Text> : `${word} `
              ) : <><Text>Your next</Text> <Text className="font-erode-medium-italic">recovery step.</Text></>
            }
            dayPreview={dayPreview}
            estimatedMinutes={currentDay?.estimatedMinutes ?? 5}
            activeProgram={activeProgram}
            resolvedDayNumber={resolvedDayNumber}
            isLocked={isCurrentSessionLocked}
            availabilityLabel={isCurrentSessionLocked ? nextUnlockLabel : null}
          />

          <StatsRow
            items={statsItems}
          />

          <JournalCheckIn
            prompt={
              journalCard?.type === 'journal'
                ? journalCard.prompt
                : 'Take a minute to note what stood out today.'
            }
          />
          
          <MyPrograms
            activeCount={ownedProgramSlugSet.size}
          />

          <ExplorePrograms
            programs={explorePrograms}
            isLoading={isOwnedProgramsLoading}
          />

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
  const { access, isLoading } = useProfile();

  if (isLoading || !access.ownedProgram || access.purchaseState === 'not_owned') {
    return null;
  }

  return <HomeScreenContent activeProgram={access.ownedProgram as ProgramSlug} />;
}
