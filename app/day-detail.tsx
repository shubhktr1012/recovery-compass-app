import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import PagerView from 'react-native-pager-view';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CardRenderer } from '@/components/cards/CardRenderer';
import { Button } from '@/components/ui/Button';
import { useDay, useProgram } from '@/content';
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
    <SafeAreaView className="flex-1 bg-sage">
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
    <SafeAreaView className="flex-1 bg-sage">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-satoshi text-base text-gray-600">Loading day progress...</Text>
      </View>
    </SafeAreaView>
  );
}

function ResumeToast() {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(150)}
      className="absolute bottom-12 left-0 right-0 items-center z-50"
      pointerEvents="none"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}
    >
      <BlurView 
        intensity={80} 
        tint="light" 
        className="rounded-[20px] border border-forest/10 px-5 py-2.5 overflow-hidden bg-white/50"
      >
        <Text className="text-center font-satoshi text-[13px] text-forest/90 font-medium tracking-wide">
          Continuing where you left off
        </Text>
      </BlurView>
    </Animated.View>
  );
}

function SwipeDeckCard({
  card,
  index,
  totalCards,
  progress,
  programName,
  cardHeight,
}: {
  card: DayContent['cards'][number];
  index: number;
  totalCards: number;
  progress: SharedValue<number>;
  programName?: string;
  cardHeight: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(progress.value - index);
    const scale = interpolate(distance, [0, 1], [1, 0.95], Extrapolation.CLAMP);
    const opacity = interpolate(distance, [0, 1], [1, 0.75], Extrapolation.CLAMP);
    const translateY = interpolate(distance, [0, 1], [0, 8], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  }, [index]);

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 px-6 pb-6">
      <View className="flex-1 items-center pt-2">
        <Animated.View
          entering={FadeInDown.springify().damping(18).stiffness(140)}
          style={[{ maxHeight: cardHeight, width: '100%' }, animatedStyle]}
        >
          <CardRenderer card={card} programName={programName} cardIndex={index} totalCards={totalCards} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

export default function DayDetailScreen() {
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const params = useLocalSearchParams<{ dayNumber?: string | string[]; programSlug?: string | string[] }>();
  const { height: viewportHeight } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRestored, setIsRestored] = useState(false);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const swipeProgress = useSharedValue(0);
  const cardHeight = Math.round(viewportHeight * 0.55);

  const rawProgramSlug = normalizeRouteParam(params.programSlug);
  const rawDayNumber = normalizeRouteParam(params.dayNumber);
  const dayNumber = rawDayNumber ? Number(rawDayNumber) : Number.NaN;
  const programSlug = isProgramSlug(rawProgramSlug) ? rawProgramSlug : null;
  const normalizedDayNumber = Number.isInteger(dayNumber) && dayNumber >= 1 ? dayNumber : null;
  const { day: dayContent, isLoading: isDayLoading } = useDay(programSlug, normalizedDayNumber);
  const { program, isLoading: isProgramLoading } = useProgram(programSlug);

  const storageKey = useMemo(() => {
    if (!programSlug || !normalizedDayNumber) {
      return null;
    }

    return getProgressStorageKey(programSlug, normalizedDayNumber);
  }, [normalizedDayNumber, programSlug]);

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

    if (!storageKey) return;

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify({ cardIndex: nextIndex }));
    } catch (error) {
      console.error('Failed to save day card progress', error);
    }
  };

  if (!programSlug || !Number.isInteger(dayNumber) || dayNumber < 1) {
    return <ErrorState message="The requested day detail route is missing a valid program slug or day number." />;
  }

  if ((isDayLoading && !dayContent) || (isProgramLoading && !program)) {
    return <LoadingState />;
  }

  if (!dayContent || !program) {
    return <ErrorState message="This day is not available in the V2 content repository yet." />;
  }

  if (!isRestored) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView className="flex-1 bg-sage">
      <StatusBar style="dark" />

      <View className="px-6 pb-1 pt-3">
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Back to program"
            className="h-11 w-11 items-center justify-center rounded-full bg-forest"
            onPress={() => router.replace('/(tabs)/program' as Href)}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
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
      </View>

      {showResumeToast ? <ResumeToast /> : null}

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        overdrag
        offscreenPageLimit={2}
        initialPage={currentIndex}
        onPageScroll={(event) => {
          const { position, offset } = event.nativeEvent;
          swipeProgress.value = position + offset;
        }}
        onPageSelected={(event) => {
          void handlePageSelected(event.nativeEvent.position);
        }}
      >
        {dayContent.cards.map((card, index) => (
          <View
            key={`${dayContent.programSlug}-${dayContent.dayNumber}-${card.type}-${index}`}
            style={{ flex: 1 }}
            collapsable={false}
          >
            <SwipeDeckCard
              card={card}
              index={index}
              totalCards={dayContent.cards.length}
              progress={swipeProgress}
              programName={program.name}
              cardHeight={cardHeight}
            />
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}
