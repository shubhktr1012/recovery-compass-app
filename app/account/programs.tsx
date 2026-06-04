import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, LayoutChangeEvent, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { usePrograms } from '@/content';
import { useOwnedPrograms } from '@/hooks/useOwnedPrograms';
import { useAuth } from '@/providers/auth';
import { useProfile } from '@/providers/profile';
import { ExplorePrograms, ProgramIcon } from '@/components/dashboard/ExplorePrograms';
import { isPublicCatalogProgram } from '@/content/programs/metadata';
import { SkeletonCircle, SkeletonLine, SkeletonTitle } from '@/components/ui/Skeleton';
import { AppTypography } from '@/constants/typography';
import type { ProgramContent, ProgramSlug } from '@/types/content';
import { getJourneyForProgramSlug, getStoredOnboardingJourney } from '@/lib/onboarding.realignment';
import {
  getQueueDropIndexFromAbsoluteY,
  getQueueDropIndexFromDragDelta,
  getQueueTouchOffset,
  reorderProgramQueue,
  type QueueItemLayout,
} from '@/lib/program-queue';
import {
  PROGRAM_START_ROUTE,
  PROGRAM_TAB_ROUTE,
  buildPersonalizationRoute,
  buildProgramReviewRoute,
} from '@/lib/navigation/routes';
import { supabase } from '@/lib/supabase';

