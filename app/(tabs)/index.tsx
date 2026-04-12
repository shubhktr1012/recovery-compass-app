import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useDay } from '@/content';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { Greeting } from '@/components/dashboard/Greeting';
import { StreakRibbon } from '@/components/dashboard/StreakRibbon';
import { ProgressHero } from '@/components/dashboard/ProgressHero';
import { DailyActionCard } from '@/components/dashboard/DailyActionCard';
import { JournalPrompt } from '@/components/dashboard/JournalPrompt';
import { MyPrograms } from '@/components/dashboard/MyPrograms';
import { ExplorePrograms } from '@/components/dashboard/ExplorePrograms';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { getProgramScheduledDay } from '@/lib/programs/schedule';
import { useProfile } from '@/providers/profile';
import type { ProgramSlug } from '@/types/content';
import { programDayQueryKey, programQueryKey } from '@/hooks/contentQueryUtils';

function HomeScreenContent({ activeProgram }: { activeProgram: ProgramSlug }) {
  const { access } = useProfile();
  const program = PROGRAM_METADATA[activeProgram];
  const currentDayNumber = access.completionState === 'completed'
    ? program.totalDays
    : access.startedAt
      ? getProgramScheduledDay(access.startedAt, program.totalDays)
      : access.currentDay ?? 1;
  const queryClient = useQueryClient();
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

  // Surface the day's actual goal/highlight
  const dayPreview = (() => {
    if (!currentDay) return program.description;
    const introCard = currentDay.cards.find((c) => c.type === 'intro');
    if (introCard?.type === 'intro') return introCard.goal;
    const lessonCard = currentDay.cards.find((c) => c.type === 'lesson');
    if (lessonCard?.type === 'lesson') return lessonCard.highlight ?? lessonCard.paragraphs[0] ?? program.description;
    return program.description;
  })();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <PaperGrain />
      <StatusBar style="dark" />
      <View className="flex-1">
        <ScrollView contentContainerClassName="p-6 pb-32">
          <Greeting />
          <StreakRibbon />
          <ProgressHero />
          <DailyActionCard
            dayNumber={resolvedDayNumber}
            title={currentDay?.dayTitle ?? 'Your next recovery step'}
            description={dayPreview}
            duration={`${currentDay?.estimatedMinutes ?? 5} min session`}
            ctaLabel="Open Today"
            route={`/day-detail?programSlug=${activeProgram}&dayNumber=${resolvedDayNumber}` as Href}
          />
          <JournalPrompt />
          <MyPrograms />
          <ExplorePrograms />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  const { access, isLoading } = useProfile();

  if (isLoading || !access.ownedProgram || access.purchaseState === 'not_owned') {
    return null;
  }

  return <HomeScreenContent activeProgram={access.ownedProgram as ProgramSlug} />;
}
