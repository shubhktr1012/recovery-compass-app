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
import { finalizedDayStatesQueryKey, useFinalizedDayStates } from '@/hooks/useFinalizedDayStates';
import { useOwnedPrograms } from '@/hooks/useOwnedPrograms';
import { useMinuteClock } from '@/hooks/useMinuteClock';
import { logEvent } from '@/lib/analytics';
import { getCardState, toLocalHHMM } from '@/lib/card-state';
import { buildUserDayStateRecord, upsertUserDayState, type UserDayStateUpsert } from '@/lib/day-states';
import { buildDayStateProgressSummary, formatFinalizedDaySummary } from '@/lib/day-state-summary';
import {
  formatUnlockLabel,
  getProgramActiveDay,
  getProgramLastFinalizedDay,
  getProgramNextUnlockAt,
  getProgramScheduledDay,
} from '@/lib/programs/schedule';
import {
  formatScheduledProgramStartLabel,
  getProgramScheduleStartSource,
  isProgramStartPending,
} from '@/lib/programs/lifecycle';
import { parseRoutineProgress } from '@/lib/routine-progress';
import { buildWidgetPayload, syncWidgetData } from '@/lib/widget-bridge';
import { useAuth } from '@/providers/auth';
import { useProfile } from '@/providers/profile';
import type { DayContent, ProgramSlug } from '@/types/content';
import { TIME_SLOT_WINDOWS, type CardState, type DayState, type TimeSlot } from '@/types/resolver';
import type { AnalyticsEventData } from '@/lib/analytics';

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

type RuntimeDayCard = DayContent['cards'][number] & {
  timeSlot?: TimeSlot;
  isTimeSensitive?: boolean;
  hasEffortCheck?: boolean;
};

const DEFAULT_CARD_TIME_META = {
  timeSlot: 'anytime' as const,
  isTimeSensitive: false,
  hasEffortCheck: false,
};

function getCardTimeMeta(card: DayContent['cards'][number]) {
  const runtimeCard = card as RuntimeDayCard;

  return {
    timeSlot: runtimeCard.timeSlot ?? DEFAULT_CARD_TIME_META.timeSlot,
    isTimeSensitive: runtimeCard.isTimeSensitive ?? DEFAULT_CARD_TIME_META.isTimeSensitive,
    hasEffortCheck: runtimeCard.hasEffortCheck ?? DEFAULT_CARD_TIME_META.hasEffortCheck,
  };
}

function getCardAnalyticsId(day: DayContent, cardIndex: number) {
  const card = day.cards[cardIndex];
  return `${day.programSlug}:${day.dayNumber}:${cardIndex}:${card?.type ?? 'unknown'}`;
}

function getCardAnalyticsTitle(card: DayContent['cards'][number]) {
  switch (card.type) {
    case 'intro':
      return card.dayTitle;
    case 'lesson':
      return card.title ?? null;
    case 'action_step':
    case 'breathing_exercise':
    case 'mindfulness_exercise':
    case 'audio':
      return card.title ?? null;
    case 'exercise_routine':
      return card.title ?? card.name ?? null;
    case 'journal':
      return card.prompt;
    case 'calm_trigger':
      return card.context;
    case 'close':
      return card.message;
  }
}

function buildCardAnalyticsData(args: {
  day: DayContent;
  cardIndex: number;
  cardState?: CardState | null;
  extra?: AnalyticsEventData;
}): AnalyticsEventData {
  const card = args.day.cards[args.cardIndex];

  if (!card) {
    return {
      ...args.extra,
      cardIndex: args.cardIndex,
    };
  }

  const meta = getCardTimeMeta(card);

  return {
    ...args.extra,
    cardIndex: args.cardIndex,
    cardState: args.cardState ?? null,
    cardTitle: getCardAnalyticsTitle(card),
    cardType: card.type,
    hasEffortCheck: meta.hasEffortCheck,
    isTimeSensitive: meta.isTimeSensitive,
    timeSlot: meta.timeSlot,
  };
}

function formatSlotLabel(slot: TimeSlot) {
  switch (slot) {
    case 'morning':
      return 'Morning';
    case 'afternoon':
      return 'Afternoon';
    case 'evening':
      return 'Evening';
    case 'anytime':
      return 'Today';
  }
}

function formatWindowTime(hhmm: string) {
  const [hourValue, minuteValue] = hhmm.split(':').map((value) => Number.parseInt(value, 10));
  const safeHour = Number.isFinite(hourValue) ? hourValue : 0;
  const safeMinute = Number.isFinite(minuteValue) ? minuteValue : 0;
  const suffix = safeHour >= 12 ? 'PM' : 'AM';
  const normalizedHour = safeHour % 12 || 12;
  return `${normalizedHour}:${String(safeMinute).padStart(2, '0')} ${suffix}`;
}