function ProgramLibraryCard({
  program,
  eyebrow,
  body,
  dark = false,
  tone = 'default',
  actionLabel,
  notice,
  rankLabel,
  trailingAccessory,
  footer,
  onPress,
  disabled = false,
}: {
  program: ProgramContent;
  eyebrow: string;
  body: string;
  dark?: boolean;
  tone?: 'default' | 'queued' | 'completed';
  actionLabel?: string;
  notice?: string;
  rankLabel?: string;
  trailingAccessory?: React.ReactNode;
  footer?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const CardComponent = onPress ? Pressable : View;
  const cardToneClass = dark
    ? 'bg-forest border-forest/80'
    : tone === 'queued'
      ? 'bg-sageSoft border-forest/10'
      : tone === 'completed'
        ? 'bg-[#F5F5F7] border-forest/5'
        : 'bg-white border-forest/5';

  return (
    <CardComponent
      onPress={onPress}
      disabled={disabled}
      className={`rounded-[24px] p-5 border ${cardToneClass} shadow-sm shadow-forest/5`}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View className="flex-row items-start gap-3.5">
        <View className="w-[48px] h-[48px] rounded-[18px] items-center justify-center shrink-0 bg-sageSoft">
          {rankLabel ? (
            <Text className="text-forest" style={AppTypography.dataPoint}>
              {rankLabel}
            </Text>
          ) : (
            <ProgramIcon category={program.category} />
          )}
        </View>
        <View className="flex-1">
          <Text
            className={`uppercase ${dark ? 'text-sage/55' : 'text-forest/40'}`}
            style={[AppTypography.eyebrow, { letterSpacing: 1.76 }]}
          >
            {eyebrow}
          </Text>
          <Text className={`mt-1 ${dark ? 'text-white' : 'text-forest'}`} style={AppTypography.displayCardMd}>
            {program.name}
          </Text>
          <Text
            className={`mt-1.5 ${dark ? 'text-white/60' : 'text-forest/55'}`}
            style={AppTypography.meta}
          >
            {body}
          </Text>
          {notice ? (
            <Text className={`mt-2 ${dark ? 'text-sage/80' : 'text-forest/55'}`} style={AppTypography.eyebrow}>
              {notice}
            </Text>
          ) : null}
          <View className="flex-row items-center flex-wrap gap-2 mt-3">
            <View className={`${dark ? 'bg-white/8 border border-white/10' : 'bg-sageSoft'} rounded-full px-2.5 py-1`}>
              <Text
                className={`uppercase ${dark ? 'text-sage/75' : 'text-forest/65'}`}
                style={[AppTypography.eyebrow, { letterSpacing: 1.1 }]}
              >
                {program.totalDays} days
              </Text>
            </View>
            {program.hasAudio ? (
              <View className={`${dark ? 'bg-white/8 border border-white/10' : 'bg-sageSoft'} rounded-full px-2.5 py-1`}>
                <Text
                  className={`uppercase ${dark ? 'text-sage/75' : 'text-forest/65'}`}
                  style={[AppTypography.eyebrow, { letterSpacing: 1.1 }]}
                >
                  Guided audio
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        {trailingAccessory ? (
          <View className="shrink-0">
            {trailingAccessory}
          </View>
        ) : null}
      </View>

      {actionLabel ? (
        <View className="mt-4 flex-row justify-end">
          <View className={`${dark ? 'bg-white/10' : 'bg-forest'} rounded-full px-4 py-2`}>
            <Text className="text-white" style={AppTypography.metaMedium}>
              {actionLabel}
            </Text>
          </View>
        </View>
      ) : null}

      {footer ? <View className="mt-4">{footer}</View> : null}
    </CardComponent>
  );
}

function SectionHeader({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="uppercase text-forest/50" style={[AppTypography.eyebrow, { letterSpacing: 2.2 }]}>
        {title}
      </Text>
      {body ? (
        <Text className="text-forest/55 mt-1.5 leading-relaxed" style={AppTypography.meta}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

function isNotAuthenticatedError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: unknown; message?: unknown };
  const message = typeof maybeError.message === 'string' ? maybeError.message.toLowerCase() : '';

  return maybeError.code === 'P0001' && message.includes('not authenticated');
}

function DraggableQueueCard({
  program,
  index,
  activeProgramName,
  isDraggingDisabled,
  isFirstWaitingProgram,
  onDragStart,
  onDragEnd,
  onMeasure,
  notice,
}: {
  program: ProgramContent;
  index: number;
  activeProgramName?: string;
  isDraggingDisabled: boolean;
  isFirstWaitingProgram: boolean;
  onDragStart: (absoluteY: number) => void;
  onDragEnd: (drag: { absoluteY: number; translationY: number }) => void;
  onMeasure: (layout: QueueItemLayout) => void;
  notice?: string;
}) {
  const dragY = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);
  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => !isDraggingDisabled,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        !isDraggingDisabled &&
        Math.abs(gesture.dy) > 4 &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: (event) => {
        setIsDragging(true);
        dragY.setOffset(0);
        dragY.setValue(0);
        onDragStart(event.nativeEvent.pageY);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      },
      onPanResponderMove: (_event, gesture) => {
        dragY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_event, gesture) => {
        onDragEnd({ absoluteY: gesture.moveY, translationY: gesture.dy });
        Animated.timing(dragY, {
          toValue: 0,
          useNativeDriver: true,
          duration: 180,
          easing: Easing.out(Easing.cubic),
        }).start(() => setIsDragging(false));
      },
      onPanResponderTerminate: () => {
        onDragEnd({ absoluteY: 0, translationY: 0 });
        Animated.timing(dragY, {
          toValue: 0,
          useNativeDriver: true,
          duration: 180,
          easing: Easing.out(Easing.cubic),
        }).start(() => setIsDragging(false));
      },
    }),
    [dragY, isDraggingDisabled, onDragEnd, onDragStart]
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height, y } = event.nativeEvent.layout;
      onMeasure({ height: height + 12, y });
    },
    [onMeasure]
  );

  return (
    <Animated.View
      onLayout={handleLayout}
      style={{
        transform: [{ translateY: dragY }, { scale: isDragging ? 1.01 : 1 }],
        zIndex: isDragging ? 20 : 1,
        shadowColor: '#06290C',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: isDragging ? 0.06 : 0,
        shadowRadius: 24,
        elevation: isDragging ? 8 : 0,
      }}
    >
      <ProgramLibraryCard
        program={program}
        eyebrow={isFirstWaitingProgram ? 'Queued next' : 'Queued'}
        body={
          isFirstWaitingProgram
            ? `This will be offered after ${activeProgramName ?? 'your current journey'} ends.`
            : 'Owned and waiting in your program queue.'
        }
        tone={isFirstWaitingProgram ? 'queued' : 'default'}
        rankLabel={String(index + 1).padStart(2, '0')}
        notice={notice}
        trailingAccessory={
          <View
            {...panResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel={`Drag ${program.name} to reorder queue priority`}
            className={`h-11 w-11 rounded-full items-center justify-center border ${
              isDraggingDisabled
                ? 'border-forest/5 bg-white/50'
                : isDragging
                  ? 'border-forest/15 bg-[#E3F2E5]'
                  : 'border-forest/10 bg-white'
            }`}
          >
            <Ionicons
              name="reorder-three-outline"
              size={24}
              color={isDraggingDisabled ? 'rgba(6,41,12,0.25)' : isDragging ? '#06290C' : 'rgba(6,41,12,0.7)'}
            />
          </View>
        }
        footer={
          index === 0 ? (
            <Text className="text-forest/42" style={AppTypography.meta}>
              Drag the handle to change what comes next.
            </Text>
          ) : null
        }
      />
    </Animated.View>
  );
}

