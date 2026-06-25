import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ProgramIcon } from '@/components/dashboard/ExplorePrograms';
import { usePrograms } from '@/content';
import { useProgramQueueReviewStatus, PROGRAM_QUEUE_REVIEW_QUERY_ROOT } from '@/hooks/useProgramQueueReviewStatus';
import type { OwnedProgramRecord } from '@/hooks/useOwnedPrograms';
import { OWNED_PROGRAMS_QUERY_ROOT } from '@/hooks/useOwnedPrograms';
import { AppColors } from '@/constants/theme';
import { AppTypography } from '@/constants/typography';
import {
  getQueueDropIndexFromAbsoluteY,
  getQueueDropIndexFromDragDelta,
  getQueueTouchOffset,
  reorderProgramQueue,
  type QueueItemLayout,
} from '@/lib/program-queue';
import { isDeferredQueuedProgramRecord } from '@/lib/program-queue-review';
import { HOME_ROUTE, MY_PROGRAMS_ROUTE } from '@/lib/navigation/routes';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { useProfile } from '@/providers/profile';
import type { ProgramContent, ProgramSlug } from '@/types/content';

function ProgramSummaryCard({
  body,
  eyebrow,
  program,
  rankLabel,
  tone = 'default',
  trailingAccessory,
}: {
  body: string;
  eyebrow: string;
  program: ProgramContent;
  rankLabel?: string;
  tone?: 'active' | 'default' | 'deferred';
  trailingAccessory?: React.ReactNode;
}) {
  const isActive = tone === 'active';
  const cardClass = isActive
    ? 'bg-forest border-forest/80'
    : tone === 'deferred'
      ? 'bg-sageSoft border-forest/10'
      : 'bg-white border-forest/5';

  return (
    <View className={`rounded-[26px] border p-5 shadow-sm shadow-forest/5 ${cardClass}`}>
      <View className="flex-row items-start gap-3.5">
        <View className="w-[48px] h-[48px] rounded-[18px] items-center justify-center shrink-0 bg-white/90">
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
            className={`uppercase ${isActive ? 'text-sage/65' : 'text-forest/45'}`}
            style={[AppTypography.eyebrow, { letterSpacing: 1.8 }]}
          >
            {eyebrow}
          </Text>
          <Text className={`mt-1 ${isActive ? 'text-white' : 'text-forest'}`} style={AppTypography.displayCardMd}>
            {program.name}
          </Text>
          <Text
            className={`mt-1.5 ${isActive ? 'text-white/65' : 'text-forest/55'}`}
            style={AppTypography.meta}
          >
            {body}
          </Text>
        </View>
        {trailingAccessory ? <View className="shrink-0">{trailingAccessory}</View> : null}
      </View>
    </View>
  );
}

function QueueReviewCard({
  activeProgramName,
  index,
  isDraggingDisabled,
  onDragEnd,
  onDragStart,
  onMeasure,
  program,
  record,
}: {
  activeProgramName?: string;
  index: number;
  isDraggingDisabled: boolean;
  onDragEnd: (drag: { absoluteY: number; translationY: number }) => void;
  onDragStart: (absoluteY: number) => void;
  onMeasure: (layout: QueueItemLayout) => void;
  program: ProgramContent;
  record: OwnedProgramRecord;
}) {
  const dragY = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);
  const isDeferred = isDeferredQueuedProgramRecord(record);
  const dayLabel = Math.max(record.currentDay ?? 1, 1);
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
        elevation: isDragging ? 8 : 0,
        shadowColor: '#06290C',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: isDragging ? 0.06 : 0,
        shadowRadius: 24,
      }}
    >
      <ProgramSummaryCard
        body={
          isDeferred
            ? `Progress is saved at Day ${dayLabel}. It resumes from there after ${activeProgramName ?? 'your current journey'} ends.`
            : `This will be offered after ${activeProgramName ?? 'your current journey'} ends.`
        }
        eyebrow={isDeferred ? `Paused at Day ${dayLabel}` : index === 0 ? 'Queued next' : 'Queued'}
        program={program}
        rankLabel={String(index + 1).padStart(2, '0')}
        tone={isDeferred || index === 0 ? 'deferred' : 'default'}
        trailingAccessory={
          <View
            {...panResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel={`Drag ${program.name} to reorder queue priority`}
            className={`h-11 w-11 rounded-full items-center justify-center border ${
              isDraggingDisabled
                ? 'border-forest/5 bg-white/50'
                : isDragging
                  ? 'border-forest/15 bg-white'
                  : 'border-forest/10 bg-white'
            }`}
          >
            <Ionicons
              name="reorder-three-outline"
              size={24}
              color={isDraggingDisabled ? 'rgba(6,41,12,0.25)' : 'rgba(6,41,12,0.72)'}
            />
          </View>
        }
      />
    </Animated.View>
  );
}

