import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useProfile } from '@/providers/profile';
import { PROGRAM_DAYS } from '@/constants/program-data';
import { TimelineItem } from '@/components/program/TimelineItem';
import { ProgramCard } from '@/components/program/ProgramCard';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function ProgramScreen() {
  const { profile } = useProfile();
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const { unlockedDay, currentDay, unlockedCount } = useMemo(() => {
    const totalDays = PROGRAM_DAYS.length;
    if (!profile?.quit_date) {
      return { unlockedDay: 1, currentDay: 1, unlockedCount: 1 };
    }

    const elapsed = Math.floor((nowMs - new Date(profile.quit_date).getTime()) / DAY_MS);
    const dayValue = Math.min(totalDays, Math.max(1, elapsed + 1));

    return {
      unlockedDay: dayValue,
      currentDay: dayValue,
      unlockedCount: dayValue,
    };
  }, [nowMs, profile?.quit_date]);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="p-6 pb-32">
        <View className="mb-8">
          <Text className="font-erode-bold text-4xl text-forest mb-2">Your Program</Text>
          <Text className="font-satoshi text-base text-gray-500">
            {unlockedCount}/{PROGRAM_DAYS.length} days unlocked
          </Text>
          {!profile?.quit_date && (
            <Text className="font-satoshi text-sm text-gray-400 mt-2">
              Add your quit date in personalization to unlock by timeline.
            </Text>
          )}
        </View>

        <View>
          {PROGRAM_DAYS.map((day, index) => {
            const isLocked = day.id > unlockedDay;
            const isCompleted = day.id < currentDay;
            const isCurrent = day.id === currentDay && !isLocked;

            return (
              <TimelineItem
                key={day.id}
                isFirst={index === 0}
                isLast={index === PROGRAM_DAYS.length - 1}
                isLocked={isLocked}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
              >
                <ProgramCard day={day} isLocked={isLocked} isCompleted={isCompleted} isCurrent={isCurrent} />
              </TimelineItem>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
