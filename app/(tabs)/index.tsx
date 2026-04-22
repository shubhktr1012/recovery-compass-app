import { View, ScrollView, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useDay, useProgram, usePrograms } from '@/content';
import { getProgramScheduledDay } from '@/lib/programs/schedule';
import { useProfile } from '@/providers/profile';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { JournalCheckIn } from '@/components/dashboard/JournalCheckIn';
import { WhyThisMatters } from '@/components/dashboard/WhyThisMatters';
import { MyPrograms } from '@/components/dashboard/MyPrograms';
import { ExplorePrograms } from '@/components/dashboard/ExplorePrograms';
import type { ProgramSlug } from '@/types/content';
import { programDayQueryKey, programQueryKey } from '@/hooks/contentQueryUtils';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { useOwnedPrograms } from '@/hooks/useOwnedPrograms';
import { getJourneyConfig } from '@/lib/onboarding.config';
import { resolveDashboardStatItems } from '@/lib/dashboard-statistics';
import type { QuestionnaireAnswersSnapshot } from '@/lib/program-statistics';

function getGreetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getJourneyForProgram(programSlug: ProgramSlug): 'smoking' | 'sleep_disorder_reset' | 'energy_vitality' | 'age_reversal' | 'male_sexual_health' {
  if (programSlug === 'six_day_reset' || programSlug === 'ninety_day_transform') {
    return 'smoking';
  }

  return programSlug;
}

function HomeScreenContent({ activeProgram }: { activeProgram: ProgramSlug }) {
  const { access, profile, progress } = useProfile();
  const onboardingQuery = useOnboardingResponse();
  const onboardingResponse = onboardingQuery.data ?? null;
  const { program } = useProgram(activeProgram);
  const { programs } = usePrograms();
  const { ownedPrograms, isLoading: isOwnedProgramsLoading } = useOwnedPrograms();
  const queryClient = useQueryClient();

  if (!program) {
    return null;
  }

  const currentDayNumber = access.completionState === 'completed'
    ? program.totalDays
    : access.startedAt
      ? getProgramScheduledDay(access.startedAt, program.totalDays)
      : access.currentDay ?? 1;

  const { day: currentDay } = useDay(activeProgram, currentDayNumber);
  const resolvedDayNumber = currentDay?.dayNumber ?? currentDayNumber;

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: programQueryKey(activeProgram) });
      void queryClient.invalidateQueries({
        queryKey: programDayQueryKey(activeProgram, currentDayNumber),
      });
    }, [activeProgram, currentDayNumber, queryClient])
  );

  const dayPreview = (() => {
    if (!currentDay) return program.description;
    const introCard = currentDay.cards.find((c) => c.type === 'intro');
    if (introCard?.type === 'intro') return introCard.goal;
    const lessonCard = currentDay.cards.find((c) => c.type === 'lesson');
    if (lessonCard?.type === 'lesson') return lessonCard.highlight ?? lessonCard.paragraphs[0] ?? program.description;
    return program.description;
  })();

  const journalCard = currentDay?.cards.find((card) => card.type === 'journal');
  const firstName =
    profile?.display_name?.trim().split(/\s+/)[0] ||
    onboardingResponse?.full_name?.trim().split(/\s+/)[0] ||
    'Friend';
  const avatarUrl = profile?.avatar_url ?? null;
  const avatarLetter = firstName[0]?.toUpperCase() ?? 'S';
  const percentageComplete = Math.min(100, Math.round((currentDayNumber / program.totalDays) * 100));
  const statsItems = useMemo(
    () =>
      resolveDashboardStatItems({
        programSlug: activeProgram,
        currentDayNumber,
        totalDays: program.totalDays,
        completedDays: progress?.completedDays ?? [],
        partialDays: progress?.partialDays ?? [],
        hasAudio: program.hasAudio,
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
      currentDayNumber,
      onboardingQuery.isLoading,
      onboardingResponse,
      profile?.questionnaire_answers,
      program.hasAudio,
      program.totalDays,
      progress?.completedDays,
      progress?.partialDays,
    ]
  );
  const journeyGoal =
    onboardingResponse?.primary_goal ??
    getJourneyConfig(getJourneyForProgram(activeProgram)).primaryGoal;
  const ownedProgramSlugSet = new Set([
    activeProgram,
    ...ownedPrograms.map((entry) => entry.slug),
  ]);
  const explorePrograms = isOwnedProgramsLoading
    ? []
    : programs.filter((entry) => !ownedProgramSlugSet.has(entry.slug));
  const secondaryPillLabel = program.hasAudio
    ? 'Guided audio included'
    : `${program.totalDays}-day structured plan`;

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="light" />
      <ScrollView contentContainerClassName="flex-grow pb-32" bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <DashboardHeader
          greetingLabel={getGreetingLabel()}
          firstName={firstName}
          avatarLetter={avatarLetter}
          avatarUrl={avatarUrl}
          progressLabel={`Day ${currentDayNumber} of ${program.totalDays}`}
          secondaryPillLabel={secondaryPillLabel}
        />

        {/* CONTENT AREA */}
        {/* CRITICAL: rounded-[28px] top corners ONLY, marginTop: -28px to overlap the dark header */}
        <View 
          className="bg-surface rounded-t-[28px] -mt-[28px] px-5 pt-6 pb-28 relative z-10 flex-col gap-4"
          style={{ minHeight: 600 }}
        >
          
          <ActionCard
            currentDayNumber={currentDayNumber}
            programName={program.name}
            dayTitle={
              currentDay?.dayTitle ? currentDay.dayTitle.split(' ').map((word, i, arr) => 
                i === arr.length - 1 ? <Text key={i} className="font-erode-medium-italic">{word}</Text> : `${word} `
              ) : <><Text>Your next</Text> <Text className="font-erode-medium-italic">recovery step.</Text></>
            }
            dayPreview={dayPreview}
            estimatedMinutes={currentDay?.estimatedMinutes ?? 5}
            activeProgram={activeProgram}
            resolvedDayNumber={resolvedDayNumber}
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
          
          <WhyThisMatters copy={journeyGoal} />

          <MyPrograms
            programName={program.name}
            programDescription={program.description}
            currentDayNumber={currentDayNumber}
            totalDays={program.totalDays}
            percentageComplete={percentageComplete}
          />

          <ExplorePrograms
            programs={explorePrograms}
            isLoading={isOwnedProgramsLoading}
            isPurchaseLocked={Boolean(access.ownedProgram)}
          />

        </View>
      </ScrollView>

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
