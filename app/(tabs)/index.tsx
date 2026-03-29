import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href } from 'expo-router';
import { useDay } from '@/content';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { Greeting } from '@/components/dashboard/Greeting';
import { ProgressHero } from '@/components/dashboard/ProgressHero';
import { DailyActionCard } from '@/components/dashboard/DailyActionCard';
import { PanicButton } from '@/components/dashboard/PanicButton';
import { useProfile } from '@/providers/profile';
import type { ProgramSlug } from '@/types/content';

export default function HomeScreen() {
  const { access } = useProfile();
  const activeProgram = (access.ownedProgram ?? 'six_day_reset') as ProgramSlug;
  const currentDayNumber = access.currentDay ?? 1;
  const { day: currentDay } = useDay(activeProgram, currentDayNumber);
  const program = PROGRAM_METADATA[activeProgram];
  const resolvedDayNumber = currentDay?.dayNumber ?? currentDayNumber;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <View className="flex-1">
        <ScrollView contentContainerClassName="p-6 pb-32">
          <Greeting />
          <ProgressHero />
          <Text className="font-erode-bold text-2xl text-forest mb-4 mt-2">Today&apos;s Focus</Text>
          <DailyActionCard
            dayNumber={resolvedDayNumber}
            title={currentDay?.dayTitle ?? 'Your next recovery step'}
            description={program.description}
            duration={`${currentDay?.estimatedMinutes ?? 5} min session`}
            ctaLabel="Open Today"
            route={`/day-detail?programSlug=${activeProgram}&dayNumber=${resolvedDayNumber}` as Href}
          />
        </ScrollView>
        <PanicButton />
      </View>
    </SafeAreaView>
  );
}
