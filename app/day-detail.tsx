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
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CardRenderer, TransportContext, TransportConfig } from '@/components/cards/CardRenderer';
import { Button } from '@/components/ui/Button';
import { TransportBar } from '@/components/ui/TransportBar';
import { useDay, useProgram } from '@/content';
import { programDayQueryKey, programQueryKey } from '@/hooks/contentQueryUtils';
import { formatUnlockLabel, getProgramNextUnlockAt, getProgramScheduledDay } from '@/lib/programs/schedule';
import { useAuth } from '@/providers/auth';
import { useProfile } from '@/providers/profile';
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

function getRoutineStorageKey(programSlug: ProgramSlug, dayNumber: number, cardIndex: number) {
  return `day-routine:${programSlug}:${dayNumber}:${cardIndex}`;
}

function getRoutineItemKey(name: string, index: number) {
  return `${name}-${index}`;
}

/**
 * Returns the default center button config for a card based purely on its type.
 * Cards can override this by calling registerConfig via TransportContext.
 *
 * Icon/label semantics:
 *   intro            → play          "BEGIN"
 *   lesson           → book          "I'VE READ THIS"
 *   action_step      → checkmark     "MARK DONE"
 *   exercise_routine → barbell       "MARK DONE"
 *   mindfulness /
 *   breathing        → leaf          "BEGIN"
 *   audio            → musical-notes "LISTEN"
 *   calm_trigger     → leaf          "DONE"
 *   journal          → pencil        "SAVE ENTRY"
 *   close            → checkmark     "COMPLETE DAY"
 */
function getDefaultCenterConfig(cardType: string, isLastCard: boolean): { icon: string; label: string } {
  switch (cardType) {
    case 'intro':
      return { icon: 'play', label: 'BEGIN' };
    case 'lesson':
      return { icon: 'book-outline', label: "I'VE READ THIS" };
    case 'action_step':
      return { icon: 'checkmark', label: 'MARK DONE' };
    case 'exercise_routine':
      return { icon: 'checkmark', label: 'MARK DONE' };
    case 'mindfulness_exercise':
    case 'breathing_exercise':
      return { icon: 'leaf-outline', label: 'BEGIN' };
    case 'audio':
      return { icon: 'musical-notes-outline', label: 'LISTEN' };
    case 'calm_trigger':
      return { icon: 'leaf-outline', label: 'DONE' };
    case 'journal':
      return { icon: 'pencil-outline', label: 'SAVE ENTRY' };
    case 'close':
      return { icon: 'checkmark', label: 'COMPLETE DAY' };
    default:
      return isLastCard
        ? { icon: 'checkmark', label: 'FINISH' }
        : { icon: 'arrow-forward', label: 'CONTINUE' };
  }
}

async function getDayRoutineCompletionSummary(day: DayContent) {
  const routineCards = day.cards
    .map((card, index) => ({ card, index }))
    .filter(
      (entry): entry is { card: Extract<DayContent['cards'][number], { type: 'exercise_routine' }>; index: number } =>
        entry.card.type === 'exercise_routine'
    );

  if (!routineCards.length) {
    return {
      hasRequiredRoutines: false,
      allRequiredRoutinesComplete: true,
    };
  }

  const rawValues = await Promise.all(
    routineCards.map(({ index }) =>
      AsyncStorage.getItem(getRoutineStorageKey(day.programSlug, day.dayNumber, index))
    )
  );

  const allRequiredRoutinesComplete = routineCards.every(({ card }, index) => {
    const parsedValue = rawValues[index];
    const completedItems = (() => {
      try {
        const parsed = parsedValue ? JSON.parse(parsedValue) : [];
        return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []);
      } catch {
        return new Set<string>();
      }
    })();

    // Age Reversal format uses a single exercise at the card level (card.name)
    // Legacy format uses card.exercises[] — both need completion tracking
    const requiredItems = card.name && Array.isArray(card.steps)
      ? [card.name]  // Single-exercise: item id is the card name
      : (card.exercises ?? []).map((item, itemIndex) => getRoutineItemKey(item.name, itemIndex));
    return requiredItems.every((itemKey) => completedItems.has(itemKey));
  });

  return {
    hasRequiredRoutines: true,
    allRequiredRoutinesComplete,
  };
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
          onPress={() => router.navigate('/program' as Href)}
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