function getCardStateNotice(state: CardState, slot: TimeSlot) {
  switch (state) {
    case 'locked':
      return {
        eyebrow: 'Locked',
        message:
          slot === 'anytime'
            ? `Today's session opens at ${formatWindowTime(TIME_SLOT_WINDOWS.anytime.opens)}.`
            : `${formatSlotLabel(slot)} unlocks at ${formatWindowTime(TIME_SLOT_WINDOWS[slot].opens)}.`,
        tone: 'muted' as const,
      };
    case 'catch_up':
      return {
        eyebrow: 'Catch-up available',
        message: `You missed the ${formatSlotLabel(slot).toLowerCase()} window, but this card is still available until ${formatWindowTime(TIME_SLOT_WINDOWS.anytime.closes)}.`,
        tone: 'warm' as const,
      };
    case 'blocked':
      return {
        eyebrow: 'Window closed',
        message: `This ${formatSlotLabel(slot).toLowerCase()} card was time-sensitive and closed at ${formatWindowTime(TIME_SLOT_WINDOWS[slot].closes)}.`,
        tone: 'critical' as const,
      };
    default:
      return null;
  }
}

function getHistoricalDayNotice(state: DayState) {
  switch (state) {
    case 'completed':
      return {
        eyebrow: 'Review mode',
        message: 'This day is complete and now read-only.',
        tone: 'muted' as const,
      };
    case 'partial':
      return {
        eyebrow: 'Partial day',
        message: 'This day closed as partial and is now read-only.',
        tone: 'warm' as const,
      };
    case 'skipped':
      return {
        eyebrow: 'Day closed',
        message: `This day closed at ${formatWindowTime(TIME_SLOT_WINDOWS.evening.closes)} with no completed cards and is now read-only.`,
        tone: 'critical' as const,
      };
  }
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
    const progressRecord = parseRoutineProgress(rawValues[index] ?? null);
    const completedItems = new Set(progressRecord.completedItems);

    // Age Reversal format uses a single exercise at the card level (card.name)
    // Legacy format uses card.exercises[] — both need completion tracking
    const requiredItems = card.name && Array.isArray(card.steps)
      ? [card.name]  // Single-exercise: item id is the card name
      : (card.exercises ?? []).map((item, itemIndex) => getRoutineItemKey(item.name, itemIndex));
    const effortCheckSatisfied =
      !(getCardTimeMeta(card).hasEffortCheck && Boolean(card.name && Array.isArray(card.steps)))
        || progressRecord.effortLevel !== null;

    return requiredItems.every((itemKey) => completedItems.has(itemKey)) && effortCheckSatisfied;
  });

  return {
    hasRequiredRoutines: true,
    allRequiredRoutinesComplete,
  };
}

async function getDayRoutineProgressByIndex(day: DayContent) {
  const routineEntries = day.cards
    .map((card, index) => ({ card, index }))
    .filter((entry) => entry.card.type === 'exercise_routine');

  const rawValues = await Promise.all(
    routineEntries.map(({ index }) =>
      AsyncStorage.getItem(getRoutineStorageKey(day.programSlug, day.dayNumber, index))
    )
  );

  return Object.fromEntries(
    routineEntries.map(({ index }, entryIndex) => [
      index,
      parseRoutineProgress(rawValues[entryIndex] ?? null),
    ])
  );
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

function CardStatePlaceholder({
  card,
  state,
  slot,
}: {
  card: DayContent['cards'][number];
  state: Extract<CardState, 'locked' | 'blocked'>;
  slot: TimeSlot;
}) {
  const title =
    state === 'locked'
      ? slot === 'evening'
        ? 'All caught up for now'
        : `${formatSlotLabel(slot)} session coming up`
      : `${formatSlotLabel(slot)} window closed`;

  const message =
    state === 'locked'
      ? slot === 'evening'
        ? `Evening cards unlock at ${formatWindowTime(TIME_SLOT_WINDOWS.evening.opens)}.`
        : `Unlocks at ${formatWindowTime(TIME_SLOT_WINDOWS[slot].opens)}.`
      : `This ${formatSlotLabel(slot).toLowerCase()} card closed at ${formatWindowTime(TIME_SLOT_WINDOWS[slot].closes)}.`;

  return (
    <View style={styles.placeholderCard}>
      <View style={styles.placeholderEyebrowRow}>
        <Text style={styles.placeholderEyebrow}>
          {state === 'locked' ? 'Locked' : 'Missed'}
        </Text>
        <View
          style={[
            styles.placeholderSlotPill,
            state === 'locked' ? styles.placeholderSlotPillLocked : styles.placeholderSlotPillMissed,
          ]}
        >
          <Text style={styles.placeholderSlotPillText}>{formatSlotLabel(slot)}</Text>
        </View>
      </View>

      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderBody}>{message}</Text>

      <View style={styles.placeholderMetaRow}>
        <Ionicons
          name={state === 'locked' ? 'time-outline' : 'alert-circle-outline'}
          size={16}
          color="rgba(6, 41, 12, 0.45)"
        />
        <Text style={styles.placeholderMetaText}>
          {card.type === 'close'
            ? 'Closeout will appear here.'
            : 'Continue with what is available now.'}
        </Text>
      </View>
    </View>
  );
}