export default function ProgramQueueReviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { access, reorderOwnedProgramQueue } = useProfile();
  const { programs, isLoading: isProgramsLoading } = usePrograms();
  const {
    activeProgram,
    isLoading,
    queuedPrograms,
    shouldReviewQueue,
  } = useProgramQueueReviewStatus();
  const [queueOrderOverride, setQueueOrderOverride] = useState<ProgramSlug[] | null>(null);
  const [queueItemLayouts, setQueueItemLayouts] = useState<Record<string, QueueItemLayout>>({});
  const [isDraggingQueue, setIsDraggingQueue] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queueListRef = useRef<React.ElementRef<typeof View> | null>(null);
  const queueListPageYRef = useRef<number | null>(null);
  const dragTouchOffsetRef = useRef<number | null>(null);
  const userId = user?.id ?? null;
  const programBySlug = useMemo(
    () => new Map(programs.map((program) => [program.slug, program])),
    [programs]
  );
  const activeProgramContent = activeProgram
    ? programBySlug.get(activeProgram.slug) ?? null
    : null;
  const activeProgramName = activeProgramContent?.name;
  const displayedQueuedRecords = useMemo(() => {
    if (!queueOrderOverride) {
      return queuedPrograms;
    }

    const currentSlugs = queuedPrograms.map((program) => program.slug).sort();
    const overrideSlugs = [...queueOrderOverride].sort();
    const canUseOverride =
      currentSlugs.length === overrideSlugs.length &&
      currentSlugs.every((slug, index) => slug === overrideSlugs[index]);

    if (!canUseOverride) {
      return queuedPrograms;
    }

    const recordBySlug = new Map(queuedPrograms.map((program) => [program.slug, program]));
    return queueOrderOverride
      .map((slug) => recordBySlug.get(slug))
      .filter((record): record is OwnedProgramRecord => Boolean(record));
  }, [queueOrderOverride, queuedPrograms]);

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
    (programSlug: ProgramSlug, drag: { absoluteY: number; translationY: number }) => {
      const orderedSlugs = displayedQueuedRecords.map((program) => program.slug);
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
      setQueueOrderOverride(reorderProgramQueue(orderedSlugs, currentIndex, targetIndex));
    },
    [displayedQueuedRecords, queueItemLayouts]
  );

  const acknowledgeQueueReview = useCallback(async () => {
    if (!userId) {
      throw new Error('Session required.');
    }

    const activeProgramForPreference =
      activeProgram?.slug ?? access.ownedProgram ?? displayedQueuedRecords[0]?.slug;

    if (!activeProgramForPreference) {
      throw new Error('No active program found.');
    }

    const { error } = await supabase.rpc('acknowledge_program_queue_review', {
      p_active_program: activeProgramForPreference,
    });

    if (error) {
      throw error;
    }
  }, [access.ownedProgram, activeProgram?.slug, displayedQueuedRecords, userId]);

  const handleSaveQueue = useCallback(async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const queueSlugs = displayedQueuedRecords.map((program) => program.slug);
      if (queueSlugs.length > 1) {
        await reorderOwnedProgramQueue(queueSlugs);
      }

      await acknowledgeQueueReview();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PROGRAM_QUEUE_REVIEW_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT }),
      ]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.replace(MY_PROGRAMS_ROUTE);
    } catch (error: any) {
      Alert.alert('Could not save queue', error?.message ?? 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [acknowledgeQueueReview, displayedQueuedRecords, isSaving, queryClient, reorderOwnedProgramQueue, router]);

  if (isLoading || isProgramsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color={AppColors.forest} />
      </View>
    );
  }

  if (!shouldReviewQueue) {
    return <Redirect href={HOME_ROUTE} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerClassName="px-6 pt-6 pb-32"
        scrollEnabled={!isDraggingQueue}
      >
        <View className="mb-8">
          <Text className="uppercase text-forest/45" style={[AppTypography.eyebrow, { letterSpacing: 2.2 }]}>
            Program queue
          </Text>
          <Text className="mt-4 text-forest" style={AppTypography.displayHero}>
            Your journeys are saved.
          </Text>
          <Text className="text-forest/58 mt-3 leading-relaxed" style={AppTypography.body}>
            Your extra active programs have been paused. They will resume in the order below after your current journey.
          </Text>
        </View>

        {activeProgramContent ? (
          <View className="mb-7">
            <Text className="uppercase text-forest/45 mb-3" style={[AppTypography.eyebrow, { letterSpacing: 1.9 }]}>
              Current journey
            </Text>
            <ProgramSummaryCard
              body="This stays active on Home, Program, reminders, and today's flow."
              eyebrow="Active now"
              program={activeProgramContent}
              tone="active"
            />
          </View>
        ) : null}

        <View>
          <Text className="uppercase text-forest/45 mb-3" style={[AppTypography.eyebrow, { letterSpacing: 1.9 }]}>
            Resume order
          </Text>
          <View
            ref={queueListRef}
            className="gap-3"
            onLayout={() => measureQueueList()}
          >
            {displayedQueuedRecords.map((record, index) => {
              const program = programBySlug.get(record.slug);
              if (!program) return null;

              return (
                <QueueReviewCard
                  key={record.slug}
                  activeProgramName={activeProgramName}
                  index={index}
                  isDraggingDisabled={displayedQueuedRecords.length < 2 || isSaving}
                  onDragStart={(absoluteY) => handleStartQueuedProgramDrag(record.slug, absoluteY)}
                  onDragEnd={(drag) => handleDropQueuedProgram(record.slug, drag)}
                  onMeasure={(layout) =>
                    setQueueItemLayouts((current) =>
                      current[record.slug]?.height === layout.height &&
                      current[record.slug]?.y === layout.y
                        ? current
                        : { ...current, [record.slug]: layout }
                    )
                  }
                  program={program}
                  record={record}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-surface/95 px-6 pt-4 pb-8 border-t border-forest/5">
        <Pressable
          disabled={isSaving}
          onPress={() => void handleSaveQueue()}
          className={`h-[58px] rounded-full items-center justify-center ${isSaving ? 'bg-forest/55' : 'bg-forest'}`}
          accessibilityRole="button"
        >
          <Text className="text-white" style={AppTypography.buttonLg}>
            {isSaving ? 'Saving...' : 'Save queue'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