function ProgramsSkeleton() {
  return (
    <View className="gap-3">
      {[0, 1].map((index) => (
        <View key={index} className="bg-white rounded-[24px] border border-forest/5 p-5 shadow-sm shadow-forest/5">
          <View className="flex-row gap-3.5 items-start">
            <SkeletonCircle className="bg-forest/10" />
            <View className="flex-1 pt-1">
              <SkeletonLine className="bg-forest/10" width="34%" />
              <SkeletonTitle className="bg-forest/10 mt-3" />
              <SkeletonLine className="bg-forest/10 mt-3" width="88%" />
              <SkeletonLine className="bg-forest/10 mt-2" width="72%" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ProgramsLibraryScreen() {
  const router = useRouter();
  const { programs, isLoading: isProgramsLoading } = usePrograms();
  const { ownedPrograms, isLoading } = useOwnedPrograms();
  const { user } = useAuth();
  const {
    access,
    pauseProgramManually,
    profile,
    prepareOwnedProgramSetup,
    reorderOwnedProgramQueue,
    resumeProgramFromPause,
  } = useProfile();
  const [switchingProgram, setSwitchingProgram] = useState<ProgramSlug | null>(null);
  const [isDraggingQueue, setIsDraggingQueue] = useState(false);
  const [queueOrderOverride, setQueueOrderOverride] = useState<ProgramSlug[] | null>(null);
  const queueListRef = useRef<React.ElementRef<typeof View> | null>(null);
  const queueListPageYRef = useRef<number | null>(null);
  const dragTouchOffsetRef = useRef<number | null>(null);
  const [queueItemLayouts, setQueueItemLayouts] = useState<Record<string, QueueItemLayout>>({});

  const accessProgramSlug = access.ownedProgram ?? null;
  const activeProgramSlug =
    accessProgramSlug && access.completionState !== 'completed' && access.programState !== 'purchased'
      ? accessProgramSlug
      : null;
  const hasBlockingActiveProgram = Boolean(
    activeProgramSlug &&
    access.completionState !== 'completed' &&
    access.programState !== 'purchased'
  );
  const userId = profile?.id ?? null;
  const canPersistQueuePriority = Boolean(user?.id && userId && user.id === userId);
  const isActiveProgramPaused = access.programState === 'paused';
  const activeProgramDayLabel = access.currentDay ? `Day ${access.currentDay}` : 'your current day';

  const questionnaireRunsQuery = useQuery({
    queryKey: ['questionnaire-runs', userId, 'journeys'],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return [] as string[];
      }

      const { data, error } = await supabase
        .from('questionnaire_runs')
        .select('journey_key')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return Array.from(
        new Set((data ?? []).map((run) => run.journey_key).filter(Boolean))
      );
    },
    staleTime: 60 * 1000,
  });

  const completedJourneyKeys = useMemo(() => {
    const keys = new Set(questionnaireRunsQuery.data ?? []);
    const profileJourney = getStoredOnboardingJourney({
      questionnaireAnswers: profile?.questionnaire_answers ?? null,
      recommendedProgram: profile?.recommended_program ?? null,
    });

    if (profileJourney) {
      keys.add(profileJourney);
    }

    return keys;
  }, [profile?.questionnaire_answers, profile?.recommended_program, questionnaireRunsQuery.data]);

  const hasProgramPersonalization = useCallback(
    (programSlug: ProgramSlug) => {
      const journey = getJourneyForProgramSlug(programSlug);
      return Boolean(journey && completedJourneyKeys.has(journey));
    },
    [completedJourneyKeys]
  );

  const startQueuedProgramSetup = useCallback(
    async (programSlug: ProgramSlug) => {
      setSwitchingProgram(programSlug);

      try {
        await prepareOwnedProgramSetup(programSlug);
        router.push(PROGRAM_START_ROUTE);
      } catch (error) {
        if (__DEV__) {
          console.log('Failed to prepare queued program setup', error);
        }
        Alert.alert(
          'Program is waiting',
          'Finish your current journey before starting another program.'
        );
      } finally {
        setSwitchingProgram(null);
      }
    },
    [prepareOwnedProgramSetup, router]
  );

  const handleSelectProgram = useCallback(
    (programSlug: ProgramSlug) => {
      if (!hasProgramPersonalization(programSlug)) {
        const programName = programs.find((program) => program.slug === programSlug)?.name ?? 'this program';
        Alert.alert(
          'Personalize this program?',
          `${programName} is unlocked, but its questionnaire is not complete yet.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Set up without it',
              onPress: () => void startQueuedProgramSetup(programSlug),
            },
            {
              text: 'Personalize now',
              onPress: () => {
                router.push(buildPersonalizationRoute({ mode: 'realign', program: programSlug }));
              },
            },
          ]
        );
        return;
      }

      void startQueuedProgramSetup(programSlug);
    },
    [hasProgramPersonalization, programs, router, startQueuedProgramSetup]
  );

  const handlePauseActiveProgram = useCallback(() => {
    if (!activeProgramSlug) {
      return;
    }

    Alert.alert(
      'Pause journey?',
      'Your current day and progress will be frozen. You will get one daily reminder until you resume.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause',
          style: 'destructive',
          onPress: () => {
            void pauseProgramManually(activeProgramSlug).catch((error) => {
              if (__DEV__) {
                console.log('Failed to pause active program', error);
              }
              Alert.alert('Could not pause journey', 'Please try again in a moment.');
            });
          },
        },
      ]
    );
  }, [activeProgramSlug, pauseProgramManually]);

  const handleResumeActiveProgram = useCallback(() => {
    if (!activeProgramSlug) {
      return;
    }

    void resumeProgramFromPause(activeProgramSlug).catch((error) => {
      if (__DEV__) {
        console.log('Failed to resume active program', error);
      }
      Alert.alert('Could not resume journey', 'Please try again in a moment.');
    });
  }, [activeProgramSlug, resumeProgramFromPause]);

  const { activeProgram, otherOwnedPrograms, completedPrograms, catalogPrograms } = useMemo(() => {
    const ownedSlugSet = new Set([
      ...(accessProgramSlug ? [accessProgramSlug] : []),
      ...ownedPrograms.map((entry) => entry.slug),
    ]);
    const recommendedProgramSlug = profile?.recommended_program ?? null;
    const ownedProgramRank = new Map(
      ownedPrograms.map((entry) => [entry.slug, entry.priorityRank ?? Number.MAX_SAFE_INTEGER])
    );
    const ownedProgramRecord = new Map(ownedPrograms.map((entry) => [entry.slug, entry]));
    const isCompletedOwnedProgram = (programSlug: ProgramSlug) => {
      const record = ownedProgramRecord.get(programSlug);

      return (
        record?.purchaseState === 'owned_completed' ||
        record?.completionState === 'completed' ||
        record?.programState === 'completed' ||
        (programSlug === accessProgramSlug && access.completionState === 'completed')
      );
    };

    const ownedCatalog = programs.filter((program) => ownedSlugSet.has(program.slug));
    const activeProgram = activeProgramSlug
      ? ownedCatalog.find((program) => program.slug === activeProgramSlug) ?? null
      : null;
    const completedPrograms = ownedCatalog
      .filter((program) => isCompletedOwnedProgram(program.slug))
      .sort((left, right) => left.name.localeCompare(right.name));
    const otherOwnedPrograms = ownedCatalog
      .filter((program) => program.slug !== activeProgramSlug && !isCompletedOwnedProgram(program.slug))
      .sort((left, right) => {
        const rankDelta = (ownedProgramRank.get(left.slug) ?? Number.MAX_SAFE_INTEGER) -
          (ownedProgramRank.get(right.slug) ?? Number.MAX_SAFE_INTEGER);
        return rankDelta !== 0 ? rankDelta : left.name.localeCompare(right.name);
      });
    const catalogPrograms = programs
      .filter((program) => !ownedSlugSet.has(program.slug) && isPublicCatalogProgram(program.slug))
      .sort((left, right) => {
        const leftRecommended = left.slug === recommendedProgramSlug ? 1 : 0;
        const rightRecommended = right.slug === recommendedProgramSlug ? 1 : 0;
        return rightRecommended - leftRecommended;
      });

    return {
      activeProgram,
      otherOwnedPrograms,
      completedPrograms,
      catalogPrograms,
    };
  }, [access.completionState, accessProgramSlug, activeProgramSlug, ownedPrograms, profile?.recommended_program, programs]);

  const displayedQueuedPrograms = useMemo(() => {
    if (!queueOrderOverride) {
      return otherOwnedPrograms;
    }

    const currentSlugs = otherOwnedPrograms.map((program) => program.slug).sort();
    const overrideSlugs = [...queueOrderOverride].sort();
    const canUseOverride =
      currentSlugs.length === overrideSlugs.length &&
      currentSlugs.every((slug, index) => slug === overrideSlugs[index]);

    if (!canUseOverride) {
      return otherOwnedPrograms;
    }

    const programBySlug = new Map(otherOwnedPrograms.map((program) => [program.slug, program]));

    return queueOrderOverride
      .map((slug) => programBySlug.get(slug))
      .filter((program): program is ProgramContent => Boolean(program));
  }, [otherOwnedPrograms, queueOrderOverride]);

  const measureQueueList = useCallback(() => {
    queueListRef.current?.measureInWindow((_x, pageY) => {
      queueListPageYRef.current = pageY;
    });
  }, []);

  const handleStartQueuedProgramDrag = useCallback(
    (programSlug: ProgramSlug, absoluteY: number) => {
      setIsDraggingQueue(true);
      measureQueueList();

      const layout = queueItemLayouts[programSlug];
      const containerPageY = queueListPageYRef.current;

      dragTouchOffsetRef.current =
        layout && typeof containerPageY === 'number' && Number.isFinite(absoluteY)
          ? getQueueTouchOffset({
              absoluteY,
              containerPageY,
              itemLayout: layout,
            })
          : null;
    },
    [measureQueueList, queueItemLayouts]
  );

  const handleDropQueuedProgram = useCallback(
    async (programSlug: ProgramSlug, drag: { absoluteY: number; translationY: number }) => {
      const orderedSlugs = displayedQueuedPrograms.map((program) => program.slug);
      const currentIndex = orderedSlugs.indexOf(programSlug);
      const containerPageY = queueListPageYRef.current;
      const canUseAbsoluteDrop =
        typeof containerPageY === 'number' &&
        Number.isFinite(containerPageY) &&
        Number.isFinite(drag.absoluteY) &&
        drag.absoluteY > 0 &&
        Boolean(queueItemLayouts[programSlug]);
      const targetIndex = canUseAbsoluteDrop
        ? getQueueDropIndexFromAbsoluteY({
            absoluteY: drag.absoluteY,
            containerPageY,
            fromIndex: currentIndex,
            itemLayouts: queueItemLayouts,
            orderedSlugs,
            touchOffsetWithinItem: dragTouchOffsetRef.current,
          })
        : getQueueDropIndexFromDragDelta({
            fromIndex: currentIndex,
            dragDeltaY: drag.translationY,
            itemLayouts: queueItemLayouts,
            orderedSlugs,
          });

      setIsDraggingQueue(false);
      dragTouchOffsetRef.current = null;

      const nextQueue = reorderProgramQueue(orderedSlugs, currentIndex, targetIndex);

      if (nextQueue === orderedSlugs) {
        return;
      }

      if (!canPersistQueuePriority) {
        Alert.alert(
          'Session required',
          'Please sign in again before changing program priority.'
        );
        return;
      }

      setQueueOrderOverride(nextQueue);
      try {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        const persistedQueue = await reorderOwnedProgramQueue(nextQueue);
        setQueueOrderOverride(persistedQueue.length > 0 ? persistedQueue : nextQueue);
      } catch (error) {
        setQueueOrderOverride(orderedSlugs);
        if (__DEV__) {
          console.log('Failed to reorder owned program queue', error);
        }
        Alert.alert(
          isNotAuthenticatedError(error) ? 'Session expired' : 'Could not update priority',
          isNotAuthenticatedError(error)
            ? 'Please sign in again before changing program priority.'
            : 'The queue did not save. Please try again.'
        );
      }
    },
    [canPersistQueuePriority, displayedQueuedPrograms, queueItemLayouts, reorderOwnedProgramQueue]
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerClassName="px-6 pt-4 pb-24"
        scrollEnabled={!isDraggingQueue}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={20}
          className="self-start mb-8 h-11 w-11 items-center justify-center rounded-full border border-forest/10 bg-white"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="#06290C" />
        </Pressable>

        <View className="mb-8">
          <Text className="tracking-[-0.02em] text-forest" style={AppTypography.displayHero}>
            My programs
          </Text>
          <Text className="text-forest/60 mt-3 pr-6 leading-relaxed" style={AppTypography.body}>
            {activeProgram
              ? 'Manage your library and queue what comes next.'
              : 'Choose what to begin next. Completed journeys stay saved here.'}
          </Text>
        </View>

        {isLoading ? (
          <ProgramsSkeleton />
        ) : (
          <View className="gap-4">
            {activeProgram ? (
              <ProgramLibraryCard
                program={activeProgram}
                eyebrow="Current journey"
                body={
                  isActiveProgramPaused
                    ? `Paused at ${activeProgramDayLabel}. Resume when you are ready; your queue stays unchanged.`
                    : 'Pinned to Home, Program, reminders, and today’s flow.'
                }
                notice={
                  hasProgramPersonalization(activeProgram.slug)
                    ? undefined
                    : 'Personalization not completed'
                }
                dark
                footer={
                  <View className="flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => router.push(PROGRAM_TAB_ROUTE)}
                      accessibilityRole="button"
                      className="rounded-full bg-white px-4 py-2"
                    >
                      <Text className="text-forest" style={AppTypography.metaMedium}>
                        Open program
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={isActiveProgramPaused ? handleResumeActiveProgram : handlePauseActiveProgram}
                      accessibilityRole="button"
                      className="rounded-full border border-white/15 bg-white/10 px-4 py-2"
                    >
                      <Text className="text-white" style={AppTypography.metaMedium}>
                        {isActiveProgramPaused ? 'Resume journey' : 'Pause journey'}
                      </Text>
                    </Pressable>
                  </View>
                }
              />
            ) : null}

            <View className="pt-1">
              <SectionHeader
                title={hasBlockingActiveProgram ? 'Up next' : 'Ready to start'}
                body={
                  hasBlockingActiveProgram && otherOwnedPrograms.length > 1 && !canPersistQueuePriority
                    ? 'Sign in again to change queue priority. Your waiting programs remain saved.'
                    : undefined
                }
              />
              {hasBlockingActiveProgram && otherOwnedPrograms.length > 1 && canPersistQueuePriority ? (
                <Text className="text-forest/48 -mt-1 mb-3" style={AppTypography.meta}>
                  Drag queued programs to choose what appears first after the current journey ends.
                </Text>
              ) : null}

              {otherOwnedPrograms.length === 0 ? (
                <View className="bg-white rounded-[24px] border border-forest/5 p-5 shadow-sm shadow-forest/5">
                  <Text className="text-forest/55" style={AppTypography.label}>
                    Additional unlocked programs will appear here as you add them to your library.
                  </Text>
                </View>
              ) : (
                <View
                  ref={queueListRef}
                  className="gap-3"
                  onLayout={() => measureQueueList()}
                >
                  {displayedQueuedPrograms.map((program, index) => {
                    const isFirstWaitingProgram = index === 0;
                    const canDrag =
                      hasBlockingActiveProgram &&
                      otherOwnedPrograms.length > 1 &&
                      displayedQueuedPrograms.length > 1 &&
                      canPersistQueuePriority;

                    if (hasBlockingActiveProgram) {
                      return (
                        <DraggableQueueCard
                          key={program.slug}
                          program={program}
                          index={index}
                          activeProgramName={activeProgram?.name}
                          isDraggingDisabled={!canDrag}
                          isFirstWaitingProgram={isFirstWaitingProgram}
                          notice={
                            hasProgramPersonalization(program.slug)
                              ? undefined
                              : 'Personalization not completed'
                          }
                          onDragStart={(absoluteY) => handleStartQueuedProgramDrag(program.slug, absoluteY)}
                          onDragEnd={(drag) => void handleDropQueuedProgram(program.slug, drag)}
                          onMeasure={(layout) =>
                            setQueueItemLayouts((current) =>
                              current[program.slug]?.height === layout.height &&
                                current[program.slug]?.y === layout.y
                                ? current
                                : { ...current, [program.slug]: layout }
                            )
                          }
                        />
                      );
                    }

                    return (
                      <ProgramLibraryCard
                        key={program.slug}
                        program={program}
                        eyebrow="Ready"
                        body="Ready for Program Setup. Choose when Day 1 should begin."
                        notice={
                          hasProgramPersonalization(program.slug)
                            ? undefined
                            : 'Personalization not completed'
                        }
                        actionLabel={switchingProgram === program.slug ? 'Preparing...' : 'Set up program'}
                        disabled={Boolean(switchingProgram)}
                        onPress={() => {
                          if (!hasProgramPersonalization(program.slug)) {
                            handleSelectProgram(program.slug);
                            return;
                          }

                          void startQueuedProgramSetup(program.slug);
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </View>

            {completedPrograms.length > 0 ? (
              <View className="pt-5">
                <SectionHeader
                  title="Completed journeys"
                  body="Saved for review only. They will not replace your active program."
                />
                <View className="gap-3">
                  {completedPrograms.map((program) => (
                    <ProgramLibraryCard
                      key={program.slug}
                      program={program}
                      eyebrow="Completed"
                      body="Revisit the full timeline anytime."
                      tone="completed"
                      actionLabel="Review journey"
                      onPress={() =>
                        router.push(buildProgramReviewRoute(program.slug))
                      }
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View className="pt-5">
              <ExplorePrograms
                title="Explore more"
                programs={catalogPrograms}
                isLoading={isProgramsLoading}
                recommendedProgramSlug={profile?.recommended_program ?? null}
                emptyMessage="You have unlocked every available program."
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
