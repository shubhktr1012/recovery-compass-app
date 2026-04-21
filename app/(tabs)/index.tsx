import { View, ScrollView, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useDay } from '@/content';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
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
import { getOnboardingProjection, formatInr } from '@/lib/onboarding-metrics';



function HomeScreenContent({ activeProgram }: { activeProgram: ProgramSlug }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { access } = useProfile();
  const program = PROGRAM_METADATA[activeProgram];
  const { data: onboardingResponse } = useOnboardingResponse();
  const queryClient = useQueryClient();

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

  const projection = getOnboardingProjection(onboardingResponse ?? null);
  const firstName = projection.firstName || 'Friend';
  const avatarLetter = firstName[0]?.toUpperCase() ?? 'S';
  const percentageComplete = Math.min(100, Math.round((currentDayNumber / program.totalDays) * 100));

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="light" />
      <ScrollView contentContainerClassName="flex-grow pb-32" bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <DashboardHeader
          firstName={firstName}
          avatarLetter={avatarLetter}
          currentDayNumber={currentDayNumber}
          percentageComplete={percentageComplete}
          totalDays={program.totalDays}
          projectedSavings90Days={projection.projectedSavings90Days}
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
            currentDayNumber={currentDayNumber}
            monthlySpend={projection.monthlySpend}
          />

          <JournalCheckIn />
          
          <WhyThisMatters />

          <MyPrograms
            programName={program.name}
            programDescription={program.description}
            currentDayNumber={currentDayNumber}
            totalDays={program.totalDays}
            percentageComplete={percentageComplete}
          />

          <ExplorePrograms />

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
