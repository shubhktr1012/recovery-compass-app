import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import PagerView from 'react-native-pager-view';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CardRenderer } from '@/components/cards/CardRenderer';
import { Button } from '@/components/ui/Button';
import { ContentRepository } from '@/content';
import type { DayContent, ProgramSlug } from '@/types/content';

const PROGRAM_SLUGS: ProgramSlug[] = [
  'six_day_reset',
  'ninety_day_transform',
  'sleep_disorder_reset',
  'energy_vitality',
  'age_reversal',
  'male_sexual_health',
];

function isProgramSlug(value: string | null | undefined): value is ProgramSlug {
  if (!value) return false;
  return PROGRAM_SLUGS.includes(value as ProgramSlug);
}

function getProgressStorageKey(programSlug: ProgramSlug, dayNumber: number) {
  return `progress:${programSlug}:${dayNumber}`;
}

function normalizeRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function ErrorState({ message }: { message: string }) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-3 font-erode-bold text-3xl text-forest">Day not found</Text>
        <Text className="mb-6 text-center font-satoshi text-base leading-7 text-gray-600">{message}</Text>
        <Button
          label="Back to Program"
          onPress={() => router.replace('/(tabs)/program' as Href)}
        />
      </View>
    </SafeAreaView>
  );
}

function LoadingState() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-satoshi text-base text-gray-600">Loading day progress...</Text>
      </View>
    </SafeAreaView>
  );
}

function ProgressBar({
  currentIndex,
  totalCards,
}: {
  currentIndex: number;
  totalCards: number;
}) {
  return (
    <View className="flex-row gap-1.5">
      {Array.from({ length: totalCards }).map((_, index) => (
        <View key={`progress-${index}`} className="flex-1 rounded-full bg-gray-200">
          <View
            className={`h-[3px] rounded-full ${index <= currentIndex ? 'bg-forest' : 'bg-transparent'}`}
          />
        </View>
      ))}
    </View>
  );
}

function ResumeToast() {
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      className="absolute left-6 right-6 top-24 z-20 rounded-2xl border border-forest/10 bg-white px-4 py-3"
    >
      <Text className="text-center font-satoshi text-sm text-forest">Continuing where you left off</Text>
    </Animated.View>
  );
}

export default function DayDetailScreen() {
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const params = useLocalSearchParams<{ dayNumber?: string | string[]; programSlug?: string | string[] }>();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRestored, setIsRestored] = useState(false);
  const [showResumeToast, setShowResumeToast] = useState(false);

  const rawProgramSlug = normalizeRouteParam(params.programSlug);
  const rawDayNumber = normalizeRouteParam(params.dayNumber);
  const dayNumber = rawDayNumber ? Number(rawDayNumber) : Number.NaN;
  const programSlug = isProgramSlug(rawProgramSlug) ? rawProgramSlug : null;

  const dayContent = useMemo<DayContent | null>(() => {
    if (!programSlug || !Number.isInteger(dayNumber) || dayNumber < 1) {
      return null;
    }

    return ContentRepository.getDay(programSlug, dayNumber);
  }, [dayNumber, programSlug]);

  const program = useMemo(() => {
    if (!programSlug) return null;
    return ContentRepository.getProgram(programSlug);
  }, [programSlug]);

  const storageKey = useMemo(() => {
    if (!programSlug || !Number.isInteger(dayNumber) || dayNumber < 1) {
      return null;
    }

    return getProgressStorageKey(programSlug, dayNumber);
  }, [dayNumber, programSlug]);

  useEffect(() => {
    if (!dayContent || !storageKey) {
      setCurrentIndex(0);
      setIsRestored(true);
      return;
    }

    let isCancelled = false;

    const restoreCardIndex = async () => {
      try {
        const rawValue = await AsyncStorage.getItem(storageKey);
        if (isCancelled) return;

        if (!rawValue) {
          setCurrentIndex(0);
          setIsRestored(true);
          return;
        }

        const parsed = JSON.parse(rawValue) as { cardIndex?: number };
        const savedIndex = typeof parsed.cardIndex === 'number' ? parsed.cardIndex : 0;
        const boundedIndex = Math.max(0, Math.min(savedIndex, dayContent.cards.length - 1));

        setCurrentIndex(boundedIndex);
        setIsRestored(true);

        if (boundedIndex > 0) {
          setShowResumeToast(true);
        }
      } catch (error) {
        console.error('Failed to restore day card progress', error);
        if (isCancelled) return;
        setCurrentIndex(0);
        setIsRestored(true);
      }
    };

    void restoreCardIndex();

    return () => {
      isCancelled = true;
    };
  }, [dayContent, storageKey]);

  useEffect(() => {
    if (!showResumeToast) return;

    const timer = setTimeout(() => {
      setShowResumeToast(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [showResumeToast]);

  const handlePageSelected = async (nextIndex: number) => {
    setCurrentIndex(nextIndex);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!storageKey) return;

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify({ cardIndex: nextIndex }));
    } catch (error) {
      console.error('Failed to save day card progress', error);
    }
  };

  const goToNextPage = () => {
    if (!dayContent) return;
    if (currentIndex >= dayContent.cards.length - 1) return;
    pagerRef.current?.setPage(currentIndex + 1);
  };

  const goToPreviousPage = () => {
    if (currentIndex <= 0) return;
    pagerRef.current?.setPage(currentIndex - 1);
  };

  if (!programSlug || !Number.isInteger(dayNumber) || dayNumber < 1) {
    return <ErrorState message="The requested day detail route is missing a valid program slug or day number." />;
  }

  if (!dayContent || !program) {
    return <ErrorState message="This day is not available in the V2 content repository yet." />;
  }

  if (!isRestored) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />

      <View className="px-6 pb-4 pt-3">
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Back to program"
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
            onPress={() => router.replace('/(tabs)/program' as Href)}
          >
            <Ionicons name="chevron-back" size={22} color="#05290C" />
          </Pressable>

          <View className="flex-1 px-4">
            <Text className="text-center font-satoshi-bold text-xs uppercase tracking-wide text-forest/60">
              {program.name}
            </Text>
            <Text className="mt-1 text-center font-satoshi text-sm text-gray-600">
              Day {dayContent.dayNumber}
            </Text>
          </View>

          <View className="h-11 w-11" />
        </View>

        <ProgressBar currentIndex={currentIndex} totalCards={dayContent.cards.length} />
      </View>

      {showResumeToast ? <ResumeToast /> : null}

      <PagerView
        ref={pagerRef}
        className="flex-1"
        initialPage={currentIndex}
        onPageSelected={(event) => {
          void handlePageSelected(event.nativeEvent.position);
        }}
      >
        {dayContent.cards.map((card, index) => (
          <Pressable
            key={`${dayContent.programSlug}-${dayContent.dayNumber}-${card.type}-${index}`}
            className="flex-1"
            onPress={({ nativeEvent }) => {
              if (nativeEvent.locationX >= width / 2) {
                goToNextPage();
                return;
              }

              goToPreviousPage();
            }}
          >
            <SafeAreaView edges={['bottom']} className="flex-1 bg-surface p-6">
              <Animated.View entering={FadeIn.duration(220)} className="flex-1">
                <CardRenderer card={card} />
              </Animated.View>
            </SafeAreaView>
          </Pressable>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}
