import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, router } from 'expo-router';

import { CardRenderer } from '@/components/cards/CardRenderer';
import { Button } from '@/components/ui/Button';
import { useDay, useProgram } from '@/content';
import type { ProgramSlug } from '@/types/content';

type PreviewSelection = {
  label: string;
  dayNumber: number;
  programSlug: ProgramSlug;
};

const PREVIEW_OPTIONS: PreviewSelection[] = [
  {
    label: '6-Day Day 1',
    programSlug: 'six_day_reset',
    dayNumber: 1,
  },
  {
    label: '90-Day Day 1',
    programSlug: 'ninety_day_transform',
    dayNumber: 1,
  },
];

export default function TestCardsScreen() {
  const [selected, setSelected] = useState<PreviewSelection>(PREVIEW_OPTIONS[0]);
  const { day: previewDay } = useDay(selected.programSlug, selected.dayNumber);
  const { program: previewProgram } = useProgram(selected.programSlug);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="p-6 pb-28">
        <View className="mb-8">
          <Text className="mb-2 font-erode-bold text-4xl text-forest">V2 Card Preview</Text>
          <Text className="font-satoshi text-base leading-7 text-gray-600">
            This route previews the new multi-program content layer in isolation. It is a validation
            screen, not the final pager experience.
          </Text>
        </View>

        <View className="mb-8 gap-3">
          {PREVIEW_OPTIONS.map((option) => {
            const isSelected =
              option.programSlug === selected.programSlug && option.dayNumber === selected.dayNumber;

            return (
              <Button
                key={`${option.programSlug}-${option.dayNumber}`}
                label={option.label}
                variant={isSelected ? 'primary' : 'outline'}
                onPress={() => setSelected(option)}
              />
            );
          })}
          <Button
            label="Open in V2 Pager"
            variant="secondary"
            onPress={() =>
              router.push(
                `/day-detail?programSlug=${selected.programSlug}&dayNumber=${selected.dayNumber}` as Href
              )
            }
          />
        </View>

        {previewProgram ? (
          <View className="mb-6 rounded-3xl border border-gray-200 bg-white p-5">
            <Text className="mb-2 font-satoshi-bold text-xs uppercase tracking-wide text-forest/60">
              Program snapshot
            </Text>
            <Text className="mb-2 font-erode-semibold text-3xl text-forest">{previewProgram.name}</Text>
            <Text className="font-satoshi text-base leading-7 text-gray-700">{previewProgram.description}</Text>
            <Text className="mt-4 font-satoshi text-sm text-forest/70">
              Status: {previewProgram.contentStatus} · Days available: {previewProgram.days.length}
            </Text>
          </View>
        ) : null}

        {previewDay ? (
          <View className="gap-4">
            {previewDay.cards.map((card, index) => (
              <CardRenderer key={`${previewDay.programSlug}-${previewDay.dayNumber}-${card.type}-${index}`} card={card} />
            ))}
          </View>
        ) : (
          <View className="rounded-3xl border border-dashed border-gray-300 bg-white p-5">
            <Text className="font-erode-semibold text-2xl text-forest">Preview not found</Text>
            <Text className="mt-2 font-satoshi text-base leading-7 text-gray-700">
              No V2 day content exists for this preview yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
