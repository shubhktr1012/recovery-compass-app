import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View, StyleSheet, Platform } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useProgramAudioPlayback } from '@/components/program/ProgramAudioPlayer';
import {
  getProgramReflection,
  upsertProgramReflection,
} from '@/lib/api/program-reflections';
import { getAudioThresholds } from '@/lib/card-resolver';
import {
  parseChecklistProgress,
  serializeChecklistProgress,
} from '@/lib/checklist-progress';
import {
  parseRoutineProgress,
  serializeRoutineProgress,
  type RoutineEffortLevel,
} from '@/lib/routine-progress';
import {
  getBreathingPhaseState,
  getBreathingTotalDuration,
  type BreathingPhase,
} from '@/lib/card-timers';
import { MotionDurations, MotionEasing } from '@/lib/motion/tokens';
import type { ProgramReflectionIdentity } from '@/lib/api/program-reflections';

import type {
  ActionStepCard,
  AudioCard,
  CalmTriggerCard,
  CloseCard,
  ContentCard,
  ExerciseRoutineCard,
  IntroCard,
  JournalCard,
  LessonCard,
  MindfulnessExerciseCard,
  BreathingExerciseCard,
} from '@/types/content';
import type { DayState } from '@/types/resolver';

export type TransportConfig = {
  centerIcon?: React.ReactNode;
  centerLabel?: string;
  onCenterPress?: () => void;
  disabled?: boolean;
};

export const TransportContext = React.createContext<{
  registerConfig: (index: number, config: TransportConfig) => void;
}>({
  registerConfig: () => {},
});

