import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import PagerView from 'react-native-pager-view';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CardRenderer } from '@/components/cards/CardRenderer';
import { Button } from '@/components/ui/Button';
import { useDay, useProgram } from '@/content';
import { programDayQueryKey, programQueryKey } from '@/hooks/contentQueryUtils';
import { useAuth } from '@/providers/auth';
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Day not found</Text>
        <Text style={styles.errorDescription}>{message}</Text>
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading day progress...</Text>
      </View>
    </SafeAreaView>
  );
}

function ResumeToast() {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(150)}
      style={styles.toastWrapper}
      pointerEvents="none"
    >
      <BlurView intensity={80} tint="light" style={styles.toastBlur}>
        <Text style={styles.toastText}>
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
  onContinue,
  journalStorageKey,
  programReflectionContext,
}: {
  card: DayContent['cards'][number];
  index: number;
  totalCards: number;
  progress: SharedValue<number>;
  programName?: string;
  onContinue?: () => void;
  journalStorageKey?: string;
  programReflectionContext?: {
    userId?: string;
    programSlug: ProgramSlug;
    dayNumber: number;
    cardIndex: number;
  };
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(progress.value - index);
    const scale = interpolate(distance, [0, 1], [1, 0.95], Extrapolation.CLAMP);
    const opacity = interpolate(distance, [0, 1], [1, 0.75], Extrapolation.CLAMP);
    const translateY = interpolate(distance, [0, 1], [0, 12], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  }, [index]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeAreaCard}>
      <View style={styles.cardInner}>
        <Animated.View
          entering={FadeInDown.springify().damping(18).stiffness(140)}
          style={[styles.animatedCardContainer, animatedStyle]}
        >
          <CardRenderer
            card={card}
            programName={programName}
            onContinue={onContinue}
            journalStorageKey={journalStorageKey}
            programReflectionContext={
              card.type === 'journal' ? programReflectionContext : undefined
            }
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

export default function DayDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pagerRef = useRef<PagerView>(null);
  const { user } = useAuth();
  const params = useLocalSearchParams<{ dayNumber?: string | string[]; programSlug?: string | string[] }>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRestored, setIsRestored] = useState(false);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const swipeProgress = useSharedValue(0);

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

  useFocusEffect(
    useCallback(() => {
      if (!programSlug || !normalizedDayNumber) return;
      void queryClient.invalidateQueries({ queryKey: programQueryKey(programSlug) });
      void queryClient.invalidateQueries({
        queryKey: programDayQueryKey(programSlug, normalizedDayNumber),
      });
    }, [normalizedDayNumber, programSlug, queryClient])
  );

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

  const handleContinueFromCard = () => {
    if (!dayContent) return;

    const nextIndex = Math.min(currentIndex + 1, dayContent.cards.length - 1);
    if (nextIndex === currentIndex) return;

    pagerRef.current?.setPage(nextIndex);
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Back to program"
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/program' as Href)}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>
              {program.name}
            </Text>
            <Text style={styles.headerTitle}>
              Day {dayContent.dayNumber}
            </Text>
          </View>

          <View style={styles.dummyBox} />
        </View>
      </View>

      {/* Instagram Stories Style Screen-Level Progress Bar */}
      <View style={styles.progressBarContainer}>
        {dayContent.cards.map((_, index) => (
          <View key={`progress-${index}`} style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                index <= currentIndex && styles.progressFillActive
              ]}
            />
          </View>
        ))}
      </View>

      {showResumeToast ? <ResumeToast /> : null}

      <PagerView
        ref={pagerRef}
        style={styles.pager}
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
            style={styles.cardWrapper}
            collapsable={false}
          >
            <SwipeDeckCard
              card={card}
              index={index}
              totalCards={dayContent.cards.length}
              progress={swipeProgress}
              programName={program.name}
              onContinue={handleContinueFromCard}
              journalStorageKey={`day-reflection:${dayContent.programSlug}:${dayContent.dayNumber}:${index}`}
              programReflectionContext={{
                userId: user?.id,
                programSlug: dayContent.programSlug,
                dayNumber: dayContent.dayNumber,
                cardIndex: index,
              }}
            />
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F3E5', // sage
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 4,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#06290C', // forest
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerSubtitle: {
    textAlign: 'center',
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(6, 41, 12, 0.6)',
  },
  headerTitle: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Satoshi',
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  dummyBox: {
    height: 44,
    width: 44,
  },
  progressBarContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(6, 41, 12, 0.1)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressFillActive: {
    backgroundColor: '#06290C',
  },
  pager: {
    flex: 1,
  },
  cardWrapper: {
    flex: 1,
  },
  safeAreaCard: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  animatedCardContainer: {
    width: '100%',
    flex: 1,
  },
  // Toast
  toastWrapper: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  toastBlur: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  toastText: {
    textAlign: 'center',
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: 'rgba(6, 41, 12, 0.9)',
    letterSpacing: 0.25,
  },
  // Error / Loading
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    marginBottom: 12,
    fontFamily: 'Erode-Bold',
    fontSize: 30,
    color: '#06290C',
  },
  errorDescription: {
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Satoshi',
    fontSize: 16,
    lineHeight: 28,
    color: '#4B5563',
  },
  loadingText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    color: '#4B5563',
  }
});
