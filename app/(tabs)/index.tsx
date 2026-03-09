import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href } from 'expo-router';
import { Greeting } from '@/components/dashboard/Greeting';
import { ProgressHero } from '@/components/dashboard/ProgressHero';
import { DailyActionCard } from '@/components/dashboard/DailyActionCard';
import { PanicButton } from '@/components/dashboard/PanicButton';
import { useProfile } from '@/providers/profile';
import { ProgramRepository } from '@/lib/programs/repository';

export default function HomeScreen() {
  const { access } = useProfile();
  const activeProgram = access.ownedProgram ?? 'six_day_reset';
  const currentDayNumber = access.currentDay ?? 1;
  const currentDay = ProgramRepository.getDay(activeProgram, currentDayNumber);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <View className="flex-1">
        <ScrollView contentContainerClassName="p-6 pb-32">
          <Greeting />
          <ProgressHero />
          <Text className="font-erode-bold text-2xl text-forest mb-4 mt-2">Today&apos;s Focus</Text>
          <DailyActionCard
            dayNumber={currentDay?.dayNumber ?? 1}
            title={currentDay?.title ?? 'Your next recovery step'}
            description={currentDay?.summary ?? 'Open today’s guidance and keep the momentum moving.'}
            duration={`${currentDay?.estimatedMinutes ?? 5} min session`}
            ctaLabel={currentDay?.audio ? 'Listen & Continue' : 'Open Today'}
            route={`/program/${activeProgram}/${currentDay?.dayNumber ?? 1}` as Href}
          />
        </ScrollView>
        <PanicButton />
      </View>
    </SafeAreaView>
  );
}