const SwipeDeckCard = memo(function SwipeDeckCard({
  card,
  index,
  totalCards,
  progress,
  programName,
  onContinue,
  reflectionStorageKey,
  routineStorageKey,
  programReflectionContext,
  onRoutineProgressChange,
  closeCardState,
}: {
  card: DayContent['cards'][number];
  index: number;
  totalCards: number;
  progress: SharedValue<number>;
  programName?: string;
  onContinue?: () => void;
  onPrevious?: () => void;
  reflectionStorageKey?: string;
  routineStorageKey?: string;
  programReflectionContext?: {
    userId?: string;
    programSlug: ProgramSlug;
    dayNumber: number;
    cardIndex: number;
  };
  onRoutineProgressChange?: () => void;
  closeCardState?: {
    isCompleted?: boolean;
    isPartial?: boolean;
    isFinalProgramDay?: boolean;
    completionDescription?: string | null;
    isCompleting?: boolean;
    primaryActionLabel?: string;
    onCompleteDay?: () => void;
    onBackToProgram?: () => void;
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
          style={styles.animatedCardContainer}
        >
          <Animated.View style={[styles.animatedCardContainer, animatedStyle]}>
            <CardRenderer
              card={card}
              cardIndex={index}
              programName={programName}
              totalCards={totalCards}
              onContinue={onContinue}
              reflectionStorageKey={reflectionStorageKey}
              routineStorageKey={routineStorageKey}
              onRoutineProgressChange={onRoutineProgressChange}
              closeCardState={closeCardState}
              programReflectionContext={
                card.type === 'journal' ? programReflectionContext : undefined
              }
            />
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
});

export default function DayDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pagerRef = useRef<PagerView>(null);
  const { user } = useAuth();
  const { access, progress, completeProgramDay, savePartialProgramDay } = useProfile();
  const params = useLocalSearchParams<{ dayNumber?: string | string[]; programSlug?: string | string[] }>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRestored, setIsRestored] = useState(false);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const [isCompletingDay, setIsCompletingDay] = useState(false);
  const [transportConfigs, setTransportConfigs] = useState<Record<number, TransportConfig>>({});
  const transportConfigsRef = useRef<Record<number, TransportConfig>>({});
  const [routineSummary, setRoutineSummary] = useState({
    hasRequiredRoutines: false,
    allRequiredRoutinesComplete: true,
  });

  const registerTransportConfig = useCallback((index: number, config: TransportConfig) => {
    transportConfigsRef.current[index] = config;
    setTransportConfigs(prev => {
      const existing = prev[index];
      // Only update state when the rendered output would actually change.
      // centerIcon is a new React element each time so we compare the name
      // prop (for Ionicons) or the element type to detect real changes.
      const iconChanged = (() => {
        if (!existing?.centerIcon) return true;
        const prevEl = existing.centerIcon as React.ReactElement<any> | null;
        const nextEl = config.centerIcon as React.ReactElement<any> | null;
        if (!prevEl || !nextEl) return prevEl !== nextEl;
        return prevEl.type !== nextEl.type || prevEl.props?.name !== nextEl.props?.name;
      })();
      if (
        !iconChanged &&
        existing?.centerLabel === config.centerLabel &&
        existing?.disabled === config.disabled
      ) {
        return prev;
      }
      return { ...prev, [index]: config };
    });
  }, []);

  // Memoize so the context object reference is stable — without this, every
  // re-render creates a new `{ registerConfig }` object, which causes child
  // useEffects that list `registerConfig` as a dep to fire on every render.
  const transportContextValue = useMemo(
    () => ({ registerConfig: registerTransportConfig }),
    [registerTransportConfig]
  );

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

  const completedDays = useMemo(() => progress?.completedDays ?? [], [progress?.completedDays]);
  const partialDays = useMemo(() => progress?.partialDays ?? [], [progress?.partialDays]);
  const isDayCompleted = normalizedDayNumber ? completedDays.includes(normalizedDayNumber) : false;
  const isDayPartial = normalizedDayNumber ? partialDays.includes(normalizedDayNumber) : false;
  const scheduledDay = useMemo(() => {
    if (!program) {
      return access.currentDay ?? 1;
    }

    if (access.completionState === 'completed') {
      return program.totalDays;
    }

    const derivedScheduledDay = access.startedAt
      ? getProgramScheduledDay(access.startedAt, program.totalDays)
      : access.currentDay ?? 1;
    const highestTouchedDay = Math.max(
      0,
      ...completedDays,
      ...partialDays,
      access.currentDay ?? 0
    );

    return Math.min(
      program.totalDays,
      Math.max(derivedScheduledDay, highestTouchedDay || 1)
    );
  }, [access.completionState, access.currentDay, access.startedAt, completedDays, partialDays, program]);

  const isFutureLocked = Boolean(
    normalizedDayNumber &&
    normalizedDayNumber > scheduledDay &&
    !isDayCompleted &&
    !isDayPartial
  );
  const hasCloseCard = dayContent?.cards.some((card) => card.type === 'close') ?? false;
  const isLastCard = Boolean(dayContent && currentIndex === dayContent.cards.length - 1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shouldShowCompletionBar = !hasCloseCard && (isDayCompleted || isDayPartial || isLastCard);
  const nextUnlockLabel = useMemo(() => {
    if (!program || access.completionState === 'completed') return null;
    return formatUnlockLabel(getProgramNextUnlockAt(access.startedAt, program.totalDays));
  }, [access.completionState, access.startedAt, program]);

  const refreshRoutineSummary = useCallback(async () => {
    if (!dayContent) {
      setRoutineSummary({
        hasRequiredRoutines: false,
        allRequiredRoutinesComplete: true,
      });
      return;
    }

    try {
      const nextSummary = await getDayRoutineCompletionSummary(dayContent);
      setRoutineSummary((currentSummary) => {
        if (
          currentSummary.hasRequiredRoutines === nextSummary.hasRequiredRoutines &&
          currentSummary.allRequiredRoutinesComplete === nextSummary.allRequiredRoutinesComplete
        ) {
          return currentSummary;
        }

        return nextSummary;
      });
    } catch (error) {
      console.error('Failed to evaluate routine completion summary', error);
      setRoutineSummary((currentSummary) => {
        if (
          currentSummary.hasRequiredRoutines === false &&
          currentSummary.allRequiredRoutinesComplete === true
        ) {
          return currentSummary;
        }

        return {
          hasRequiredRoutines: false,
          allRequiredRoutinesComplete: true,
        };
      });
    }
  }, [dayContent]);

  const handleRoutineProgressChange = useCallback(() => {
    void refreshRoutineSummary();
  }, [refreshRoutineSummary]);

  useEffect(() => {
    void refreshRoutineSummary();
  }, [refreshRoutineSummary]);

  const handleCompleteCurrentDay = async () => {
    if (!programSlug || !dayContent || isDayCompleted || isCompletingDay) {
      return;
    }

    try {
      setIsCompletingDay(true);
      await completeProgramDay(programSlug, dayContent.dayNumber);
    } catch (error) {
      console.error('Failed to complete day', error);
    } finally {
      setIsCompletingDay(false);
    }
  };

  const handleSaveCurrentDayAsPartial = async () => {
    if (!programSlug || !dayContent || isDayCompleted || isCompletingDay) {
      return;
    }

    try {
      setIsCompletingDay(true);
      await savePartialProgramDay(programSlug, dayContent.dayNumber);
    } catch (error) {
      console.error('Failed to save partial day', error);
    } finally {
      setIsCompletingDay(false);
    }
  };

  const handlePrimaryDayAction = async () => {
    if (isDayCompleted || isCompletingDay) {
      return;
    }

    if (isDayPartial) {
      await handleCompleteCurrentDay();
      return;
    }

    if (routineSummary.hasRequiredRoutines && !routineSummary.allRequiredRoutinesComplete) {
      await handleSaveCurrentDayAsPartial();
      return;
    }

    await handleCompleteCurrentDay();
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

  if (isFutureLocked) {
    return (
      <ErrorState
        message={nextUnlockLabel
          ? `This day has not unlocked yet. ${nextUnlockLabel}.`
          : 'This day has not unlocked yet. Please return to the Program tab for the next available step.'}
      />
    );
  }

  const isCurrentScheduledDay = dayContent.dayNumber === scheduledDay && !isDayCompleted;
  const isFinalProgramDay = dayContent.dayNumber >= program.totalDays;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const completionTitle = isDayCompleted
    ? isFinalProgramDay
      ? 'Program day complete'
      : 'Day complete'
    : isDayPartial
      ? 'Day saved as partial'
    : isCurrentScheduledDay
      ? 'Ready to close today?'
      : 'Ready to mark this day complete?';
  const completionDescription = isDayCompleted
    ? isFinalProgramDay
      ? 'You have completed this final day. You can revisit it anytime.'
      : nextUnlockLabel
        ? `${nextUnlockLabel}. You can revisit this day anytime.`
        : 'You can revisit this day anytime.'
    : isDayPartial
      ? 'This day unlocked your onward schedule, but it does not count as fully completed yet. Revisit it anytime and mark it fully complete when you are ready.'
    : isCurrentScheduledDay
      ? nextUnlockLabel
        ? `${nextUnlockLabel}. Earlier practices will stay available if you want to revisit them.`
        : routineSummary.hasRequiredRoutines && !routineSummary.allRequiredRoutinesComplete
          ? 'Required routine steps are still unfinished. You can save this day as partial and come back later.'
          : 'When you are ready, mark today complete.'
      : 'This earlier practice will stay available even after you complete it.';
  const primaryCompletionLabel = isDayPartial
    ? 'Mark fully complete'
    : routineSummary.hasRequiredRoutines && !routineSummary.allRequiredRoutinesComplete
      ? 'Save as partial'
      : isFinalProgramDay
        ? 'Complete program day'
        : 'Complete day';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {/* Ghost back button — translucent on dark shell */}
          <Pressable
            accessibilityLabel="Back to program"
            style={styles.backButton}
            onPress={() => router.navigate('/program' as Href)}
          >
            <Ionicons name="chevron-back" size={20} color="rgba(227,243,229,0.9)" />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            {/* Eyebrow: program name */}
            <Text style={styles.headerSubtitle}>
              {program.name}
            </Text>
            {/* Title: Day number, prominent serif */}
            <Text style={styles.headerTitle}>
              Day {dayContent.dayNumber}
            </Text>
          </View>

          {/* Spacer to keep title centered */}
          <View style={styles.dummyBox} />
        </View>
      </View>

      {/* ── Segmented Progress Bar ─────────────────────────────────── */}
      {/* 3 px height · 3 px gap · borderRadius 999                   */}
      {/* done: rgba(227,243,229,0.9) · active: 0.55 · todo: 0.2    */}
      <View style={styles.progressBarContainer}>
        {dayContent.cards.map((_, index) => {
          const isDone   = index < currentIndex;
          const isActive = index === currentIndex;
          return (
            <View
              key={`seg-${index}`}
              style={[
                styles.progressSegment,
                isDone   ? styles.progressSegmentDone
                : isActive ? styles.progressSegmentActive
                : styles.progressSegmentTodo,
              ]}
            />
          );
        })}
      </View>

      {showResumeToast ? <ResumeToast /> : null}

      <TransportContext.Provider value={transportContextValue}>
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
                onPrevious={() => {
                  if (index > 0) {
                    pagerRef.current?.setPage(index - 1);
                  }
                }}
                reflectionStorageKey={`day-reflection:${dayContent.programSlug}:${dayContent.dayNumber}:${index}`}
                routineStorageKey={getRoutineStorageKey(dayContent.programSlug, dayContent.dayNumber, index)}
                onRoutineProgressChange={handleRoutineProgressChange}
                closeCardState={{
                  isCompleted: isDayCompleted,
                  isPartial: isDayPartial,
                  isFinalProgramDay,
                  completionDescription,
                  isCompleting: isCompletingDay,
                  primaryActionLabel: primaryCompletionLabel,
                  onCompleteDay: () => {
                    void handlePrimaryDayAction();
                  },
                  onBackToProgram: () => router.navigate('/program' as Href),
                }}
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
      </TransportContext.Provider>

      <TransportBar
        onPrev={() => {
          if (currentIndex > 0) pagerRef.current?.setPage(currentIndex - 1);
        }}
        onNext={() => {
          if (currentIndex < dayContent.cards.length - 1) {
            pagerRef.current?.setPage(currentIndex + 1);
          } else {
            void handlePrimaryDayAction();
          }
        }}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < dayContent.cards.length}
        centerLabel={(() => {
          if (transportConfigs[currentIndex]?.centerLabel) {
            return transportConfigs[currentIndex]!.centerLabel;
          }
          const currentCard = dayContent.cards[currentIndex];
          const isLastCard = currentIndex === dayContent.cards.length - 1;
          return getDefaultCenterConfig(currentCard?.type ?? '', isLastCard).label;
        })()}
        centerIcon={(() => {
          if (transportConfigs[currentIndex]?.centerIcon !== undefined) {
            return transportConfigs[currentIndex]!.centerIcon;
          }
          const currentCard = dayContent.cards[currentIndex];
          const isLastCard = currentIndex === dayContent.cards.length - 1;
          const { icon } = getDefaultCenterConfig(currentCard?.type ?? '', isLastCard);
          return (
            <Ionicons
              name={icon as React.ComponentProps<typeof Ionicons>['name']}
              size={28}
              color="#06290C"
            />
          );
        })()}
        onCenterPress={() => {
          const customAction = transportConfigsRef.current[currentIndex]?.onCenterPress;
          if (customAction) {
            customAction();
          } else {
            if (currentIndex < dayContent.cards.length - 1) {
              pagerRef.current?.setPage(currentIndex + 1);
            } else {
              void handlePrimaryDayAction();
            }
          }
        }}
        disabled={transportConfigs[currentIndex]?.disabled}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06290C', // forest green — immersive shell
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Ghost pill back button — translucent sage on dark bg
  backButton: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(227, 243, 229, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(227, 243, 229, 0.24)',
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  // Program name eyebrow — sage/55
  headerSubtitle: {
    textAlign: 'center',
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: 'rgba(227, 243, 229, 0.55)',
  },
  // Day number — white, serif weight
  headerTitle: {
    marginTop: 3,
    textAlign: 'center',
    fontFamily: 'Erode-Medium',
    fontSize: 20,
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },
  dummyBox: {
    height: 36,
    width: 36,
  },

  // ── Segmented Progress Bar ───────────────────────────────────────
  progressBarContainer: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  // Each segment: flex-1 so they distribute evenly
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 999,
  },
  progressSegmentDone: {
    backgroundColor: 'rgba(227, 243, 229, 0.90)',
  },
  progressSegmentActive: {
    backgroundColor: 'rgba(227, 243, 229, 0.55)',
  },
  progressSegmentTodo: {
    backgroundColor: 'rgba(227, 243, 229, 0.20)',
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
    paddingBottom: 110, // clear the TransportBar (absolute, ~94px tall)
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
  // ── Resume Toast ─────────────────────────────────────────────────
  // Sits above the pager, legible on both dark shell and card
  toastWrapper: {
    position: 'absolute',
    top: 100, // below progress bar
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  toastBlur: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(227, 243, 229, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(6, 41, 12, 0.7)',
  },
  toastText: {
    textAlign: 'center',
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: 'rgba(227, 243, 229, 0.9)',
    letterSpacing: 0.25,
  },

  // ── Completion Bar (no close card) ───────────────────────────────
  completionBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 41, 12, 0.12)',
    backgroundColor: 'rgba(6, 41, 12, 0.96)',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 14,
  },
  completionCopy: {
    gap: 6,
  },
  completionEyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(227, 243, 229, 0.55)',
  },
  completionTitle: {
    fontFamily: 'Erode-Medium',
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  completionDescription: {
    fontFamily: 'Satoshi',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(227, 243, 229, 0.65)',
  },
  // ── Error / Loading states ───────────────────────────────────────
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    marginBottom: 12,
    fontFamily: 'Erode-Medium',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  errorDescription: {
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Satoshi',
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(227, 243, 229, 0.65)',
  },
  loadingText: {
    fontFamily: 'Satoshi',
    fontSize: 15,
    color: 'rgba(227, 243, 229, 0.65)',
  }
});