const SwipeDeckCard = memo(function SwipeDeckCard({
  card,
  cardState,
  cardTimeSlot,
  index,
  totalCards,
  progress,
  programName,
  onContinue,
  reflectionStorageKey,
  routineStorageKey,
  hasEffortCheck,
  isReadOnly,
  programReflectionContext,
  onRoutineProgressChange,
  onAudioCompleted,
  closeCardState,
}: {
  card: DayContent['cards'][number];
  cardState?: CardState;
  cardTimeSlot?: TimeSlot;
  index: number;
  totalCards: number;
  progress: SharedValue<number>;
  programName?: string;
  onContinue?: () => void;
  onPrevious?: () => void;
  reflectionStorageKey?: string;
  routineStorageKey?: string;
  hasEffortCheck?: boolean;
  isReadOnly?: boolean;
  programReflectionContext?: {
    userId?: string;
    programSlug: ProgramSlug;
    dayNumber: number;
    cardIndex: number;
  };
  onRoutineProgressChange?: () => void;
  onAudioCompleted?: (payload: {
    audioStoragePath: string;
    cardIndex: number | null;
    completionMode: 'manual' | 'auto';
    listenSeconds: number;
    percentage: number;
    totalSeconds: number;
  }) => void;
  closeCardState?: {
    isCompleted?: boolean;
    isPartial?: boolean;
    isReadOnly?: boolean;
    readOnlyState?: DayState;
    isFinalProgramDay?: boolean;
    completionDescription?: string | null;
    isCompleting?: boolean;
    primaryActionLabel?: string;
    primaryActionDisabled?: boolean;
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
            {cardState === 'locked' || cardState === 'blocked' ? (
              <CardStatePlaceholder
                card={card}
                state={cardState}
                slot={cardTimeSlot ?? DEFAULT_CARD_TIME_META.timeSlot}
              />
            ) : (
              <CardRenderer
                card={card}
                cardIndex={index}
                programName={programName}
                totalCards={totalCards}
                onContinue={onContinue}
                reflectionStorageKey={reflectionStorageKey}
                routineStorageKey={routineStorageKey}
                hasEffortCheck={hasEffortCheck}
                isReadOnly={isReadOnly}
                onRoutineProgressChange={onRoutineProgressChange}
                onAudioCompleted={onAudioCompleted}
                closeCardState={closeCardState}
                programReflectionContext={
                  card.type === 'journal' ? programReflectionContext : undefined
                }
              />
            )}
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
  const params = useLocalSearchParams<{ dayNumber?: string | string[]; programSlug?: string | string[]; mode?: string | string[] }>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRestored, setIsRestored] = useState(false);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const [isCompletingDay, setIsCompletingDay] = useState(false);
  const [transportConfigs, setTransportConfigs] = useState<Record<number, TransportConfig>>({});
  const transportConfigsRef = useRef<Record<number, TransportConfig>>({});
  const loggedCardOpenKeysRef = useRef<Set<string>>(new Set());
  const loggedCardCompletedKeysRef = useRef<Set<string>>(new Set());
  const loggedAudioCompletionKeysRef = useRef<Set<string>>(new Set());
  const loggedDayFinalizationKeysRef = useRef<Set<string>>(new Set());
  const [routineSummary, setRoutineSummary] = useState({
    hasRequiredRoutines: false,
    allRequiredRoutinesComplete: true,
  });
  const currentTime = useMinuteClock();

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
  const rawMode = normalizeRouteParam(params.mode);
  const dayNumber = rawDayNumber ? Number(rawDayNumber) : Number.NaN;
  const programSlug = isProgramSlug(rawProgramSlug) ? rawProgramSlug : null;
  const normalizedDayNumber = Number.isInteger(dayNumber) && dayNumber >= 1 ? dayNumber : null;
  const { ownedPrograms, isLoading: isOwnedProgramsLoading } = useOwnedPrograms();
  const isCompletedProgramReview = Boolean(
    rawMode === 'review' &&
      programSlug &&
      ownedPrograms.some(
        (program) =>
          program.slug === programSlug &&
          (program.purchaseState === 'owned_completed' ||
            program.completionState === 'completed' ||
            program.programState === 'completed')
      )
  );
  const finalizedDayStatesQuery = useFinalizedDayStates(user?.id ?? access.ownerUserId ?? null, programSlug);
  const finalizedDayStates = useMemo(
    () => finalizedDayStatesQuery.data ?? [],
    [finalizedDayStatesQuery.data]
  );
  const finalizedProgressSummary = useMemo(
    () => buildDayStateProgressSummary(finalizedDayStates),
    [finalizedDayStates]
  );
  const finalizedDayState = useMemo(
    () => finalizedDayStates.find((row) => row.dayNumber === normalizedDayNumber) ?? null,
    [finalizedDayStates, normalizedDayNumber]
  );
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
      void queryClient.invalidateQueries({
        queryKey: finalizedDayStatesQueryKey(user?.id ?? access.ownerUserId ?? null, programSlug),
      });
    }, [access.ownerUserId, normalizedDayNumber, programSlug, queryClient, user?.id])
  );

  useEffect(() => {
    if (!dayContent || !storageKey || isCompletedProgramReview) {
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
  }, [dayContent, isCompletedProgramReview, storageKey]);

  useEffect(() => {
    if (!showResumeToast) return;

    const timer = setTimeout(() => {
      setShowResumeToast(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [showResumeToast]);

  const handlePageSelected = async (nextIndex: number) => {
    setCurrentIndex(nextIndex);

    if (!storageKey || isCompletedProgramReview) return;

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify({ cardIndex: nextIndex }));
    } catch (error) {
      console.error('Failed to save day card progress', error);
    }

    // Sync card index to the widget so the home screen reflects current progress
    const widgetPayload = buildWidgetPayload({
      access,
      progress,
      cardIndex: nextIndex,
      totalCards: dayContent?.cards.length ?? 1,
      steps: 0,
    });
    if (widgetPayload) void syncWidgetData(widgetPayload);
  };

  const handleContinueFromCard = useCallback(() => {
    if (!dayContent) return;

    const nextIndex = Math.min(currentIndex + 1, dayContent.cards.length - 1);
    if (nextIndex === currentIndex) return;

    pagerRef.current?.setPage(nextIndex);
  }, [currentIndex, dayContent]);

  const completedDays = useMemo(
    () =>
      isCompletedProgramReview && finalizedDayStates.length > 0
        ? finalizedProgressSummary.completedDays
        : progress?.completedDays ?? [],
    [finalizedDayStates.length, finalizedProgressSummary.completedDays, isCompletedProgramReview, progress?.completedDays]
  );
  const partialDays = useMemo(
    () =>
      isCompletedProgramReview && finalizedDayStates.length > 0
        ? finalizedProgressSummary.partialDays
        : progress?.partialDays ?? [],
    [finalizedDayStates.length, finalizedProgressSummary.partialDays, isCompletedProgramReview, progress?.partialDays]
  );
  const isDayCompleted = normalizedDayNumber
    ? finalizedDayState?.dayState === 'completed' || completedDays.includes(normalizedDayNumber)
    : false;
  const isDayPartial = normalizedDayNumber
    ? finalizedDayState?.dayState === 'partial' || (!isDayCompleted && partialDays.includes(normalizedDayNumber))
    : false;
  const scheduleStartSource = getProgramScheduleStartSource(access);
  const isScheduledStartPending = isProgramStartPending(access, currentTime);
  const unlockedThroughDay = useMemo(() => {
    if (!program) {
      return access.currentDay ?? 1;
    }

    if (isCompletedProgramReview) {
      return program.totalDays;
    }

    if (access.completionState === 'completed') {
      return program.totalDays;
    }

    const derivedScheduledDay = isScheduledStartPending
      ? 1
      : scheduleStartSource
      ? getProgramScheduledDay(scheduleStartSource, program.totalDays, currentTime)
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
  }, [access.completionState, access.currentDay, completedDays, currentTime, isCompletedProgramReview, isScheduledStartPending, partialDays, program, scheduleStartSource]);
  const activeDayNumber = useMemo(() => {
    if (!program || isCompletedProgramReview || access.completionState === 'completed') {
      return null;
    }

    if (isScheduledStartPending || access.programState === 'paused') {
      return null;
    }

    return scheduleStartSource
      ? getProgramActiveDay(scheduleStartSource, program.totalDays, currentTime)
      : unlockedThroughDay;
  }, [access.completionState, access.programState, currentTime, isCompletedProgramReview, isScheduledStartPending, program, scheduleStartSource, unlockedThroughDay]);
  const lastFinalizedDay = useMemo(() => {
    if (!program) {
      return Math.max(0, ...completedDays, ...partialDays);
    }

    if (isCompletedProgramReview) {
      const lastReviewDay = Math.max(0, ...finalizedDayStates.map((row) => row.dayNumber));
      return lastReviewDay > 0 ? Math.min(program.totalDays, lastReviewDay) : program.totalDays;
    }

    return scheduleStartSource && !isScheduledStartPending
      ? getProgramLastFinalizedDay(scheduleStartSource, program.totalDays, currentTime)
      : Math.max(0, ...completedDays, ...partialDays);
  }, [completedDays, currentTime, finalizedDayStates, isCompletedProgramReview, isScheduledStartPending, partialDays, program, scheduleStartSource]);
  const historicalDayState = useMemo<DayState | null>(() => {
    if (!normalizedDayNumber || normalizedDayNumber > lastFinalizedDay) {
      return null;
    }

    if (isCompletedProgramReview) {
      return finalizedDayState?.dayState ?? 'completed';
    }

    if (finalizedDayState) {
      return finalizedDayState.dayState;
    }

    if (isDayCompleted) {
      return 'completed';
    }

    if (isDayPartial) {
      return 'partial';
    }

    return 'skipped';
  }, [finalizedDayState, isCompletedProgramReview, isDayCompleted, isDayPartial, lastFinalizedDay, normalizedDayNumber]);
  const isHistoricalReadOnlyDay = Boolean(historicalDayState);

  const isFutureLocked = Boolean(
    normalizedDayNumber &&
    !isCompletedProgramReview &&
    (isScheduledStartPending || normalizedDayNumber > unlockedThroughDay) &&
    !isDayCompleted &&
    !isDayPartial
  );
  const hasCloseCard = dayContent?.cards.some((card) => card.type === 'close') ?? false;
  const isLastCard = Boolean(dayContent && currentIndex === dayContent.cards.length - 1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shouldShowCompletionBar = !hasCloseCard && (isDayCompleted || isDayPartial || isLastCard);
  const nextUnlockLabel = useMemo(() => {
    if (!program || isCompletedProgramReview || access.completionState === 'completed') return null;
    if (isScheduledStartPending) {
      return formatScheduledProgramStartLabel(access.scheduledStartDate, currentTime);
    }
    return formatUnlockLabel(getProgramNextUnlockAt(scheduleStartSource, program.totalDays, currentTime), currentTime);
  }, [access.completionState, access.scheduledStartDate, currentTime, isCompletedProgramReview, isScheduledStartPending, program, scheduleStartSource]);
  const runtimeCards = useMemo(
    () => dayContent?.cards.map((card) => ({ card, meta: getCardTimeMeta(card) })) ?? [],
    [dayContent?.cards]
  );
  const cardStates = useMemo(
    () =>
      runtimeCards.map(({ meta }) =>
        isFutureLocked
          ? 'locked'
          : getCardState(
              meta,
              toLocalHHMM(currentTime),
              isDayCompleted
                ? { state: 'completed' }
                : isHistoricalReadOnlyDay
                  ? { state: 'skipped' }
                  : undefined
            )
      ),
    [currentTime, isDayCompleted, isFutureLocked, isHistoricalReadOnlyDay, runtimeCards]
  );
  const currentCard = dayContent?.cards[currentIndex];
  const currentCardMeta = runtimeCards[currentIndex]?.meta ?? DEFAULT_CARD_TIME_META;
  const currentCardState = cardStates[currentIndex] ?? 'available';
  const analyticsUserId = user?.id ?? access.ownerUserId ?? null;
  const logCardOpened = useCallback(
    (cardIndex: number) => {
      if (!analyticsUserId || !dayContent) {
        return;
      }

      const card = dayContent.cards[cardIndex];
      if (!card) {
        return;
      }

      const cardState = cardStates[cardIndex] ?? 'available';
      if (cardState === 'locked' || cardState === 'blocked') {
        return;
      }

      const cardId = getCardAnalyticsId(dayContent, cardIndex);
      const eventKey = `${cardId}:opened`;
      if (loggedCardOpenKeysRef.current.has(eventKey)) {
        return;
      }

      loggedCardOpenKeysRef.current.add(eventKey);
      void logEvent({
        cardId,
        dayNumber: dayContent.dayNumber,
        eventData: buildCardAnalyticsData({
          cardIndex,
          cardState,
          day: dayContent,
          extra: {
            source: 'day_detail',
          },
        }),
        eventType: 'card_opened',
        programSlug: dayContent.programSlug,
        userId: analyticsUserId,
      });
    },
    [analyticsUserId, cardStates, dayContent]
  );
  const logCardCompleted = useCallback(
    (cardIndex: number, extra?: AnalyticsEventData) => {
      if (!analyticsUserId || !dayContent) {
        return;
      }

      const card = dayContent.cards[cardIndex];
      if (!card) {
        return;
      }

      const cardId = getCardAnalyticsId(dayContent, cardIndex);
      const eventKey = `${cardId}:completed`;
      if (loggedCardCompletedKeysRef.current.has(eventKey)) {
        return;
      }

      loggedCardCompletedKeysRef.current.add(eventKey);
      void logEvent({
        cardId,
        dayNumber: dayContent.dayNumber,
        eventData: buildCardAnalyticsData({
          cardIndex,
          cardState: cardStates[cardIndex] ?? 'available',
          day: dayContent,
          extra,
        }),
        eventType: 'card_completed',
        programSlug: dayContent.programSlug,
        userId: analyticsUserId,
      });
    },
    [analyticsUserId, cardStates, dayContent]
  );
  const currentCardStateNotice = useMemo(
    () => {
      if (historicalDayState) {
        return getHistoricalDayNotice(historicalDayState);
      }

      if (isDayCompleted || currentCardState === 'locked' || currentCardState === 'blocked') {
        return null;
      }

      return getCardStateNotice(currentCardState, currentCardMeta.timeSlot);
    },
    [currentCardMeta.timeSlot, currentCardState, historicalDayState, isDayCompleted]
  );
  const isCurrentCardActionLocked =
    isFutureLocked || isHistoricalReadOnlyDay || currentCardState === 'locked' || currentCardState === 'blocked';
  const canCompleteFromCurrentCard = Boolean(
    dayContent &&
      currentIndex === dayContent.cards.length - 1 &&
      !isCurrentCardActionLocked &&
      !isDayCompleted &&
      (!hasCloseCard || currentCard?.type === 'close')
  );
  const hasNextAction = Boolean(dayContent && currentIndex < dayContent.cards.length - 1) || canCompleteFromCurrentCard;
  const handleCompleteCurrentCardAndContinue = useCallback(
    (completionSource: string = 'continue') => {
      if (!dayContent || isCurrentCardActionLocked || isHistoricalReadOnlyDay) {
        return;
      }

      logCardCompleted(currentIndex, {
        completionSource,
      });
      handleContinueFromCard();
    },
    [
      currentIndex,
      dayContent,
      handleContinueFromCard,
      isCurrentCardActionLocked,
      isHistoricalReadOnlyDay,
      logCardCompleted,
    ]
  );
  const handleAudioCompleted = useCallback(
    (payload: {
      audioStoragePath: string;
      cardIndex: number | null;
      completionMode: 'manual' | 'auto';
      listenSeconds: number;
      percentage: number;
      totalSeconds: number;
    }) => {
      if (!analyticsUserId || !dayContent) {
        return;
      }

      const cardIndex = payload.cardIndex ?? currentIndex;
      const card = dayContent.cards[cardIndex];
      if (!card || card.type !== 'audio') {
        return;
      }

      const cardId = getCardAnalyticsId(dayContent, cardIndex);
      const eventKey = `${cardId}:audio:${payload.completionMode}`;
      if (loggedAudioCompletionKeysRef.current.has(eventKey)) {
        return;
      }

      loggedAudioCompletionKeysRef.current.add(eventKey);
      const roundedListenSeconds = Number(payload.listenSeconds.toFixed(2));
      const roundedTotalSeconds = Number(payload.totalSeconds.toFixed(2));
      const roundedPercentage = Number(payload.percentage.toFixed(4));
      const audioPayload = buildCardAnalyticsData({
        cardIndex,
        cardState: cardStates[cardIndex] ?? 'available',
        day: dayContent,
        extra: {
          audioSlug: payload.audioStoragePath,
          audioStoragePath: payload.audioStoragePath,
          completionMode: payload.completionMode,
          listenSeconds: roundedListenSeconds,
          percentage: roundedPercentage,
          totalSeconds: roundedTotalSeconds,
        },
      });

      void logEvent({
        cardId,
        dayNumber: dayContent.dayNumber,
        eventData: audioPayload,
        eventType: 'audio_played',
        programSlug: dayContent.programSlug,
        userId: analyticsUserId,
      });
      logCardCompleted(cardIndex, {
        completionSource: `audio_${payload.completionMode}`,
        listenSeconds: roundedListenSeconds,
        percentage: roundedPercentage,
        totalSeconds: roundedTotalSeconds,
      });
    },
    [analyticsUserId, cardStates, currentIndex, dayContent, logCardCompleted]
  );

  useEffect(() => {
    if (!dayContent || !isRestored || isHistoricalReadOnlyDay || isFutureLocked || isCurrentCardActionLocked) {
      return;
    }

    logCardOpened(currentIndex);
  }, [
    currentIndex,
    dayContent,
    isCurrentCardActionLocked,
    isFutureLocked,
    isHistoricalReadOnlyDay,
    isRestored,
    logCardOpened,
  ]);

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

  const persistFinalizedDayState = useCallback(
    async (requestedDayState: Extract<DayState, 'completed' | 'partial' | 'skipped'>) => {
      if (!user?.id || !dayContent) {
        return null;
      }

      const routineProgressByIndex = await getDayRoutineProgressByIndex(dayContent);
      const record = buildUserDayStateRecord({
        userId: user.id,
        day: dayContent,
        requestedDayState,
        currentIndex,
        cardStates,
        routineProgressByIndex,
      });

      await upsertUserDayState(record);
      await queryClient.invalidateQueries({
        queryKey: finalizedDayStatesQueryKey(user.id, dayContent.programSlug),
      });
      return record;
    },
    [cardStates, currentIndex, dayContent, queryClient, user?.id]
  );
  const logDayFinalized = useCallback(
    (
      requestedDayState: Extract<DayState, 'completed' | 'partial'>,
      record: UserDayStateUpsert | null,
      extra?: AnalyticsEventData
    ) => {
      if (!analyticsUserId || !dayContent) {
        return;
      }

      const effectiveDayState = record?.day_state ?? requestedDayState;
      const eventKey = `${dayContent.programSlug}:${dayContent.dayNumber}:${effectiveDayState}`;
      if (loggedDayFinalizationKeysRef.current.has(eventKey)) {
        return;
      }

      loggedDayFinalizationKeysRef.current.add(eventKey);
      void logEvent({
        dayNumber: dayContent.dayNumber,
        eventData: {
          ...extra,
          cardsCompleted: record?.cards_completed ?? null,
          cardsOpened: record?.cards_opened ?? null,
          cardsTotal: record?.cards_total ?? dayContent.cards.length,
          completionPercentage: record?.completion_percentage ?? null,
          currentCardIndex: currentIndex,
          dayState: effectiveDayState,
          finalizedAt: record?.finalized_at ?? new Date().toISOString(),
        },
        eventType: requestedDayState === 'completed' ? 'day_completed' : 'day_saved_partial',
        programSlug: dayContent.programSlug,
        userId: analyticsUserId,
      });
    },
    [analyticsUserId, currentIndex, dayContent]
  );

  const handleCompleteCurrentDay = async () => {
    if (!programSlug || !dayContent || isDayCompleted || isCompletingDay || isHistoricalReadOnlyDay) {
      return;
    }

    try {
      setIsCompletingDay(true);
      await completeProgramDay(programSlug, dayContent.dayNumber);
      let finalizedRecord: UserDayStateUpsert | null = null;
      try {
        finalizedRecord = await persistFinalizedDayState('completed');
      } catch (dayStateError) {
        console.warn('Failed to persist completed day state', dayStateError);
      }
      logCardCompleted(currentIndex, {
        completionSource: 'day_completion',
      });
      logDayFinalized('completed', finalizedRecord, {
        isFinalProgramDay: Boolean(program && dayContent.dayNumber >= program.totalDays),
      });

      if (program && dayContent.dayNumber >= program.totalDays) {
        if (analyticsUserId) {
          void logEvent({
            dayNumber: dayContent.dayNumber,
            eventData: {
              cardsCompleted: finalizedRecord?.cards_completed ?? null,
              cardsTotal: finalizedRecord?.cards_total ?? dayContent.cards.length,
              completionRate: finalizedRecord?.completion_percentage ?? null,
              totalDays: program.totalDays,
            },
            eventType: 'program_completed',
            programSlug,
            userId: analyticsUserId,
          });
        }
        router.replace(`/program-complete?programSlug=${programSlug}` as Href);
      }
    } catch (error) {
      console.error('Failed to complete day', error);
    } finally {
      setIsCompletingDay(false);
    }
  };

  const handleSaveCurrentDayAsPartial = async () => {
    if (!programSlug || !dayContent || isDayCompleted || isCompletingDay || isHistoricalReadOnlyDay) {
      return;
    }

    try {
      setIsCompletingDay(true);
      await savePartialProgramDay(programSlug, dayContent.dayNumber);
      let finalizedRecord: UserDayStateUpsert | null = null;
      try {
        finalizedRecord = await persistFinalizedDayState('partial');
      } catch (dayStateError) {
        console.warn('Failed to persist partial day state', dayStateError);
      }
      logDayFinalized('partial', finalizedRecord, {
        hasIncompleteRequiredRoutines: routineSummary.hasRequiredRoutines && !routineSummary.allRequiredRoutinesComplete,
      });
    } catch (error) {
      console.error('Failed to save partial day', error);
    } finally {
      setIsCompletingDay(false);
    }
  };

  const handlePrimaryDayAction = async () => {
    if (isDayCompleted || isCompletingDay || isHistoricalReadOnlyDay) {
      return;
    }

    if (routineSummary.hasRequiredRoutines && !routineSummary.allRequiredRoutinesComplete) {
      if (!isDayPartial) {
        await handleSaveCurrentDayAsPartial();
      }
      return;
    }

    await handleCompleteCurrentDay();
  };

  if (!programSlug || !Number.isInteger(dayNumber) || dayNumber < 1) {
    return <ErrorState message="The requested day detail route is missing a valid program slug or day number." />;
  }

  if (rawMode === 'review' && isOwnedProgramsLoading) {
    return <LoadingState />;
  }

  if (rawMode === 'review' && !isCompletedProgramReview) {
    return <ErrorState message="This completed journey is not available for review." />;
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

  const isCurrentScheduledDay = dayContent.dayNumber === activeDayNumber && !isDayCompleted;
  const isFinalProgramDay = dayContent.dayNumber >= program.totalDays;
  const hasIncompleteRequiredRoutines =
    routineSummary.hasRequiredRoutines && !routineSummary.allRequiredRoutinesComplete;
  const finalizedSummaryText = finalizedDayState ? formatFinalizedDaySummary(finalizedDayState) : null;
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
    : historicalDayState === 'partial'
      ? `${finalizedSummaryText ?? 'This day closed as partial after the session window ended.'} It now stays available in review mode only.`
    : historicalDayState === 'skipped'
      ? `${finalizedSummaryText ?? `This day closed at ${formatWindowTime(TIME_SLOT_WINDOWS.evening.closes)} with no completed cards.`} It now stays available in review mode only.`
    : isDayPartial
      ? hasIncompleteRequiredRoutines
        ? `${finalizedSummaryText ?? 'This day is saved as partial.'} Finish the required routine steps before marking it fully complete.`
        : `${finalizedSummaryText ?? 'This day is saved as partial.'} You can mark it fully complete when you are ready.`
    : isCurrentScheduledDay
      ? nextUnlockLabel
        ? `${nextUnlockLabel}. Earlier practices will stay available if you want to revisit them.`
        : hasIncompleteRequiredRoutines
          ? 'Required routine steps are still unfinished. You can save this day as partial and come back later.'
          : 'When you are ready, mark today complete.'
      : 'This earlier practice will stay available even after you complete it.';
  const primaryCompletionLabel = currentCard?.type === 'close' && currentCardState === 'locked'
      ? 'Locked'
      : currentCard?.type === 'close' && currentCardState === 'blocked'
        ? 'Missed'
        : isHistoricalReadOnlyDay
          ? 'Back to Program'
        : isDayPartial
          ? hasIncompleteRequiredRoutines
            ? 'Finish routines first'
            : 'Mark fully complete'
          : hasIncompleteRequiredRoutines
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
            onPress={() =>
              router.navigate(
                isCompletedProgramReview && programSlug
                  ? (`/(tabs)/program?reviewProgram=${programSlug}` as Href)
                  : ('/program' as Href)
              )
            }
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

      {currentCardStateNotice ? (
        <View
          style={[
            styles.cardStateNotice,
            currentCardStateNotice.tone === 'warm'
              ? styles.cardStateNoticeWarm
              : currentCardStateNotice.tone === 'critical'
                ? styles.cardStateNoticeCritical
                : styles.cardStateNoticeMuted,
          ]}
        >
          <Text style={styles.cardStateNoticeEyebrow}>{currentCardStateNotice.eyebrow}</Text>
          <Text style={styles.cardStateNoticeText}>{currentCardStateNotice.message}</Text>
        </View>
      ) : null}

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
                cardState={cardStates[index]}
                cardTimeSlot={runtimeCards[index]?.meta.timeSlot}
                index={index}
                totalCards={dayContent.cards.length}
                progress={swipeProgress}
                programName={program.name}
                onContinue={() => handleCompleteCurrentCardAndContinue('card_continue')}
                onPrevious={() => {
                  if (index > 0) {
                    pagerRef.current?.setPage(index - 1);
                  }
                }}
                reflectionStorageKey={`day-reflection:${dayContent.programSlug}:${dayContent.dayNumber}:${index}`}
                routineStorageKey={getRoutineStorageKey(dayContent.programSlug, dayContent.dayNumber, index)}
                hasEffortCheck={runtimeCards[index]?.meta.hasEffortCheck}
                isReadOnly={isHistoricalReadOnlyDay}
                onRoutineProgressChange={handleRoutineProgressChange}
                onAudioCompleted={handleAudioCompleted}
                closeCardState={{
                  isCompleted: isDayCompleted,
                  isPartial: isDayPartial,
                  isReadOnly: isHistoricalReadOnlyDay,
                  readOnlyState: historicalDayState ?? undefined,
                  isFinalProgramDay,
                  completionDescription,
                  isCompleting: isCompletingDay,
                  primaryActionLabel: primaryCompletionLabel,
                  primaryActionDisabled:
                    currentCard?.type === 'close' &&
                    !isHistoricalReadOnlyDay &&
                    (isCurrentCardActionLocked || (isDayPartial && hasIncompleteRequiredRoutines)),
                  onCompleteDay: () => {
                    if (isHistoricalReadOnlyDay) {
                      router.navigate('/program' as Href);
                      return;
                    }
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
            handleCompleteCurrentCardAndContinue('next_button');
          } else if (!isCurrentCardActionLocked) {
            void handlePrimaryDayAction();
          }
        }}
        hasPrev={currentIndex > 0}
        hasNext={hasNextAction}
        centerLabel={(() => {
          if (isHistoricalReadOnlyDay) {
            return 'REVIEW';
          }
          if (currentCardState === 'locked') {
            return 'LOCKED';
          }
          if (currentCardState === 'blocked') {
            return 'MISSED';
          }
          if (transportConfigs[currentIndex]?.centerLabel) {
            return transportConfigs[currentIndex]!.centerLabel;
          }
          const currentCard = dayContent.cards[currentIndex];
          const isLastCard = currentIndex === dayContent.cards.length - 1;
          return getDefaultCenterConfig(currentCard?.type ?? '', isLastCard).label;
        })()}
        centerIcon={(() => {
          if (isHistoricalReadOnlyDay) {
            return <Ionicons name="eye-outline" size={28} color="#06290C" />;
          }
          if (currentCardState === 'locked') {
            return <Ionicons name="lock-closed-outline" size={28} color="#06290C" />;
          }
          if (currentCardState === 'blocked') {
            return <Ionicons name="time-outline" size={28} color="#06290C" />;
          }
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
          if (isCurrentCardActionLocked) {
            return;
          }

          const customAction = transportConfigsRef.current[currentIndex]?.onCenterPress;
          if (customAction) {
            customAction();
          } else {
            if (currentIndex < dayContent.cards.length - 1) {
              handleCompleteCurrentCardAndContinue('center_button');
            } else {
              void handlePrimaryDayAction();
            }
          }
        }}
        disabled={transportConfigs[currentIndex]?.disabled || isCurrentCardActionLocked}
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
  cardStateNotice: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  cardStateNoticeMuted: {
    backgroundColor: 'rgba(227, 243, 229, 0.08)',
    borderColor: 'rgba(227, 243, 229, 0.16)',
  },
  cardStateNoticeWarm: {
    backgroundColor: 'rgba(196, 153, 73, 0.16)',
    borderColor: 'rgba(214, 180, 94, 0.32)',
  },
  cardStateNoticeCritical: {
    backgroundColor: 'rgba(185, 58, 43, 0.16)',
    borderColor: 'rgba(214, 108, 96, 0.32)',
  },
  cardStateNoticeEyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(227, 243, 229, 0.72)',
  },
  cardStateNoticeText: {
    fontFamily: 'Satoshi',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(227, 243, 229, 0.88)',
  },
  placeholderCard: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: '#F6F5F1',
    paddingHorizontal: 26,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },
  placeholderEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  placeholderEyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(6, 41, 12, 0.45)',
  },
  placeholderSlotPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  placeholderSlotPillLocked: {
    backgroundColor: 'rgba(6, 41, 12, 0.08)',
  },
  placeholderSlotPillMissed: {
    backgroundColor: 'rgba(185, 58, 43, 0.10)',
  },
  placeholderSlotPillText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: 'rgba(6, 41, 12, 0.7)',
  },
  placeholderTitle: {
    marginTop: 16,
    fontFamily: 'Erode-Medium',
    fontSize: 34,
    lineHeight: 38,
    color: '#06290C',
  },
  placeholderBody: {
    marginTop: 14,
    fontFamily: 'Satoshi',
    fontSize: 18,
    lineHeight: 29,
    color: 'rgba(6, 41, 12, 0.68)',
  },
  placeholderMetaRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 41, 12, 0.08)',
  },
  placeholderMetaText: {
    flex: 1,
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(6, 41, 12, 0.48)',
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
