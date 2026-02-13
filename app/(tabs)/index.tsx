import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Greeting } from '@/components/dashboard/Greeting';
import { ProgressHero } from '@/components/dashboard/ProgressHero';
import { DailyActionCard } from '@/components/dashboard/DailyActionCard';
import { PanicButton } from '@/components/dashboard/PanicButton';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <View className="flex-1">
        <ScrollView contentContainerClassName="p-6 pb-32">
          <Greeting />
          <ProgressHero />
          <Text className="font-erode-bold text-2xl text-forest mb-4 mt-2">Today&apos;s Focus</Text>
          <DailyActionCard />
        </ScrollView>
        <PanicButton />
      </View>
    </SafeAreaView>
  );
}