function SafetySheet({
  visible,
  title,
  points,
  onClose,
}: {
  visible: boolean;
  title: string;
  points: string[];
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.safetySheetOverlay}>
        <Pressable style={styles.safetySheetBackdrop} onPress={onClose} />
        <View style={styles.safetySheetCard}>
          <View style={styles.safetySheetHandle} />
          
          <View style={styles.safetySheetIconWrap}>
            <Ionicons name="warning" size={24} color="#B93A2B" />
          </View>
          
          <Text style={styles.safetySheetTitle}>{title}</Text>
          
          <Text style={styles.safetySheetSubtitle}>
            Please read the following guidelines to ensure a safe and effective session.
          </Text>

          <View style={styles.safetySheetBody}>
            {points.map((point, index) => (
              <View
                key={`${point}-${index}`}
                style={styles.safetySheetItem}
              >
                <View style={styles.safetySheetDot} />
                <Text style={styles.safetySheetText}>{point}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={onClose} style={styles.safetySheetButton}>
            <Text style={styles.safetySheetButtonText}>I understand</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FadingScrollView({
  children,
  contentContainerStyle,
  fadeColors = ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
}: {
  children: React.ReactNode;
  contentContainerStyle?: any;
  fadeColors?: [string, string];
}) {
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const isScrollable = contentHeight > scrollViewHeight + 5;
  const bounceValue = useSharedValue(0);

  React.useEffect(() => {
    bounceValue.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1 // infinite
    );
  }, [bounceValue]);

  const bounceStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bounceValue.value }],
    };
  });

  return (
    <View style={styles.scrollWrapper}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
          const distanceToBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
          if (distanceToBottom <= 20) {
            if (!isAtBottom) setIsAtBottom(true);
          } else {
            if (isAtBottom) setIsAtBottom(false);
          }
        }}
        scrollEventThrottle={16}
        onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        {children}
      </ScrollView>

      {isScrollable && (
        <LinearGradient
          colors={fadeColors}
          pointerEvents="none"
          style={styles.fadeMask}
        />
      )}

      {isScrollable ? (
        <View
          pointerEvents="box-none"
          style={styles.fabContainer}
        >
          <Animated.View
            entering={FadeInDown.delay(220).duration(MotionDurations.screen).easing(MotionEasing.standard)}
          >
            <Animated.View style={!isAtBottom ? bounceStyle : undefined}>
              <Pressable
                onPress={() => {
                  if (isAtBottom) {
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                  } else {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }
                }}
                style={styles.fabShadow}
              >
                <BlurView
                  intensity={80}
                  tint="light"
                  style={styles.fabBlur}
                >
                  <Ionicons name={isAtBottom ? "arrow-up" : "arrow-down"} size={16} color="rgba(5, 41, 12, 0.7)" />
                </BlurView>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD SHELLS
// All cards: borderRadius 28, shadow, optional PaperGrain texture
// showGrain prop allows A/B comparison of texture on/off
// ─────────────────────────────────────────────────────────────────────────────

function CardShell({
  children,
  eyebrow,
  title,
  scrollable = false,
  showGrain = false,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  scrollable?: boolean;
  showGrain?: boolean;
}) {
  const content = (
    <>
      {eyebrow ? (
        <Text style={styles.eyebrowLight}>
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <Text style={styles.titleLight}>{title}</Text>
      ) : null}
      {children}
    </>
  );

  return (
    <View style={[styles.cardShell, styles.cardShellContinuous, styles.cardShadow]}>
      {scrollable ? (
        <FadingScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {content}
        </FadingScrollView>
      ) : (
        content
      )}
    </View>
  );
}

function AccentCardShell({
  children,
  eyebrow,
  title,
  scrollable = false,
  showGrain = false,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  scrollable?: boolean;
  showGrain?: boolean;
}) {
  const content = (
    <>
      {eyebrow ? (
        <Text style={styles.eyebrowLight}>
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <Text style={styles.titleAccent}>
          {title}
        </Text>
      ) : null}
      {children}
    </>
  );

  return (
    <View style={[styles.accentCardShell, styles.cardShellContinuous, styles.cardShadow]}>
      {scrollable ? (
        <FadingScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          fadeColors={['rgba(227,242,229,0)', '#E3F2E5']}
        >
          {content}
        </FadingScrollView>
      ) : (
        content
      )}
    </View>
  );
}

function DarkCardShell({
  children,
  eyebrow,
  title,
  scrollable = false,
  showGrain = false,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  scrollable?: boolean;
  showGrain?: boolean;
}) {
  const content = (
    <>
      {eyebrow ? (
        <Text style={styles.eyebrowDark}>
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <Text style={styles.titleDark}>{title}</Text>
      ) : null}
      {children}
    </>
  );

  return (
    <View style={[styles.darkCardShell, styles.cardShellContinuous, styles.cardShadow]}>
      {scrollable ? (
        <FadingScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          fadeColors={['rgba(6,41,12,0)', '#06290C']}
        >
          {content}
        </FadingScrollView>
      ) : (
        content
      )}
    </View>
  );
}

function PrimaryVisualButton({
  label,
  inverted = false,
  onPress,
  disabled = false,
}: {
  label: string;
  inverted?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <View
      style={[
        inverted ? styles.primaryButtonLight : styles.primaryButtonDark,
        disabled && styles.primaryButtonDisabled,
      ]}
    >
      <Text
        style={inverted ? styles.primaryButtonTextLight : styles.primaryButtonTextDark}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress || disabled) {
    return content;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

function GhostVisualButton({ label, onPress }: { label: string; onPress?: () => void }) {
  const content = (
    <View style={styles.ghostButton}>
      <Text style={styles.ghostButtonText}>{label}</Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

function DotList({
  items,
  textStyle,
  itemStyle,
}: {
  items: string[];
  textStyle?: any;
  itemStyle?: any;
}) {
  return (
    <View>
      {items.map((item, index) => (
        <View
          key={`${item}-${index}`}
          style={[
            styles.dotListItem,
            index < items.length - 1 && styles.dotListBorder,
            itemStyle
          ]}
        >
          <View style={styles.dotBullet} />
          <Text style={[styles.dotText, textStyle]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTRO CARD v2 — White canvas, editorial layout
// Matches rc_day_view_v2_refined.html spec
// ─────────────────────────────────────────────────────────────────────────────
function IntroCardView({ card, programName, totalCards }: { card: IntroCard; programName?: string; totalCards?: number; }) {
  const cardCount = totalCards ?? 0;
  // Format day number with leading zero for the ghost watermark
  const dayFormatted = String(card.dayNumber).padStart(2, '0');

  // Convert new `parameters` object (Age Reversal Program format) → { value, label }[]
  const paramsFromObject: { value: string; label: string }[] = [];
  if (card.parameters) {
    const p = card.parameters;
    if (p.sets != null) paramsFromObject.push({ value: String(p.sets), label: 'Sets' });
    if (p.reps != null) paramsFromObject.push({ value: String(p.reps), label: 'Reps' });
    if (p.holdSeconds != null) paramsFromObject.push({ value: `${p.holdSeconds}s`, label: 'Hold' });
    if (p.durationMinutes != null) paramsFromObject.push({ value: `${p.durationMinutes}`, label: 'Minutes' });
  }

  // Priority: explicit params > converted parameters object > fallback
  const params =
    card.params ??
    (paramsFromObject.length > 0
      ? paramsFromObject
      : [
          ...(card.estimatedMinutes ? [{ value: String(card.estimatedMinutes), label: 'Minutes' }] : []),
          ...(cardCount > 0 ? [{ value: String(cardCount), label: 'Cards' }] : []),
        ]);

  return (
    <View style={styles.introCard}>
      {/* ── Accent gradient bar ── */}
      <LinearGradient
        colors={['#E3F3E5', 'rgba(6,41,12,0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.introAccentBar}
      />

      <FadingScrollView contentContainerStyle={styles.introScrollContent}>
        {/* ── Top row: phase pill + duration ── */}
        <View style={styles.introTopRow}>
          <View style={styles.introPhasePill}>
            <View style={styles.introPhaseDot} />
            <Text style={styles.introPhasePillText}>
              {card.phase ?? programName ?? 'Today'}
            </Text>
          </View>
          {card.estimatedMinutes ? (
            <Text style={styles.introDurationText}>~{card.estimatedMinutes} min</Text>
          ) : null}
        </View>

        {/* ── Hero zone ── */}
        <View style={styles.introHero}>
          {/* Ghost day number — huge, nearly invisible watermark */}
          <Text style={styles.introGhostDay}>{dayFormatted}</Text>

          {/* Serif title — overlaps the ghost number */}
          <Text style={styles.introTitle}>{card.dayTitle}</Text>

          {/* Goal text — muted, flexible */}
          <Text style={styles.introGoal}>{card.goal}</Text>

          {/* ── Parameter boxes ── */}
          {params.length > 0 ? (
            <View style={styles.introParamsRow}>
              {params.map((p, i) => (
                <View key={`${p.label}-${i}`} style={styles.introParamBox}>
                  <Text style={styles.introParamValue}>{p.value}</Text>
                  <Text style={styles.introParamLabel}>{p.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </FadingScrollView>
    </View>
  );
}

function LessonCardView({ card, cardIndex: _cardIndex }: { card: LessonCard; cardIndex?: number; }) {
  // Transport context registration is optional here as the default transport bar ("CONTINUE" / next page) is perfectly fine.
  
  return (
    <View style={[styles.lessonCardShell, styles.cardShadow]}>
      <FadingScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={styles.lessonEye}>Knowledge</Text>

        <Text style={styles.lessonTitle}>
          {card.title ?? 'Why This Works'}
        </Text>

        <View style={styles.lessonBody}>
          {card.paragraphs.map((paragraph, index) => {
            const isDuplicate = card.highlight && paragraph.trim() === card.highlight.trim();

            return (
              <React.Fragment key={`${paragraph}-${index}`}>
                {!isDuplicate ? (
                  <Text style={styles.lessonParagraph}>
                    {paragraph}
                  </Text>
                ) : null}

                {card.highlight && index === 1 ? (
                  <View style={styles.lessonPullQuoteItem}>
                    <Text style={styles.lessonPullQuoteText}>
                      {card.highlight}
                    </Text>
                  </View>
                ) : null}
              </React.Fragment>
            );
          })}

          {card.highlight && card.paragraphs.length <= 1 ? (
            <View style={styles.lessonPullQuoteItem}>
              <Text style={styles.lessonPullQuoteText}>
                {card.highlight}
              </Text>
            </View>
          ) : null}

          {/* Pull quote — Age Reversal Program editorial callout */}
          {card.pullQuote ? (
            <View style={styles.lessonPullQuoteItem}>
              <Text style={styles.lessonPullQuoteText}>{card.pullQuote}</Text>
            </View>
          ) : null}
        </View>
      </FadingScrollView>
    </View>
  );
}

function getChecklistItemKey(label: string, index: number) {
  return `${label}-${index}`;
}

function ActionStepCardView({
  card,
  cardIndex,
  checklistStorageKey,
  isReadOnly = false,
  onContinue,
}: {
  card: ActionStepCard;
  cardIndex?: number;
  checklistStorageKey?: string;
  isReadOnly?: boolean;
  onContinue?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Set<string>>(new Set());
  const [hasChecklistRestored, setHasChecklistRestored] = useState(false);
  const { registerConfig } = useContext(TransportContext);
  const checklistItems = card.checklistItems ?? [];
  const isChecklist = card.variant === 'checklist' || checklistItems.length > 0;

  // Checklist cards are reflective: ticking items is optional and never blocks progress.
  useEffect(() => {
    if (cardIndex == null) return;

    registerConfig(cardIndex, {
      centerIcon: (
        <Ionicons
          name={isDone ? 'checkmark-circle' : 'checkmark'}
          size={28}
          color={isDone ? '#16a34a' : '#06290C'}
        />
      ),
      centerLabel: isDone ? 'DONE ✓' : isChecklist ? 'CONTINUE' : 'MARK DONE',
      onCenterPress: () => {
        if (isDone) {
          onContinue?.();
          return;
        }
        setIsDone(true);
        // Auto-advance after a brief visual confirmation
        setTimeout(() => {
          onContinue?.();
        }, 600);
      },
    });
  }, [cardIndex, isChecklist, isDone, onContinue, registerConfig]);

  useEffect(() => {
    if (!isChecklist) {
      return;
    }

    let isCancelled = false;

    const restoreProgress = async () => {
      if (!checklistStorageKey) {
        if (!isCancelled) {
          setCheckedChecklistItems(new Set());
          setHasChecklistRestored(true);
        }
        return;
      }

      try {
        const rawValue = await AsyncStorage.getItem(checklistStorageKey);
        if (isCancelled) return;

        const progressRecord = parseChecklistProgress(rawValue);
        setCheckedChecklistItems(new Set(progressRecord.checkedItems));
      } catch (error) {
        console.error('Failed to restore checklist progress', error);
        if (!isCancelled) {
          setCheckedChecklistItems(new Set());
        }
      } finally {
        if (!isCancelled) {
          setHasChecklistRestored(true);
        }
      }
    };

    void restoreProgress();

    return () => {
      isCancelled = true;
    };
  }, [checklistStorageKey, isChecklist]);

  useEffect(() => {
    if (!isChecklist || !hasChecklistRestored || !checklistStorageKey || isReadOnly) {
      return;
    }

    const persistProgress = async () => {
      try {
        await AsyncStorage.setItem(
          checklistStorageKey,
          serializeChecklistProgress({
            checkedItems: Array.from(checkedChecklistItems),
          })
        );
      } catch (error) {
        console.error('Failed to persist checklist progress', error);
      }
    };

    void persistProgress();
  }, [checkedChecklistItems, checklistStorageKey, hasChecklistRestored, isChecklist, isReadOnly]);

  const toggleChecklistItem = (id: string) => {
    if (isReadOnly) {
      return;
    }

    setCheckedChecklistItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Support both legacy stepNumber and new stepLabel format
  const eyebrowText = card.stepLabel ?? (card.stepNumber != null ? `Action Step ${card.stepNumber}` : 'Action Step');

  return (
    <CardShell
      scrollable
      eyebrow={eyebrowText}
      title={card.title}
    >
      <View style={styles.actionBody}>
        {/* Age Reversal Program subtitle */}
        {card.subtitle ? (
          <Text style={styles.actionSubtitle}>{card.subtitle}</Text>
        ) : null}

        {card.duration ? (
          <View style={styles.actionDurationPill}>
            <Ionicons name="time-outline" size={14} color="rgba(6, 41, 12, 0.4)" />
            <Text style={styles.actionDurationText}>{card.duration}</Text>
          </View>
        ) : null}

        {isChecklist ? (
          <View style={styles.routineList}>
            {checklistItems.map((item, index) => {
              const itemId = getChecklistItemKey(item, index);
              const isChecked = checkedChecklistItems.has(itemId);

              return (
                <Pressable
                  key={itemId}
                  onPress={() => toggleChecklistItem(itemId)}
                  disabled={isReadOnly}
                  style={[
                    styles.checklistItem,
                    index < checklistItems.length - 1 && styles.routineItemBorder,
                    isReadOnly && { opacity: isChecked ? 0.55 : 1 },
                  ]}
                >
                  <View style={[
                    styles.routineItemCheckbox,
                    isChecked && styles.routineItemCheckboxChecked,
                  ]}>
                    {isChecked ? <Ionicons name="checkmark" size={10} color="white" /> : null}
                  </View>
                  <Text style={[
                    styles.checklistItemText,
                    isChecked && styles.routineItemTitleCompleted,
                  ]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}

            {card.checklistQuote ? (
              <View style={styles.checklistQuoteContainer}>
                <Text style={styles.checklistQuoteText}>{card.checklistQuote}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <DotList items={card.instructions ?? []} textStyle={{ color: '#374151', fontSize: 16, lineHeight: 26 }} />
        )}

        {/* Age Reversal Program purpose callout */}
        {card.purpose ? (
          <View style={styles.actionPurposeContainer}>
            <Text style={styles.actionPurposeLabel}>Why this step</Text>
            <Text style={styles.actionPurposeText}>{card.purpose}</Text>
          </View>
        ) : null}

        {card.whyThisWorks ? (
          <Animated.View
            layout={LinearTransition.duration(MotionDurations.fast).easing(MotionEasing.standard)}
          >
            <View style={styles.whyWorksContainer}>
              <Pressable
                style={styles.whyWorksHeader}
                onPress={() => setIsExpanded((value) => !value)}
              >
                <Text style={styles.whyWorksHeaderText}>Why this works</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="rgba(5, 41, 12, 0.5)"
                />
              </Pressable>

              {isExpanded ? (
                <Animated.View
                  entering={FadeInDown.duration(MotionDurations.base).easing(MotionEasing.standard)}
                  exiting={FadeOut.duration(140)}
                  style={styles.whyWorksBody}
                >
                  <Text style={styles.whyWorksText}>{card.whyThisWorks}</Text>
                </Animated.View>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {card.proTip ? (
          <View style={styles.proTipContainer}>
            <Text style={styles.proTipIcon}>✦</Text>
            <Text style={styles.proTipText}>
              {card.proTip}
            </Text>
          </View>
        ) : null}
      </View>
    </CardShell>
  );
}

function MindfulExerciseCardView({
  card,
  cardIndex,
  onContinue,
  isReadOnly = false,
}: {
  card: MindfulnessExerciseCard | BreathingExerciseCard;
  cardIndex?: number;
  onContinue?: () => void;
  isReadOnly?: boolean;
}) {
  const [isMindfulBegun, setIsMindfulBegun] = useState(false);
  const [breathingState, setBreathingState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [, setBreathingCompletionMode] = useState<'manual' | 'timer' | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.15);
  const { registerConfig } = useContext(TransportContext);
  const isBreathing = card.type === 'breathing_exercise';
  const breathingPattern = card.type === 'breathing_exercise' ? card.pattern : undefined;
  const cycles = card.type === 'breathing_exercise' ? card.cycles : undefined;
  const breathingInstructions = card.type === 'breathing_exercise' ? card.instructions : undefined;
  const duration = card.type === 'mindfulness_exercise' ? card.duration : undefined;
  const steps = card.type === 'mindfulness_exercise' ? card.steps : undefined;
  const subtitle = card.type === 'mindfulness_exercise' ? card.subtitle : undefined;
  const benefits = card.type === 'mindfulness_exercise' ? card.benefits : undefined;
  const totalBreathingSeconds = useMemo(
    () =>
      isBreathing && breathingPattern
        ? getBreathingTotalDuration(breathingPattern, cycles ?? 0)
        : 0,
    [breathingPattern, cycles, isBreathing]
  );
  const breathingPhaseState = useMemo(
    () =>
      isBreathing && breathingPattern
        ? getBreathingPhaseState(breathingPattern, cycles ?? 0, elapsedSeconds)
        : null,
    [breathingPattern, cycles, elapsedSeconds, isBreathing]
  );
  const breathingPatternLabel = useMemo(
    () => (breathingPattern ? describeBreathingPattern(breathingPattern) : null),
    [breathingPattern]
  );

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const settleBreathingAnimation = useCallback((completed: boolean) => {
    cancelAnimation(scale);
    cancelAnimation(opacity);
    scale.value = withTiming(1, { duration: 220 });
    opacity.value = withTiming(completed ? 0.26 : 0.15, { duration: 220 });
  }, [opacity, scale]);

  const resetBreathing = useCallback(() => {
    setElapsedSeconds(0);
    setBreathingCompletionMode(null);
    setBreathingState('idle');
    settleBreathingAnimation(false);
  }, [settleBreathingAnimation]);

  const startBreathing = useCallback(() => {
    if (!isBreathing || !breathingPattern || totalBreathingSeconds <= 0) {
      return;
    }

    setElapsedSeconds(0);
    setBreathingCompletionMode(null);
    setBreathingState('running');
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: breathingPattern.inhaleSeconds * 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.6, { duration: (breathingPattern.holdSeconds ?? 0) * 1000 }),
        withTiming(1, { duration: breathingPattern.exhaleSeconds * 1000, easing: Easing.inOut(Easing.quad) })
      ),
      cycles ?? 1,
      false
    );
    opacity.value = withTiming(0.4, { duration: 1000 });
  }, [breathingPattern, cycles, isBreathing, opacity, scale, totalBreathingSeconds]);

  const completeBreathing = useCallback((mode: 'manual' | 'timer') => {
    setElapsedSeconds(totalBreathingSeconds);
    setBreathingCompletionMode(mode);
    setBreathingState('completed');
    settleBreathingAnimation(true);
  }, [settleBreathingAnimation, totalBreathingSeconds]);

  useEffect(() => {
    if (!isBreathing || breathingState !== 'running') {
      return;
    }

    const startedAt = Date.now();
    const intervalId = setInterval(() => {
      const nextElapsedSeconds = Math.min(
        (Date.now() - startedAt) / 1000,
        totalBreathingSeconds
      );

      setElapsedSeconds(nextElapsedSeconds);

      if (nextElapsedSeconds >= totalBreathingSeconds) {
        clearInterval(intervalId);
        completeBreathing('timer');
      }
    }, 250);

    return () => {
      clearInterval(intervalId);
    };
  }, [breathingState, completeBreathing, isBreathing, totalBreathingSeconds]);

  useEffect(() => {
    if (cardIndex == null) return;

    if (isReadOnly) {
      registerConfig(cardIndex, {
        centerIcon: <Ionicons name="eye-outline" size={28} color="#06290C" />,
        centerLabel: 'REVIEW',
        disabled: true,
      });
      return;
    }

    if (isBreathing) {
      registerConfig(cardIndex, {
        centerIcon: (
          <Ionicons
            name={
              breathingState === 'idle'
                ? 'leaf-outline'
                : breathingState === 'running'
                  ? 'checkmark'
                  : 'refresh'
            }
            size={28}
            color="#06290C"
          />
        ),
        centerLabel:
          breathingState === 'idle'
            ? 'BEGIN'
            : breathingState === 'running'
              ? 'MARK DONE'
              : 'START AGAIN',
        onCenterPress: () => {
          if (breathingState === 'idle') {
            startBreathing();
            return;
          }

          if (breathingState === 'running') {
            completeBreathing('manual');
            return;
          }

          resetBreathing();
        },
      });
      return;
    }

    registerConfig(cardIndex, {
      centerIcon: (
        <Ionicons
          name={isMindfulBegun ? 'checkmark' : 'leaf-outline'}
          size={28}
          color="#06290C"
        />
      ),
      centerLabel: isMindfulBegun ? 'CONTINUE' : 'BEGIN',
      onCenterPress: () => {
        if (isMindfulBegun) {
          onContinue?.();
        } else {
          setIsMindfulBegun(true);
        }
      },
    });
  }, [
    breathingState,
    cardIndex,
    completeBreathing,
    isReadOnly,
    isBreathing,
    isMindfulBegun,
    onContinue,
    registerConfig,
    resetBreathing,
    startBreathing,
  ]);

  return (
    <AccentCardShell
      eyebrow={isBreathing ? 'Breathwork' : duration ? `Mindful · ${duration}` : 'Grounding'}
      title={card.title}
      scrollable
    >
      {/* Age Reversal Program subtitle */}
      {subtitle ? (
        <Text style={styles.mindfulSubtitle}>{subtitle}</Text>
      ) : null}

      {/* Age Reversal Program benefit pills */}
      {benefits && benefits.length > 0 ? (
        <View style={styles.mindfulBenefitsRow}>
          {benefits.map((benefit, i) => (
            <View key={`benefit-${i}`} style={styles.mindfulBenefitPill}>
              <Text style={styles.mindfulBenefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        {isBreathing ? (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <View style={styles.breathingContainer}>
              <Animated.View style={[styles.breathingCircle, animatedCircleStyle]} />
              <View style={styles.breathingCore}>
                <Ionicons
                  name={breathingState === 'idle' ? 'water-outline' : 'medical-outline'}
                  size={32}
                  color="rgba(6, 41, 12, 0.4)"
                  style={{ marginBottom: 4 }}
                />
              </View>
            </View>

            {breathingState === 'idle' ? (
              <>
                <Text style={styles.breathingStatusText}>Begin guided breathing</Text>
                <Text style={styles.breathingSubtext}>
                  Press begin when you are ready. Follow the pattern for the full set of cycles.
                </Text>
                <View style={styles.breathingMetaRow}>
                  {cycles != null ? (
                    <View style={styles.breathingMetaPill}>
                      <Text style={styles.breathingMetaPillText}>{cycles} cycles</Text>
                    </View>
                  ) : null}
                </View>
                {breathingPatternLabel ? (
                  <Text style={styles.breathingPatternText}>{breathingPatternLabel}</Text>
                ) : null}
              </>
            ) : breathingState === 'running' && breathingPhaseState ? (
              <>
                <Text style={styles.breathingStatusText}>
                  {getBreathingPhaseLabel(breathingPhaseState.phase)}
                </Text>
                <Text style={styles.breathingSubtext}>
                  Cycle {breathingPhaseState.cycleNumber} of {cycles ?? 1}
                </Text>
                <View style={styles.breathingMetaRow}>
                  {breathingPattern ? (
                    <>
                      <View style={styles.breathingMetaPill}>
                        <Text style={styles.breathingMetaPillText}>{breathingPattern.inhaleSeconds}s inhale</Text>
                      </View>
                      {breathingPattern.holdSeconds ? (
                        <View style={styles.breathingMetaPill}>
                          <Text style={styles.breathingMetaPillText}>{breathingPattern.holdSeconds}s hold</Text>
                        </View>
                      ) : null}
                      <View style={styles.breathingMetaPill}>
                        <Text style={styles.breathingMetaPillText}>{breathingPattern.exhaleSeconds}s exhale</Text>
                      </View>
                    </>
                  ) : null}
                  <View style={styles.breathingMetaPill}>
                    <Text style={styles.breathingMetaPillText}>{getBreathingPhaseLabel(breathingPhaseState.phase)}</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.breathingCompleteBlock}>
                <Text style={styles.breathingStatusText}>Round complete</Text>
                <Text style={styles.breathingSubtext}>Repeat it or continue.</Text>
                <View style={styles.breathingMetaRow}>
                  {cycles != null ? (
                    <View style={styles.breathingMetaPill}>
                      <Text style={styles.breathingMetaPillText}>{cycles} cycles</Text>
                    </View>
                  ) : null}
                </View>
                {isReadOnly ? (
                  <Text style={styles.breathingInstructions}>This past day is now in review mode.</Text>
                ) : (
                  <View style={styles.breathingActionRow}>
                    <GhostVisualButton label="Repeat" onPress={resetBreathing} />
                    <PrimaryVisualButton label="Continue" onPress={onContinue} />
                  </View>
                )}
              </View>
            )}

            {breathingInstructions ? (
              <Text style={styles.breathingInstructions}>{breathingInstructions}</Text>
            ) : null}
          </View>
        ) : (
          <View style={{ width: '100%' }}>
            {steps?.map((step, index) => (
              <View
                key={`${step}-${index}`}
                style={[
                  styles.mindfulnessStep,
                  index < (steps?.length ?? 0) - 1 && styles.mindfulnessStepBorder
                ]}
              >
                <View style={styles.mindfulnessStepDot} />
                <Text style={styles.mindfulnessStepText}>{step}</Text>
              </View>
            ))}
            {card.completionMessage ? (
              <Text style={styles.mindfulnessSmallText}>
                {card.completionMessage}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </AccentCardShell>
  );
}

function ExerciseRoutineCardView({
  card,
  cardIndex,
  onContinue,
  routineStorageKey,
  hasEffortCheck = false,
  isReadOnly = false,
  onProgressChange,
}: {
  card: ExerciseRoutineCard;
  cardIndex?: number;
  onContinue?: () => void;
  routineStorageKey?: string;
  hasEffortCheck?: boolean;
  isReadOnly?: boolean;
  onProgressChange?: () => void;
}) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [effortLevel, setEffortLevel] = useState<RoutineEffortLevel | null>(null);
  const [hasRestored, setHasRestored] = useState(false);
  const [showSafetySheet, setShowSafetySheet] = useState(false);
  const { registerConfig } = useContext(TransportContext);

  // ── Detect format ──────────────────────────────────────────────────────────
  // Age Reversal Program format: single exercise with `name` + `steps` at top level
  const isAgeReversalFormat = Boolean(card.name && Array.isArray(card.steps));
  const routineItems = isAgeReversalFormat ? [] : (card.exercises ?? []);

  // Count total items for progress tracking
  const totalItems = isAgeReversalFormat ? 1 : routineItems.length;
  const completedCount = completedItems.size;
  const allDone = completedCount >= totalItems && totalItems > 0;
  const effortCheckApplicable = hasEffortCheck && isAgeReversalFormat;
  const effortSelectionRequired = effortCheckApplicable && allDone;
  const effortSelectionComplete = !effortSelectionRequired || effortLevel !== null;

  // Register transport config: shows completion progress
  useEffect(() => {
    if (cardIndex == null) return;

    if (isReadOnly) {
      registerConfig(cardIndex, {
        centerIcon: <Ionicons name="eye-outline" size={28} color="#06290C" />,
        centerLabel: 'REVIEW',
        disabled: true,
      });
      return;
    }

    registerConfig(cardIndex, {
      centerIcon: (
        <Ionicons
          name={
            allDone
              ? effortSelectionComplete
                ? 'checkmark-circle'
                : 'help-circle-outline'
              : 'checkmark'
          }
          size={28}
          color={allDone && effortSelectionComplete ? '#16a34a' : '#06290C'}
        />
      ),
      centerLabel:
        allDone
          ? effortSelectionRequired && !effortLevel
            ? 'CHOOSE EFFORT'
            : 'CONTINUE'
          : totalItems > 1
            ? `${completedCount}/${totalItems} DONE`
            : 'MARK DONE',
      onCenterPress: () => {
        if (allDone && effortSelectionComplete) {
          onContinue?.();
        }
      },
      disabled: !allDone || !effortSelectionComplete,
    });
  }, [
    allDone,
    cardIndex,
    completedCount,
    effortLevel,
    effortSelectionComplete,
    effortSelectionRequired,
    onContinue,
    isReadOnly,
    registerConfig,
    totalItems,
  ]);

  // For Age Reversal Program, the single item id is the card name
  const singleItemId = card.name ?? 'exercise';

  React.useEffect(() => {
    let isCancelled = false;

    const restoreProgress = async () => {
      if (!routineStorageKey) {
        if (!isCancelled) {
          setCompletedItems(new Set());
          setHasRestored(true);
        }
        return;
      }

      try {
        const rawValue = await AsyncStorage.getItem(routineStorageKey);
        if (isCancelled) return;

        if (!rawValue) {
          setCompletedItems(new Set());
          setEffortLevel(null);
          setHasRestored(true);
          return;
        }

        const progressRecord = parseRoutineProgress(rawValue);

        setCompletedItems(new Set(progressRecord.completedItems));
        setEffortLevel(progressRecord.effortLevel);
      } catch (error) {
        console.error('Failed to restore routine checklist progress', error);
        if (!isCancelled) {
          setCompletedItems(new Set());
          setEffortLevel(null);
        }
      } finally {
        if (!isCancelled) {
          setHasRestored(true);
        }
      }
    };

    void restoreProgress();

    return () => {
      isCancelled = true;
    };
  }, [routineStorageKey]);

  React.useEffect(() => {
    if (!hasRestored) {
      return;
    }

    const persistProgress = async () => {
      if (!routineStorageKey || isReadOnly) {
        onProgressChange?.();
        return;
      }

      try {
        await AsyncStorage.setItem(
          routineStorageKey,
          serializeRoutineProgress({
            completedItems: Array.from(completedItems),
            effortLevel,
          })
        );
      } catch (error) {
        console.error('Failed to persist routine checklist progress', error);
      } finally {
        onProgressChange?.();
      }
    };

    void persistProgress();
  }, [completedItems, effortLevel, hasRestored, isReadOnly, onProgressChange, routineStorageKey]);

  const toggleItem = (id: string) => {
    if (isReadOnly) {
      return;
    }

    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    setEffortLevel(null);
  };

  const renderEffortCheck = () => {
    if (!effortCheckApplicable || !allDone) {
      return null;
    }

    return (
      <View style={styles.effortCheckPanel}>
        <Text style={styles.effortCheckTitle}>How did this routine go?</Text>
        <Text style={styles.effortCheckHint}>
          Choose whether you completed the full prescribed volume or a shorter version.
        </Text>
        <View style={styles.effortCheckOptions}>
          <Pressable
            onPress={() => setEffortLevel('full')}
            style={[
              styles.effortCheckOption,
              effortLevel === 'full' && styles.effortCheckOptionSelected,
            ]}
          >
            <Text
              style={[
                styles.effortCheckOptionTitle,
                effortLevel === 'full' && styles.effortCheckOptionTitleSelected,
              ]}
            >
              Completed full routine
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setEffortLevel('shorter')}
            style={[
              styles.effortCheckOption,
              effortLevel === 'shorter' && styles.effortCheckOptionSelected,
            ]}
          >
            <Text
              style={[
                styles.effortCheckOptionTitle,
                effortLevel === 'shorter' && styles.effortCheckOptionTitleSelected,
              ]}
            >
              Did a shorter version
            </Text>
          </Pressable>
        </View>
        {effortLevel ? (
          <Text style={styles.effortCheckSavedText}>
            Saved for today&apos;s progress. You can change it before finishing the day.
          </Text>
        ) : (
          <Text style={styles.effortCheckSavedText}>
            Pick one to count this routine as complete.
          </Text>
        )}
      </View>
    );
  };

  // ── Age Reversal Program single-exercise render ────────────────────────────
  if (isAgeReversalFormat) {
    const isCompleted = completedItems.has(singleItemId);
    const steps = card.steps ?? [];
    const metricPills: string[] = [];
    if (card.sets != null) metricPills.push(`${card.sets} Sets`);
    if (card.reps != null) metricPills.push(`${card.reps} Reps`);
    if (card.holdSeconds != null) metricPills.push(`${card.holdSeconds}s Hold`);

    return (
      <CardShell
        eyebrow={card.category ?? 'Facial Exercise'}
        title={card.name ?? 'Exercise'}
        scrollable
      >
        <View style={styles.exerciseAgeReversalBody}>
          <SafetySheet
            visible={showSafetySheet}
            title="Before you begin"
            points={[
              'Stop immediately if you feel jaw clicking, headaches, skin irritation, dizziness, or any discomfort.',
              "Do not continue if you have had recent facial surgery, botox or fillers, Bell's palsy, TMJ disorder, or active skin conditions.",
            ]}
            onClose={() => setShowSafetySheet(false)}
          />

          <Pressable
            onPress={() => setShowSafetySheet(true)}
            style={({ pressed }) => [
              styles.safetyTriggerPill,
              pressed && styles.safetyTriggerPillPressed,
            ]}
          >
            <Ionicons name="warning-outline" size={12} color="rgba(6, 41, 12, 0.5)" />
            <Text style={styles.safetyTriggerText}>Safety guidance</Text>
          </Pressable>

          {/* Target muscle chip */}
          {card.targetMuscle ? (
            <View style={styles.exerciseMusclePill}>
              <Ionicons name="body-outline" size={12} color="rgba(6, 41, 12, 0.5)" />
              <Text style={styles.exerciseMusclePillText}>{card.targetMuscle}</Text>
            </View>
          ) : null}

          {/* Metric pills row */}
          {metricPills.length > 0 ? (
            <View style={styles.exerciseMetricsRow}>
              {metricPills.map((pill, i) => (
                <View key={`metric-${i}`} style={styles.exerciseMetricPill}>
                  <Text style={styles.exerciseMetricText}>{pill}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Numbered steps */}
          <View style={styles.exerciseStepsList}>
            {steps.map((step, index) => (
              <View
                key={`step-${index}`}
                style={[
                  styles.exerciseStep,
                  index < steps.length - 1 && styles.exerciseStepBorder,
                ]}
              >
                <View style={styles.exerciseStepNumber}>
                  <Text style={styles.exerciseStepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.exerciseStepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Science note */}
          {card.scienceNote ? (
            <View style={styles.exerciseScienceNote}>
              <Text style={styles.exerciseScienceNoteIcon}>⚗</Text>
              <Text style={styles.exerciseScienceNoteText}>{card.scienceNote}</Text>
            </View>
          ) : null}

          {/* Full-card Done button */}
          <Pressable
            onPress={() => toggleItem(singleItemId)}
            disabled={isReadOnly}
            style={[
              styles.exerciseDoneButton,
              isCompleted && styles.exerciseDoneButtonCompleted,
              isReadOnly && styles.exerciseDoneButtonReadOnly,
            ]}
          >
            {isCompleted ? (
              <Ionicons name="checkmark-circle" size={18} color="white" />
            ) : (
              <Ionicons name="ellipse-outline" size={18} color="rgba(6, 41, 12, 0.5)" />
            )}
            <Text style={[
              styles.exerciseDoneButtonText,
              isCompleted && styles.exerciseDoneButtonTextCompleted,
            ]}>
              {isCompleted ? 'Done!' : 'Mark as Complete'}
            </Text>
          </Pressable>

          {isReadOnly ? (
            <Text style={styles.reviewModeHint}>This past day is now in review mode.</Text>
          ) : renderEffortCheck()}
        </View>
      </CardShell>
    );
  }

  // ── Legacy multi-exercise render ───────────────────────────────────────────
  return (
    <CardShell
      eyebrow={`Routine${card.totalDuration ? ` · ${card.totalDuration}` : ''}`}
      title={card.title}
      scrollable
    >
      <View style={styles.routineList}>
        {routineItems.map((item, index) => {
          if (!item) return null;
          const itemId = `${item.name}-${index}`;
          const isCompleted = completedItems.has(itemId);
          const instructions = Array.isArray(item.instructions) ? item.instructions : [];
          const meta = [item.reps, item.duration, item.rest].filter(Boolean).join(' · ');

          return (
            <Pressable
              key={itemId}
              onPress={() => toggleItem(itemId)}
              disabled={isReadOnly}
              style={[
                styles.routineItem,
                index < routineItems.length - 1 && styles.routineItemBorder,
                isCompleted && { opacity: 0.5 },
                isReadOnly && { opacity: isCompleted ? 0.5 : 1 },
              ]}
            >
              <View style={styles.routineItemHeader}>
                <View style={[
                  styles.routineItemCheckbox,
                  isCompleted && styles.routineItemCheckboxChecked
                ]}>
                  {isCompleted && <Ionicons name="checkmark" size={10} color="white" />}
                </View>
                <Text style={[
                  styles.routineItemTitle,
                  isCompleted && styles.routineItemTitleCompleted
                ]}>
                  {item.name}
                </Text>
              </View>

              <View style={styles.routineItemBody}>
                {instructions.map((instruction, instructionIndex) => (
                  <Text
                    key={`${instruction}-${instructionIndex}`}
                    style={styles.routineItemDesc}
                  >
                    {instruction}
                  </Text>
                ))}
                {meta ? (
                  <View style={styles.routineItemMetaBox}>
                    <Text style={styles.routineItemMetaText}>{meta}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {isReadOnly ? (
        <Text style={styles.reviewModeHint}>This past day is now in review mode.</Text>
      ) : renderEffortCheck()}
    </CardShell>
  );
}

// ── Waveform bar configuration ─────────────────────────────────────────────
const WAVEFORM_BARS: { height: number; opacity: number }[] = [
  { height: 10, opacity: 0.08 },
  { height: 16, opacity: 0.12 },
  { height: 24, opacity: 0.16 },
  { height: 34, opacity: 0.24 },
  { height: 48, opacity: 0.34 },
  { height: 64, opacity: 0.48 },
  { height: 80, opacity: 0.64 },
  { height: 94, opacity: 0.82 },
  { height: 104, opacity: 1 },
  { height: 94, opacity: 0.82 },
  { height: 80, opacity: 0.64 },
  { height: 64, opacity: 0.48 },
  { height: 48, opacity: 0.34 },
  { height: 34, opacity: 0.24 },
  { height: 24, opacity: 0.16 },
  { height: 16, opacity: 0.12 },
  { height: 10, opacity: 0.08 },
];

function formatAudioTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getBreathingPhaseLabel(phase: BreathingPhase): string {
  switch (phase) {
    case 'inhale':
      return 'Inhale';
    case 'hold':
      return 'Hold';
    case 'exhale':
      return 'Exhale';
    default:
      return 'Breathe';
  }
}

function describeBreathingPattern(pattern: BreathingExerciseCard['pattern']): string {
  const parts = [`${pattern.inhaleSeconds}s inhale`];

  if (pattern.holdSeconds) {
    parts.push(`${pattern.holdSeconds}s hold`);
  }

  parts.push(`${pattern.exhaleSeconds}s exhale`);

  return parts.join(' · ');
}

function AudioCardView({
  card,
  cardIndex,
  isReadOnly = false,
  onAudioCompleted,
}: {
  card: AudioCard;
  cardIndex?: number;
  isReadOnly?: boolean;
  onAudioCompleted?: (payload: {
    audioStoragePath: string;
    cardIndex: number | null;
    completionMode: 'manual' | 'auto';
    listenSeconds: number;
    percentage: number;
    totalSeconds: number;
  }) => void;
}) {
  const { registerConfig } = useContext(TransportContext);
  const playback = useProgramAudioPlayback(card.audioStoragePath, card.durationSeconds, card.title);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const [scrubProgress, setScrubProgress] = useState<number | null>(null);
  const [completionMode, setCompletionMode] = useState<'manual' | 'auto' | null>(null);

  // Split the title for serif styling: last word italic, rest regular
  const titleParts = useMemo(() => {
    const words = card.title.split(' ');
    if (words.length <= 1) return { prefix: '', italic: card.title };
    return {
      prefix: words.slice(0, -1).join(' ') + ' ',
      italic: words[words.length - 1],
    };
  }, [card.title]);

  // Derive eyebrow from session type
  const eyebrowLabel = useMemo(() => {
    const lower = card.title.toLowerCase();
    if (lower.includes('calm') || lower.includes('nervous')) return 'Calm Session';
    if (lower.includes('sleep')) return 'Sleep Session';
    if (lower.includes('breathe') || lower.includes('breath')) return 'Breathwork';
    return 'Guided Audio Session';
  }, [card.title]);

  const clampProgress = useCallback((value: number) => {
    return Math.max(0, Math.min(1, value));
  }, []);

  const getProgressFromLocation = useCallback((locationX: number) => {
    if (progressTrackWidth <= 0) {
      return playback.progress;
    }

    return clampProgress(locationX / progressTrackWidth);
  }, [clampProgress, playback.progress, progressTrackWidth]);

  const previewScrubPosition = useCallback((locationX: number) => {
    if (playback.duration <= 0) return;
    setScrubProgress(getProgressFromLocation(locationX));
  }, [getProgressFromLocation, playback.duration]);

  const commitScrubPosition = useCallback((locationX: number) => {
    if (playback.duration <= 0) return;

    const nextProgress = getProgressFromLocation(locationX);
    setScrubProgress(nextProgress);
    playback.seekTo(playback.duration * nextProgress);
  }, [getProgressFromLocation, playback]);

  useEffect(() => {
    if (scrubProgress == null || playback.duration <= 0) return;

    const liveProgress = playback.progress;
    if (Math.abs(liveProgress - scrubProgress) < 0.02) {
      setScrubProgress(null);
    }
  }, [playback.duration, playback.progress, scrubProgress]);

  const displayedProgress = scrubProgress ?? playback.progress;
  const displayedCurrentTime =
    scrubProgress != null && playback.duration > 0
      ? playback.duration * scrubProgress
      : playback.currentTime;
  const thresholds = useMemo(
    () => (playback.duration > 0 ? getAudioThresholds(playback.duration) : null),
    [playback.duration]
  );
  const isCompleted = completionMode !== null;
  const canMarkDone = Boolean(
    thresholds && playback.currentTime >= thresholds.markAsDone
  );
  const markDoneUnlockLabel = useMemo(
    () => (thresholds ? formatAudioTime(thresholds.markAsDone) : null),
    [thresholds]
  );

  useEffect(() => {
    setCompletionMode(null);
  }, [card.audioStoragePath]);

  const completeAudio = useCallback(
    (mode: 'manual' | 'auto') => {
      setCompletionMode(mode);
      const totalSeconds = playback.duration > 0 ? playback.duration : card.durationSeconds;
      const listenSeconds = Math.max(0, playback.currentTime);
      const percentage = totalSeconds > 0 ? Math.min(1, listenSeconds / totalSeconds) : 0;

      onAudioCompleted?.({
        audioStoragePath: card.audioStoragePath,
        cardIndex: cardIndex ?? null,
        completionMode: mode,
        listenSeconds,
        percentage,
        totalSeconds,
      });
    },
    [card.audioStoragePath, card.durationSeconds, cardIndex, onAudioCompleted, playback.currentTime, playback.duration]
  );

  useEffect(() => {
    if (cardIndex == null) return;

    if (playback.isLoading) {
      registerConfig(cardIndex, {
        centerIcon: <ActivityIndicator color="#06290C" size="small" />,
        centerLabel: 'LOADING',
        disabled: true,
      });
    } else {
      registerConfig(cardIndex, {
        centerIcon: (
          <Ionicons
            name={playback.isPlaying ? 'pause' : 'play'}
            size={24}
            color="#06290C"
          />
        ),
        centerLabel: isReadOnly ? 'REVIEW' : playback.isPlaying ? 'PAUSE' : 'PLAY',
        onCenterPress: isReadOnly ? undefined : playback.togglePlayback,
        disabled: isReadOnly,
      });
    }
  }, [cardIndex, isReadOnly, playback.isPlaying, playback.isLoading, playback.togglePlayback, registerConfig]);

  useEffect(() => {
    if (!thresholds || isCompleted) {
      return;
    }

    if (playback.currentTime >= thresholds.autoComplete) {
      completeAudio('auto');
    }
  }, [completeAudio, isCompleted, playback.currentTime, thresholds]);

  return (
    <View style={[styles.darkCardShell, styles.cardShellContinuous, styles.cardShadow, audioStyles.container]}>
      {/* Botanical watermark — bottom-left, mirrored */}
      <View style={audioStyles.watermark} pointerEvents="none">
        <Svg width={180} height={180} viewBox="0 0 200 200" fill="none" style={{ transform: [{ scaleX: -1 }] }}>
          <SvgPath
            d="M100 10C100 10 165 55 165 105C165 148 135 182 100 192C65 182 35 148 35 105C35 55 100 10 100 10Z"
            fill="#E3F3E5"
            fillOpacity={0.05}
          />
          <SvgPath
            d="M100 98L100 192"
            stroke="#E3F3E5"
            strokeWidth={1.5}
            strokeOpacity={0.05}
          />
        </Svg>
      </View>

      <FadingScrollView
        contentContainerStyle={audioStyles.scrollContent}
        fadeColors={['rgba(6,41,12,0)', '#06290C']}
      >

      {/* Eyebrow */}
      <Text style={audioStyles.eyebrow}>{eyebrowLabel}</Text>

      {/* Title — serif with italic last word */}
      <Text style={audioStyles.title}>
        {titleParts.prefix}
        <Text style={audioStyles.titleItalic}>{titleParts.italic}</Text>
      </Text>

      {/* Description */}
      {card.description ? (
        <Text style={audioStyles.description}>{card.description}</Text>
      ) : null}

      {/* Waveform visualization */}
      <View style={audioStyles.waveContainer}>
        {WAVEFORM_BARS.map((bar, index) => (
          <View
            key={`wv-${index}`}
            style={[
              audioStyles.waveBar,
              {
                height: bar.height,
                backgroundColor: `rgba(223, 241, 226, ${bar.opacity})`,
              },
            ]}
          />
        ))}
      </View>

      {/* Progress scrubber */}
      <View style={audioStyles.progressContainer}>
        <View
          style={audioStyles.progressTrack}
          onLayout={(event) => setProgressTrackWidth(event.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => !isReadOnly && playback.duration > 0}
          onMoveShouldSetResponder={() => !isReadOnly && playback.duration > 0}
          onResponderGrant={(event) => previewScrubPosition(event.nativeEvent.locationX)}
          onResponderMove={(event) => previewScrubPosition(event.nativeEvent.locationX)}
          onResponderRelease={(event) => commitScrubPosition(event.nativeEvent.locationX)}
          onResponderTerminate={() => setScrubProgress(null)}
        >
          <View
            style={[
              audioStyles.progressFill,
              { width: `${Math.round(displayedProgress * 100)}%` },
            ]}
          >
            <View style={audioStyles.progressThumb} />
          </View>
        </View>

        {/* Time labels */}
        <View style={audioStyles.timeRow}>
          <Text style={audioStyles.timeText}>
            {formatAudioTime(displayedCurrentTime)}
          </Text>
          <Text style={audioStyles.timeText}>
            {formatAudioTime(playback.duration)}
          </Text>
        </View>
      </View>

      <View style={audioStyles.completionZone}>
        {isCompleted ? (
          <>
            <View style={audioStyles.completionBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#E3F3E5" />
              <Text style={audioStyles.completionBadgeText}>Completed</Text>
            </View>
            <Text style={audioStyles.completionHint}>
              {completionMode === 'auto'
                ? 'Completed after 75% listened. You can keep listening if you want.'
                : 'Marked complete. You can keep listening to the rest if you want.'}
            </Text>
            <View style={audioStyles.completionButtonWrap}>
              <PrimaryVisualButton label="Completed" inverted disabled />
            </View>
          </>
        ) : canMarkDone && !isReadOnly ? (
          <>
            <View style={audioStyles.completionBadgeMuted}>
              <Ionicons name="radio-button-on-outline" size={14} color="rgba(227, 243, 229, 0.78)" />
              <Text style={audioStyles.completionBadgeMutedText}>Completion available</Text>
            </View>
            <Text style={audioStyles.completionHint}>
              You can mark this done now, or keep listening until it completes automatically at 75%.
            </Text>
            <View style={audioStyles.completionButtonWrap}>
              <PrimaryVisualButton
                label="Mark as done"
                inverted
                onPress={() => completeAudio('manual')}
              />
            </View>
          </>
        ) : markDoneUnlockLabel && !isReadOnly ? (
          <Text style={audioStyles.completionHint}>
            Mark as done unlocks after {markDoneUnlockLabel} of listening.
          </Text>
        ) : isReadOnly ? (
          <Text style={audioStyles.completionHint}>
            This past day is now in review mode.
          </Text>
        ) : null}
      </View>

      {/* Error display */}
      {playback.error ? (
        <View style={audioStyles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color="rgba(227,243,229,0.5)" />
          <Text style={audioStyles.errorText}>{playback.error}</Text>
        </View>
      ) : null}
      </FadingScrollView>
    </View>
  );
}

function CalmTriggerCardView({ card }: { card: CalmTriggerCard; }) {
  return (
    <AccentCardShell eyebrow="CALM" title="Expanded calm tools are coming soon" scrollable>
      <Text style={styles.calmContext}>
        We are still finishing this dedicated calm reset. For now, continue with today&apos;s guided sessions and return here in a future update.
      </Text>
      <GhostVisualButton label="Coming Soon" />
    </AccentCardShell>
  );
}

function JournalCardView({
  card,
  cardIndex,
  onContinue,
  reflectionStorageKey,
  programReflectionIdentity,
  isReadOnly = false,
}: {
  card: JournalCard;
  cardIndex?: number;
  onContinue?: () => void;
  reflectionStorageKey?: string;
  programReflectionIdentity?: ProgramReflectionIdentity;
  isReadOnly?: boolean;
}) {
  const [value, setValue] = useState('');
  const [savedValue, setSavedValue] = useState('');
  const [isEditingSavedReflection, setIsEditingSavedReflection] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const trimmedValue = value.trim();
  const hasSavedReflection = savedValue.trim().length > 0 && !isEditingSavedReflection;
  const shouldSaveDraft = trimmedValue.length > 0;
  const { registerConfig } = useContext(TransportContext);
  const canSave = trimmedValue.length >= 30;
  const reflectionUserId = programReflectionIdentity?.userId;
  const reflectionProgramSlug = programReflectionIdentity?.programSlug;
  const reflectionDayNumber = programReflectionIdentity?.dayNumber;
  const reflectionCardIndex = programReflectionIdentity?.cardIndex;
  const reflectionCardType = programReflectionIdentity?.cardType;
  const reflectionPrompt = programReflectionIdentity?.prompt;
  const remoteIdentity = React.useMemo<ProgramReflectionIdentity | undefined>(() => {
    if (
      !reflectionUserId ||
      !reflectionProgramSlug ||
      typeof reflectionDayNumber !== 'number' ||
      typeof reflectionCardIndex !== 'number' ||
      !reflectionCardType ||
      !reflectionPrompt
    ) {
      return undefined;
    }

    return {
      userId: reflectionUserId,
      programSlug: reflectionProgramSlug,
      dayNumber: reflectionDayNumber,
      cardIndex: reflectionCardIndex,
      cardType: reflectionCardType,
      prompt: reflectionPrompt,
    };
  }, [
    reflectionCardIndex,
    reflectionCardType,
    reflectionDayNumber,
    reflectionProgramSlug,
    reflectionPrompt,
    reflectionUserId,
  ]);

  const applySavedReflection = React.useCallback((reflection: string) => {
    setSavedValue(reflection);
    setValue(reflection);
    setIsEditingSavedReflection(false);
  }, []);

  React.useEffect(() => {
    if (!reflectionStorageKey && !remoteIdentity) return;

    let isCancelled = false;

    const restoreReflection = async () => {
      try {
        if (reflectionStorageKey) {
          const storedReflection = await AsyncStorage.getItem(reflectionStorageKey);
          if (!isCancelled && storedReflection) {
            applySavedReflection(storedReflection);
          }
        }

        if (remoteIdentity) {
          const remoteReflection = await getProgramReflection(remoteIdentity);
          if (!isCancelled && remoteReflection?.reflection) {
            applySavedReflection(remoteReflection.reflection);
            if (reflectionStorageKey) {
              await AsyncStorage.setItem(reflectionStorageKey, remoteReflection.reflection);
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore card reflection', error);
      }
    };

    void restoreReflection();

    return () => {
      isCancelled = true;
    };
  }, [applySavedReflection, reflectionStorageKey, remoteIdentity]);

  const handleSaveAndContinue = async () => {
    if (isReadOnly) {
      onContinue?.();
      return;
    }

    if (!shouldSaveDraft) {
      onContinue?.();
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (reflectionStorageKey) {
        await AsyncStorage.setItem(reflectionStorageKey, trimmedValue);
      }

      if (remoteIdentity) {
        await upsertProgramReflection(remoteIdentity, trimmedValue);
      }

      setSavedValue(trimmedValue);
      setValue(trimmedValue);
      setIsEditingSavedReflection(false);
      onContinue?.();
    } catch (error) {
      console.error('Failed to save card reflection', error);
      setSaveError('Saved on this device, but not synced. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditReflection = () => {
    if (isReadOnly) {
      return;
    }

    setValue(savedValue);
    setIsEditingSavedReflection(true);
  };

  const handleCancelEdit = () => {
    setValue(savedValue);
    setIsEditingSavedReflection(false);
  };

  // Register transport config for journal
  useEffect(() => {
    if (cardIndex == null) return;

    if (isReadOnly) {
      registerConfig(cardIndex, {
        centerIcon: <Ionicons name="eye-outline" size={28} color="#06290C" />,
        centerLabel: 'REVIEW',
        disabled: true,
      });
      return;
    }

    if (hasSavedReflection) {
      // Already saved — center button becomes "CONTINUE"
      registerConfig(cardIndex, {
        centerIcon: (
          <Ionicons name="checkmark-circle" size={28} color="#16a34a" />
        ),
        centerLabel: 'SAVED ✓',
        onCenterPress: () => {
          onContinue?.();
        },
      });
    } else {
      // Editing or new — center button is "SAVE ENTRY" (gated on 30+ chars)
      registerConfig(cardIndex, {
        centerIcon: (
          <Ionicons
            name={isSaving ? 'hourglass-outline' : 'create-outline'}
            size={28}
            color={canSave ? '#06290C' : 'rgba(6, 41, 12, 0.3)'}
          />
        ),
        centerLabel: isSaving ? 'SAVING...' : canSave ? 'SAVE ENTRY' : 'SKIP',
        onCenterPress: () => {
          void handleSaveAndContinue();
        },
        disabled: isSaving,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIndex, hasSavedReflection, canSave, isReadOnly, isSaving, onContinue, registerConfig]);

  if (hasSavedReflection) {
    return (
      <CardShell eyebrow="Reflection · Saved" title={card.prompt} scrollable>
        <View style={styles.journalSavedBox}>
          <Text style={styles.journalSavedLabel}>Your reflection</Text>
          <Text style={styles.journalSavedText}>{savedValue}</Text>
        </View>

        {isReadOnly ? (
          <Text style={styles.reviewModeHint}>This past day is now in review mode.</Text>
        ) : (
          <View style={styles.journalButtonRow}>
            <View style={{ flexShrink: 1 }}>
              <PrimaryVisualButton label="Continue" onPress={onContinue} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <GhostVisualButton label="Edit Reflection" onPress={handleEditReflection} />
            </View>
          </View>
        )}
      </CardShell>
    );
  }

  return (
    <CardShell
      eyebrow={isEditingSavedReflection ? 'Reflection · Editing' : 'Reflection · Optional'}
      title={card.prompt}
      scrollable
    >
      {card.helperText ? (
        <Text style={styles.genericDesc}>{card.helperText}</Text>
      ) : null}

      <TextInput
        multiline
        placeholder="Start writing..."
        placeholderTextColor="#9CA39E"
        value={value}
        onChangeText={isReadOnly ? undefined : setValue}
        textAlignVertical="top"
        style={styles.journalInput}
        editable={!isReadOnly}
      />

      {isReadOnly ? (
        <Text style={styles.reviewModeHint}>
          {savedValue.trim().length > 0
            ? 'This past day is now in review mode.'
            : 'No reflection was saved for this day.'}
        </Text>
      ) : (
        <View style={styles.journalButtonRow}>
          <View style={{ flexShrink: 1 }}>
            <PrimaryVisualButton
              label={isSaving ? 'Saving...' : shouldSaveDraft ? (isEditingSavedReflection ? 'Update & Continue' : 'Save & Continue') : 'Continue'}
              onPress={() => void handleSaveAndContinue()}
            />
          </View>
          <View style={{ flexShrink: 1 }}>
            <GhostVisualButton
              label={isEditingSavedReflection ? 'Cancel Edit' : 'Skip'}
              onPress={isEditingSavedReflection ? handleCancelEdit : onContinue}
            />
          </View>
        </View>
      )}

      {saveError ? (
        <Text style={styles.journalErrorText}>{saveError}</Text>
      ) : null}

      {card.followUpPrompt ? (
        <View style={styles.journalFollowupBox}>
          <Text style={styles.journalFollowupTitle}>Deepen your practice</Text>
          <Text style={styles.journalFollowupText}>{card.followUpPrompt}</Text>
        </View>
      ) : null}
    </CardShell>
  );
}

function CloseCardViewWithState({
  card,
  isCompleted = false,
  isPartial = false,
  isReadOnly = false,
  readOnlyState,
  isFinalProgramDay = false,
  completionDescription,
  isCompleting = false,
  primaryActionLabel,
  primaryActionDisabled = false,
  onCompleteDay,
  onBackToProgram,
}: {
  card: CloseCard;
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
}) {
  const actionLabel = isCompleted
    ? 'Back to Program'
    : isReadOnly
      ? 'Back to Program'
    : primaryActionLabel
      ? primaryActionLabel
    : isPartial
      ? 'Mark Complete'
    : isCompleting
      ? 'Completing...'
      : isFinalProgramDay
        ? 'Complete Program Day'
        : 'Complete Day';
  const eyebrow = isReadOnly
    ? readOnlyState === 'skipped'
      ? 'Day closed'
      : readOnlyState === 'partial'
        ? 'Saved as partial'
        : 'Review mode'
    : isCompleted
      ? 'Review mode'
      : isPartial
        ? 'Saved as partial'
        : "Today's close";

  return (
    <DarkCardShell eyebrow={eyebrow} title={card.message} scrollable>
      {card.secondaryMessage ? (
        <Text style={styles.closeSub}>{card.secondaryMessage}</Text>
      ) : null}

      {(isCompleted || isPartial || isReadOnly) && completionDescription ? (
        <View style={styles.closeReviewBox}>
          <Text style={styles.closeReviewLabel}>
            {isCompleted
              ? isFinalProgramDay
                ? 'Program status'
                : 'Next unlock'
              : 'Day status'}
          </Text>
          <Text style={styles.closeReviewText}>{completionDescription}</Text>
        </View>
      ) : null}

      <PrimaryVisualButton
        label={actionLabel}
        inverted
        onPress={isCompleted || isReadOnly ? onBackToProgram : onCompleteDay}
        disabled={isReadOnly ? false : primaryActionDisabled}
      />
    </DarkCardShell>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// CARD RENDERER — switch on card.type
// ─────────────────────────────────────────────────────────────────────────────
export function CardRenderer({
  card,
  cardIndex,
  programName,
  totalCards,
  onContinue,
  reflectionStorageKey,
  routineStorageKey,
  checklistStorageKey,
  hasEffortCheck,
  isReadOnly = false,
  programReflectionContext,
  onRoutineProgressChange,
  onAudioCompleted,
  closeCardState,
}: {
  card: ContentCard;
  cardIndex?: number;
  programName?: string;
  totalCards?: number;
  onContinue?: () => void;
  reflectionStorageKey?: string;
  routineStorageKey?: string;
  checklistStorageKey?: string;
  hasEffortCheck?: boolean;
  isReadOnly?: boolean;
  programReflectionContext?: {
    userId?: string;
    programSlug: string;
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
  switch (card.type) {
    case 'intro':
      return <IntroCardView card={card} programName={programName} totalCards={totalCards} />;
    case 'lesson':
      return <LessonCardView card={card} cardIndex={cardIndex} />;
    case 'action_step':
      return (
        <ActionStepCardView
          card={card}
          cardIndex={cardIndex}
          checklistStorageKey={checklistStorageKey}
          isReadOnly={isReadOnly}
          onContinue={onContinue}
        />
      );
    case 'mindfulness_exercise':
    case 'breathing_exercise':
      return (
        <MindfulExerciseCardView
          card={card}
          cardIndex={cardIndex}
          onContinue={onContinue}
          isReadOnly={isReadOnly}
        />
      );
    case 'exercise_routine':
      return (
        <ExerciseRoutineCardView
          card={card}
          cardIndex={cardIndex}
          onContinue={onContinue}
          routineStorageKey={routineStorageKey}
          hasEffortCheck={hasEffortCheck}
          isReadOnly={isReadOnly}
          onProgressChange={onRoutineProgressChange}
        />
      );
    case 'audio':
      return (
        <AudioCardView
          card={card}
          cardIndex={cardIndex}
          isReadOnly={isReadOnly}
          onAudioCompleted={onAudioCompleted}
        />
      );
    case 'calm_trigger':
      return <CalmTriggerCardView card={card} />;
    case 'journal':
      return (
        <JournalCardView
          card={card}
          cardIndex={cardIndex}
          onContinue={onContinue}
          reflectionStorageKey={reflectionStorageKey}
          isReadOnly={isReadOnly}
          programReflectionIdentity={
            programReflectionContext?.userId
              ? {
                  ...programReflectionContext,
                  userId: programReflectionContext.userId,
                  cardType: card.type,
                  prompt: card.prompt,
                }
              : undefined
          }
        />
      );
    case 'close':
      return <CloseCardViewWithState card={card} {...closeCardState} />;
    default:
      return (
        <CardShell eyebrow="Unsupported card" title="Card type not mapped">
          <Text style={styles.unsupportedText}>
            This card type is not yet wired in the renderer.
          </Text>
        </CardShell>
      );
  }
}


const styles = StyleSheet.create({
  // FadingScrollView
  scrollWrapper: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  fadeMask: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 64,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabShadow: {
    shadowColor: '#05290C',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderRadius: 9999,
  },
  fabBlur: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.1)',
  },

  // ─── Card Shells ────────────────────────────────────────────────────────────
  // Shared shadow applied to all card families
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardShell: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.05)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 28,
    overflow: 'hidden',
  },
  cardShellContinuous: {
    borderCurve: 'continuous',
  },
  accentCardShell: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.1)',
    backgroundColor: '#E3F2E5', // sage-soft
    paddingHorizontal: 24,
    paddingVertical: 28,
    overflow: 'hidden',
  },
  darkCardShell: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#06290C', // forest
    paddingHorizontal: 24,
    paddingVertical: 28,
    overflow: 'hidden',
  },

  // Text elements inside shells
  eyebrowLight: {
    marginBottom: 12,
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: 'rgba(6, 41, 12, 0.4)',
  },
  eyebrowDark: {
    marginBottom: 12,
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  titleLight: {
    marginBottom: 12,
    fontFamily: 'Erode-Semibold',
    fontSize: 24,
    lineHeight: 30,
    color: '#06290C',
  },
  titleAccent: {
    textAlign: 'center',
    fontFamily: 'Erode-Semibold',
    fontSize: 24,
    lineHeight: 30,
    color: '#06290C',
  },
  titleDark: {
    marginBottom: 12,
    fontFamily: 'Erode-Semibold',
    fontSize: 28,
    lineHeight: 34,
    color: '#FFFFFF',
  },

  // Buttons
  primaryButtonLight: {
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  primaryButtonDark: {
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#06290C',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonTextLight: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#06290C',
  },
  primaryButtonTextDark: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  ghostButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  ghostButtonText: {
    fontFamily: 'Satoshi',
    fontSize: 15,
    color: 'rgba(6, 41, 12, 0.6)',
  },

  // DotList
  dotListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingVertical: 8,
  },
  dotListBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 41, 12, 0.05)',
  },
  dotBullet: {
    marginTop: 9,
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: '#CADCD6',
  },
  dotText: {
    flex: 1,
    fontFamily: 'Satoshi',
    fontSize: 15,
    lineHeight: 28,
  },

  // ─── Intro Card v2 ──────────────────────────────────────────────────────────
  // White canvas, editorial layout — matches rc_day_view_v2_refined.html
  introCard: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderCurve: 'continuous',
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  // 4px accent gradient bar at very top of card
  introAccentBar: {
    height: 4,
    width: '100%',
  },
  introScrollContent: {
    flexGrow: 1,
  },
  // Top row: phase pill (left) + duration (right)
  introTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  // Phase pill — sage background, forest text
  introPhasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E3F3E5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  introPhaseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#06290C',
  },
  introPhasePillText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#06290C',
  },
  // Duration text — top right
  introDurationText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    letterSpacing: 0.4,
    color: 'rgba(6, 41, 12, 0.4)',
  },
  // Hero section — flexible, fills remaining space
  introHero: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 16,
  },
  // Ghost day number — huge, nearly invisible
  introGhostDay: {
    fontFamily: 'Satoshi',
    fontWeight: '300',
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -2,
    color: 'rgba(6, 41, 12, 0.08)',
    marginBottom: -8,
  },
  // Serif title — large, forest green
  introTitle: {
    fontFamily: 'Erode-Medium',
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.7,
    color: '#06290C',
  },
  // Goal text — muted
  introGoal: {
    marginTop: 12,
    fontFamily: 'Satoshi',
    fontSize: 13,
    lineHeight: 21,
    color: 'rgba(6, 41, 12, 0.55)',
  },
  // Params row — horizontal flex of param boxes
  introParamsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  // Individual param box — sage-soft bg, centered text
  introParamBox: {
    flex: 1,
    backgroundColor: '#E3F2E5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  // Param value — large serif number
  introParamValue: {
    fontFamily: 'Erode-Medium',
    fontSize: 22,
    lineHeight: 22,
    color: '#06290C',
  },
  // Param label — tiny uppercase
  introParamLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(6, 41, 12, 0.38)',
    marginTop: 3,
  },

  // Lesson Card
  lessonCardShell: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.05)',
    overflow: 'hidden',
  },
  lessonEye: {
    paddingTop: 22,
    paddingHorizontal: 20,
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(6, 41, 12, 0.4)',
  },
  lessonTitle: {
    paddingTop: 6,
    paddingHorizontal: 20,
    paddingBottom: 16,
    fontFamily: 'Erode-Medium',
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.3,
    color: '#06290C',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 41, 12, 0.06)',
  },
  lessonBody: {
    padding: 20,
    gap: 14,
  },
  lessonParagraph: {
    fontFamily: 'Satoshi',
    fontWeight: '300',
    fontSize: 13,
    lineHeight: 21,
    color: 'rgba(6, 41, 12, 0.65)',
  },
  lessonPullQuoteItem: {
    marginVertical: 10,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(6, 41, 12, 0.15)',
  },
  lessonPullQuoteText: {
    fontFamily: 'Erode-Italic',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: '#06290C',
  },

  // Action Step
  actionDurationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 41, 12, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionDurationText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: 'rgba(6, 41, 12, 0.6)',
  },
  actionBody: {
    marginTop: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 18,
  },
  checklistItemText: {
    flex: 1,
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  checklistQuoteContainer: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 41, 12, 0.04)',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  checklistQuoteText: {
    fontFamily: 'Erode',
    fontSize: 19,
    lineHeight: 27,
    color: '#06290C',
  },
  whyWorksContainer: {
    marginTop: 32,
    overflow: 'hidden',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(6, 41, 12, 0.06)',
    paddingLeft: 20,
  },
  whyWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  whyWorksHeaderText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(6, 41, 12, 0.5)',
  },
  whyWorksBody: {
    marginTop: 12,
  },
  whyWorksText: {
    fontFamily: 'Satoshi',
    fontSize: 15,
    lineHeight: 28,
    color: '#4B5563',
  },
  proTipContainer: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0DFC0',
    backgroundColor: '#FEF9F0',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  proTipIcon: {
    marginTop: 1,
    fontSize: 16,
    color: '#7A5C2E',
  },
  proTipText: {
    flex: 1,
    fontFamily: 'Satoshi',
    fontSize: 13,
    lineHeight: 24,
    color: '#7A5C2E',
  },


  // Journal & Reflection
  journalHelper: {
    fontFamily: 'Satoshi',
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(6, 41, 12, 0.5)',
    marginBottom: 24,
  },
  journalInputWrapper: {
    marginBottom: 24,
    position: 'relative',
  },
  journalInput: {
    minHeight: 180,
    fontFamily: 'Satoshi',
    fontSize: 16,
    lineHeight: 32, // Matches ruled lines
    color: '#06290C',
    paddingTop: 0,
    paddingBottom: 0,
  },
  journalRuledLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  journalLine: {
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 41, 12, 0.05)',
  },
  journalButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  journalFollowupBox: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(6, 41, 12, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.05)',
  },
  journalFollowupTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: 'rgba(6, 41, 12, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  journalFollowupText: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  journalErrorText: {
    marginTop: 14,
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: '#8A3B2F',
  },
  journalSavedBox: {
    marginBottom: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.08)',
    backgroundColor: 'rgba(6, 41, 12, 0.03)',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  journalSavedLabel: {
    marginBottom: 10,
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(6, 41, 12, 0.45)',
  },
  journalSavedText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    lineHeight: 28,
    color: '#06290C',
  },
  reviewModeHint: {
    marginTop: 16,
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(6, 41, 12, 0.52)',
  },

  // Close Card
  closeContent: {
    flex: 1,
    paddingTop: 20,
  },
  closeIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(227, 243, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  closeSub: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 28,
  },
  closeReviewBox: {
    marginBottom: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(227, 243, 229, 0.16)',
    backgroundColor: 'rgba(227, 243, 229, 0.08)',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  closeReviewLabel: {
    marginBottom: 8,
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  closeReviewText: {
    fontFamily: 'Satoshi',
    fontSize: 15,
    lineHeight: 25,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  closeDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 40,
  },
  closeFinishBox: {
    alignItems: 'center',
    width: '100%',
  },
  closeFinishLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },

  // Atmospheric / Core
  calmContext: {
    marginTop: 12,
    marginBottom: 20,
    fontFamily: 'Satoshi',
    fontSize: 16,
    lineHeight: 32,
    color: '#374151',
  },
  genericDesc: {
    marginBottom: 24,
    fontFamily: 'Satoshi',
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  autoAdvance: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: 'rgba(6, 41, 12, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  autoAdvanceDark: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  audioDurationBadge: {
    marginBottom: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  audioDurationText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  audioIntention: {
    marginBottom: 28,
    fontFamily: 'Satoshi',
    fontSize: 16,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.68)',
  },
  unsupportedText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    lineHeight: 28,
    color: '#374151',
  },

  // Mindful/Breathing
  breathingContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  breathingCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: '#06290C',
  },
  breathingCore: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.05)',
  },
  breathingStatusText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    color: '#06290C',
    marginBottom: 4,
    textAlign: 'center',
  },
  breathingSubtext: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(6, 41, 12, 0.5)',
    textAlign: 'center',
  },
  breathingMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  breathingMetaPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 41, 12, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.08)',
  },
  breathingMetaPillText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    letterSpacing: 0.2,
    color: '#06290C',
  },
  breathingPatternText: {
    marginTop: 14,
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(6, 41, 12, 0.62)',
    textAlign: 'center',
  },
  breathingInstructions: {
    marginTop: 20,
    fontFamily: 'Satoshi',
    fontSize: 13,
    lineHeight: 21,
    color: 'rgba(6, 41, 12, 0.72)',
    textAlign: 'left',
    width: '100%',
  },
  breathingCompleteBlock: {
    alignItems: 'center',
    gap: 8,
  },
  breathingActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  mindfulnessStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  mindfulnessStepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(6, 41, 12, 0.2)',
    marginTop: 8,
    marginRight: 12,
  },
  mindfulnessStepText: {
    flex: 1,
    fontFamily: 'Satoshi',
    fontSize: 16,
    lineHeight: 24,
    color: '#06290C',
  },
  mindfulnessStepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 41, 12, 0.05)',
  },
  mindfulnessSmallText: {
    marginTop: 16,
    fontFamily: 'Satoshi',
    fontSize: 14,
    color: 'rgba(6, 41, 12, 0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Routine
  routineItemCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 41, 12, 0.2)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  routineItemCheckboxChecked: {
    backgroundColor: '#06290C',
    borderColor: '#06290C',
  },
  routineItemTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },

  // Routine List Layout
  routineList: {
    marginTop: 8,
  },
  routineItem: {
    paddingVertical: 24,
  },
  routineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 41, 12, 0.05)',
  },
  routineItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routineItemTitle: {
    flex: 1,
    fontFamily: 'Erode',
    fontSize: 20,
    color: '#06290C',
  },
  routineItemBody: {
    paddingLeft: 32, // Align with checkbox spacing
  },
  routineItemDesc: {
    fontFamily: 'Satoshi',
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: 12,
  },
  routineItemMetaBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(6, 41, 12, 0.03)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  routineItemMetaText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: 'rgba(6, 41, 12, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  effortCheckPanel: {
    marginTop: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 41, 12, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.08)',
    gap: 10,
  },
  effortCheckTitle: {
    fontFamily: 'Erode',
    fontSize: 18,
    color: '#06290C',
  },
  effortCheckHint: {
    fontFamily: 'Satoshi',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(6, 41, 12, 0.58)',
  },
  effortCheckOptions: {
    gap: 10,
  },
  effortCheckOption: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.12)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  effortCheckOptionSelected: {
    backgroundColor: '#06290C',
    borderColor: '#06290C',
  },
  effortCheckOptionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#06290C',
  },
  effortCheckOptionTitleSelected: {
    color: '#E3F3E5',
  },
  effortCheckSavedText: {
    fontFamily: 'Satoshi',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(6, 41, 12, 0.52)',
  },

  // ── Action Step — Age Reversal Program additions ───────────────────────────
  actionSubtitle: {
    fontFamily: 'Satoshi',
    fontSize: 15,
    color: 'rgba(6, 41, 12, 0.5)',
    marginBottom: 16,
    marginTop: -4,
    fontStyle: 'italic',
  },
  actionPurposeContainer: {
    marginTop: 20,
    backgroundColor: '#F0F7F1',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#06290C',
  },
  actionPurposeLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: 'rgba(6, 41, 12, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  actionPurposeText: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },

  // ── Lesson — Pull quote (additional container styles) ─────────────────────
  lessonPullQuoteContainer: {
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#06290C',
    paddingLeft: 16,
    paddingVertical: 4,
  },
  lessonPullQuoteDecor: {
    fontFamily: 'Erode',
    fontSize: 36,
    color: 'rgba(6, 41, 12, 0.15)',
    lineHeight: 36,
    marginBottom: 4,
  },

  // ── Mindfulness — Age Reversal Program additions ───────────────────────────
  mindfulSubtitle: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    color: 'rgba(6, 41, 12, 0.5)',
    fontStyle: 'italic',
    marginBottom: 12,
    marginTop: -4,
  },
  mindfulBenefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  mindfulBenefitPill: {
    backgroundColor: 'rgba(6, 41, 12, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  mindfulBenefitText: {
    fontFamily: 'Satoshi',
    fontSize: 12,
    color: 'rgba(6, 41, 12, 0.7)',
  },

  // ── Exercise — Age Reversal Program single-exercise layout ─────────────────
  exerciseAgeReversalBody: {
    marginTop: 8,
    gap: 16,
  },
  safetyTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(6, 41, 12, 0.03)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  safetyTriggerPillPressed: {
    opacity: 0.7,
  },
  safetyTriggerText: {
    fontSize: 11,
    color: 'rgba(6, 41, 12, 0.55)',
    fontFamily: 'Satoshi-Medium',
  },
  safetySheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  safetySheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 41, 12, 0.6)',
  },
  safetySheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  safetySheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(6, 41, 12, 0.08)',
    alignSelf: 'center',
    marginBottom: 32,
  },
  safetySheetIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(185, 58, 43, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  safetySheetTitle: {
    fontFamily: 'Erode-Bold',
    fontSize: 22,
    color: '#06290C',
    textAlign: 'center',
    marginBottom: 12,
  },
  safetySheetSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: 'rgba(6, 41, 12, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  safetySheetBody: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  safetySheetItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  safetySheetDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B93A2B',
    marginTop: 8,
    marginRight: 10,
  },
  safetySheetText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#06290C',
    fontFamily: 'Satoshi-Medium',
  },
  safetySheetButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#06290C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  safetySheetButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Satoshi-Bold',
  },
  exerciseMusclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 41, 12, 0.04)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  exerciseMusclePillText: {
    fontFamily: 'Satoshi',
    fontSize: 12,
    color: 'rgba(6, 41, 12, 0.6)',
  },
  exerciseMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  exerciseMetricPill: {
    flex: 1,
    backgroundColor: '#06290C',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseMetricText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#E3F3E5',
    textAlign: 'center',
  },
  exerciseStepsList: {
    marginBottom: 20,
  },
  exerciseStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
  },
  exerciseStepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 41, 12, 0.06)',
  },
  exerciseStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 41, 12, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    flexShrink: 0,
  },
  exerciseStepNumberText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: '#06290C',
  },
  exerciseStepText: {
    flex: 1,
    fontFamily: 'Satoshi',
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
  exerciseScienceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0F7F1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  exerciseScienceNoteIcon: {
    fontSize: 16,
    marginTop: 1,
    color: '#06290C',
  },
  exerciseScienceNoteText: {
    flex: 1,
    fontFamily: 'Satoshi',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(6, 41, 12, 0.65)',
    fontStyle: 'italic',
  },
  exerciseDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 41, 12, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(6, 41, 12, 0.02)',
  },
  exerciseDoneButtonCompleted: {
    backgroundColor: '#06290C',
    borderColor: '#06290C',
  },
  exerciseDoneButtonReadOnly: {
    opacity: 0.55,
  },
  exerciseDoneButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: 'rgba(6, 41, 12, 0.6)',
  },
  exerciseDoneButtonTextCompleted: {
    color: '#E3F3E5',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO CARD v2 — immersive dark, spec-matched styles
// ─────────────────────────────────────────────────────────────────────────────
const audioStyles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  watermark: {
    position: 'absolute',
    left: -20,
    bottom: -20,
    opacity: 0.05,
    width: 180,
    height: 180,
  },
  eyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(227, 243, 229, 0.35)',
    marginBottom: 10,
    position: 'relative',
    zIndex: 2,
  },
  title: {
    fontFamily: 'Erode-Medium',
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 31,
    letterSpacing: -0.5,
    marginBottom: 8,
    position: 'relative',
    zIndex: 2,
  },
  titleItalic: {
    fontFamily: 'Erode-MediumItalic',
    fontStyle: 'italic',
    fontWeight: '400',
    color: 'rgba(227, 243, 229, 0.8)',
  },
  description: {
    fontFamily: 'Satoshi',
    fontSize: 12,
    color: 'rgba(227, 243, 229, 0.5)',
    lineHeight: 18.5,
    marginBottom: 0,
    position: 'relative',
    zIndex: 2,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 28,
    paddingBottom: 20,
    minHeight: 128,
    position: 'relative',
    zIndex: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  progressContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    position: 'relative',
    zIndex: 2,
    overflow: 'visible',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(227, 243, 229, 0.22)',
    borderRadius: 999,
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#E3F3E5',
    borderRadius: 999,
    position: 'relative',
  },
  progressThumb: {
    position: 'absolute',
    right: 0,
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    transform: [{ translateX: 7 }],
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  timeText: {
    fontFamily: 'Satoshi',
    fontSize: 9,
    color: 'rgba(227, 243, 229, 0.4)',
    letterSpacing: 0.4,
  },
  completionZone: {
    paddingHorizontal: 4,
    paddingTop: 8,
    gap: 10,
    position: 'relative',
    zIndex: 2,
  },
  completionBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(227, 243, 229, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(227, 243, 229, 0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completionBadgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    letterSpacing: 0.4,
    color: '#E3F3E5',
  },
  completionBadgeMuted: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(227, 243, 229, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(227, 243, 229, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completionBadgeMutedText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    letterSpacing: 0.4,
    color: 'rgba(227, 243, 229, 0.78)',
  },
  completionHint: {
    fontFamily: 'Satoshi',
    fontSize: 11,
    lineHeight: 17,
    color: 'rgba(227, 243, 229, 0.62)',
  },
  completionButtonWrap: {
    alignSelf: 'flex-start',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    position: 'relative',
    zIndex: 2,
  },
  errorText: {
    fontFamily: 'Satoshi',
    fontSize: 11,
    color: 'rgba(227, 243, 229, 0.5)',
  },
});
