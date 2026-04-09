import React, { useCallback, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useProgram } from '@/content';
import { useProfile } from '@/providers/profile';
import { TimelineItem } from '@/components/program/TimelineItem';
import { ProgramCard } from '@/components/program/ProgramCard';
import { DayContent, ProgramSlug } from '@/types/content';
import { programQueryKey } from '@/hooks/contentQueryUtils';

function getDayPreview(day: DayContent) {
  const introCard = day.cards.find((card) => card.type === 'intro');
  if (introCard?.type === 'intro') {
    return introCard.goal;
  }

  const lessonCard = day.cards.find((card) => card.type === 'lesson');
  if (lessonCard?.type === 'lesson') {
    return lessonCard.highlight ?? lessonCard.paragraphs[0] ?? 'Open today’s guidance and keep moving.';
  }

  return 'Open today’s guidance and keep moving.';
}

export default function ProgramScreen() {
  const { access, progress } = useProfile();
  const activeProgram = (access.ownedProgram ?? 'six_day_reset') as ProgramSlug;
  const queryClient = useQueryClient();
  const { program } = useProgram(activeProgram);

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: programQueryKey(activeProgram) });
    }, [activeProgram, queryClient])
  );

  const { completedDays, currentDay } = useMemo(() => {
    return {
      currentDay: access.currentDay ?? 1,
      completedDays: progress?.completedDays ?? [],
    };
  }, [access.currentDay, progress?.completedDays]);
  const isArchivedReset = activeProgram === 'six_day_reset' && access.purchaseState === 'owned_archived';

  if (!program) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="p-6 pb-32">
        <View className="mb-8">
          <Text className="font-erode-bold text-4xl text-forest mb-2">Your Program</Text>
          <Text className="font-satoshi-bold text-forest/70 text-sm uppercase mb-2">{program.name}</Text>
          <Text className="font-satoshi text-base text-gray-500">
            Day {Math.min(currentDay, program.totalDays)} of {program.totalDays}
          </Text>
          <Text className="font-satoshi text-sm text-gray-500 mt-2">{program.description}</Text>
          {isArchivedReset ? (
            <Text className="font-satoshi text-sm text-forest/70 mt-3">
              Your 6-Day Control has been archived. The next step is upgrading into the 90-Day Smoking Reset.
            </Text>
          ) : null}
        </View>

        {program.days.length === 0 ? (
          <View className="rounded-3xl border border-dashed border-gray-300 bg-white px-5 py-6">
            <Text className="font-satoshi text-center text-gray-500">
              This program is unlocked, but its daily timeline is still syncing.
            </Text>
          </View>
        ) : (
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
                      router.push(`/day-detail?programSlug=${activeProgram}&dayNumber=${day.dayNumber}` as Href)
                    }
                  >
                    <ProgramCard
                      day={{
                        id: day.dayNumber,
                        title: day.dayTitle,
                        description: getDayPreview(day),
                        durationMinutes: day.estimatedMinutes ?? 5,
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
