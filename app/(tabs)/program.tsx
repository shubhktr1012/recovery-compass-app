import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, router } from 'expo-router';
import { useProfile } from '@/providers/profile';
import { TimelineItem } from '@/components/program/TimelineItem';
import { ProgramCard } from '@/components/program/ProgramCard';
import { ProgramRepository } from '@/lib/programs/repository';
import { ProgramSlug } from '@/lib/programs/types';

export default function ProgramScreen() {
  const { access, progress } = useProfile();

  const { activeProgram, completedDays, currentDay, program } = useMemo(() => {
    const ownedProgram = (access.ownedProgram ?? 'six_day_reset') as ProgramSlug;
    return {
      activeProgram: ownedProgram,
      currentDay: access.currentDay ?? 1,
      completedDays: progress?.completedDays ?? [],
      program: ProgramRepository.getProgram(ownedProgram),
    };
  }, [access.currentDay, access.ownedProgram, progress?.completedDays]);
  const isArchivedReset = activeProgram === 'six_day_reset' && access.purchaseState === 'owned_archived';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="p-6 pb-32">
        <View className="mb-8">
          <Text className="font-erode-bold text-4xl text-forest mb-2">Your Program</Text>
          <Text className="font-satoshi-bold text-forest/70 text-sm uppercase mb-2">{program.title}</Text>
          <Text className="font-satoshi text-base text-gray-500">
            Day {Math.min(currentDay, program.totalDays)} of {program.totalDays}
          </Text>
          <Text className="font-satoshi text-sm text-gray-500 mt-2">{program.description}</Text>
          {isArchivedReset ? (
            <Text className="font-satoshi text-sm text-forest/70 mt-3">
              Your 6-Day Control has been archived. The next step is upgrading into the 90-Day Quit.
            </Text>
          ) : null}
        </View>

        <View>
          {program.days.map((day, index) => {
            const isCompleted = completedDays.includes(day.dayNumber);
            const isLocked = isArchivedReset || day.dayNumber > currentDay;
            const isCurrent = day.dayNumber === currentDay && !isCompleted;

            return (
              <TimelineItem
                key={`${activeProgram}-${day.dayNumber}`}
                isFirst={index === 0}
                isLast={index === program.days.length - 1}
                isLocked={isLocked}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
              >
                <TouchableOpacity
                  activeOpacity={isLocked ? 1 : 0.9}
                  disabled={isLocked}
                  onPress={() =>
                    router.push(`/program/${activeProgram}/${day.dayNumber}` as Href)
                  }
                >
                  <ProgramCard
                    day={{
                      id: day.dayNumber,
                      title: day.title,
                      description: day.summary,
                      durationMinutes: day.estimatedMinutes,
                    }}
                    isLocked={isLocked}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                  />
                </TouchableOpacity>
              </TimelineItem>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
