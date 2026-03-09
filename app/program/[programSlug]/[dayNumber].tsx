import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { ProgramAudioPlayer } from '@/components/program/ProgramAudioPlayer';
import { prefetchAudioAsset } from '@/lib/audio-cache';
import { ProgramRepository } from '@/lib/programs/repository';
import { ProgramSlug } from '@/lib/programs/types';
import { useProfile } from '@/providers/profile';

export default function ProgramDayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ programSlug: string; dayNumber: string }>();
  const { access, completeProgramDay, progress } = useProfile();

  const programSlug = (params.programSlug as ProgramSlug) ?? access.ownedProgram ?? 'six_day_reset';
  const dayNumber = Number(params.dayNumber ?? 1);
  const day = ProgramRepository.getDay(programSlug, dayNumber);
  const isCompleted = progress?.completedDays.includes(dayNumber) ?? false;
  const isLocked = access.currentDay ? dayNumber > access.currentDay : dayNumber > 1;
  const isArchivedReset = programSlug === 'six_day_reset' && access.purchaseState === 'owned_archived';
  const nextDay = day ? ProgramRepository.getNextDay(programSlug, day.dayNumber) : null;

  const nextRoute = useMemo(() => {
    if (!nextDay) return null;
    return `/program/${programSlug}/${nextDay.dayNumber}` as Href;
  }, [nextDay, programSlug]);

  if (!day) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-erode-bold text-3xl text-forest text-center mb-3">Day not found</Text>
          <Text className="font-satoshi text-gray-500 text-center mb-6">
            This program day is not available in the local catalog yet.
          </Text>
          <Button label="Back to Program" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleCompleteDay = async () => {
    await completeProgramDay(programSlug, day.dayNumber);

    if (nextDay?.audio?.storagePath) {
      void prefetchAudioAsset(nextDay.audio.storagePath);
    }
  };

  if (isLocked) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-erode-bold text-3xl text-forest text-center mb-3">Locked for now</Text>
          <Text className="font-satoshi text-gray-500 text-center mb-6">
            Complete your current day before opening this one.
          </Text>
          <Button label="Back to Program" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (isArchivedReset) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-erode-bold text-3xl text-forest text-center mb-3">Reset archived</Text>
          <Text className="font-satoshi text-gray-500 text-center mb-6">
            The 6-Day Control is no longer replayable after completion. Continue your journey with the 90-Day Quit.
          </Text>
          <Button label="See Upgrade Options" onPress={() => router.navigate('/paywall' as Href)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="px-6 py-6 pb-28">
        <View className="mb-8">
          <Text className="font-satoshi-bold text-forest/70 text-xs uppercase mb-2">
            {programSlug === 'six_day_reset' ? '6-Day Control' : '90-Day Quit'}
          </Text>
          <Text className="font-erode-bold text-4xl text-forest mb-3">
            Day {day.dayNumber} · {day.title}
          </Text>
          <Text className="font-satoshi text-base leading-7 text-gray-600">
            {day.summary}
          </Text>
        </View>

        {day.audio ? (
          <View className="mb-6">
            <ProgramAudioPlayer audio={day.audio} />
          </View>
        ) : null}

        <View className="space-y-4">
          {day.sections.map((section) => (
            <View
              key={`${day.programSlug}-${day.dayNumber}-${section.title}`}
              className="rounded-3xl bg-white border border-gray-200 p-5"
            >
              <Text className="font-erode-semibold text-2xl text-forest mb-3">{section.title}</Text>
              <Text className="font-satoshi text-gray-700 leading-7">{section.body}</Text>
            </View>
          ))}
        </View>

        {day.prompt ? (
          <View className="rounded-3xl bg-sage border border-gray-200 p-5 mt-6">
            <Text className="font-satoshi-bold text-forest/70 text-xs uppercase mb-2">Optional Reflection</Text>
            <Text className="font-erode-semibold text-2xl text-forest mb-2">Journal prompt</Text>
            <Text className="font-satoshi text-gray-700 leading-7">{day.prompt}</Text>
            <Button
              label="Open Journal"
              variant="outline"
              className="mt-4"
              onPress={() => router.push('/(tabs)/journal' as Href)}
            />
          </View>
        ) : null}

        {day.close ? (
          <View className="rounded-3xl bg-forest p-5 mt-6">
            <Text className="font-satoshi-bold text-white/70 text-xs uppercase mb-2">Gentle Close</Text>
            <Text className="font-satoshi text-white leading-7">{day.close}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-6 pb-8 bg-surface">
        <Button
          label={isCompleted ? 'Completed' : 'Mark Day Complete'}
          onPress={() => void handleCompleteDay()}
          disabled={isCompleted}
          size="lg"
        />
        {isCompleted && nextRoute ? (
          <Button
            label="Open Next Day"
            variant="ghost"
            className="mt-2"
            onPress={() => router.replace(nextRoute)}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
