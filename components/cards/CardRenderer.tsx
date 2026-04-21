import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useState } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import Animated, {
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

import { ProgramAudioPlayer } from '@/components/program/ProgramAudioPlayer';
import {
  getProgramReflection,
  upsertProgramReflection,
} from '@/lib/api/program-reflections';
import type { ProgramReflectionIdentity } from '@/lib/api/program-reflections';

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

function FadingScrollView({ children, contentContainerStyle }: { children: React.ReactNode; contentContainerStyle?: any }) {
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
        contentContainerStyle={[contentContainerStyle, styles.scrollContent]}
      >
        {children}
      </ScrollView>

      {isScrollable && (
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
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
            entering={FadeInDown.delay(600).springify().damping(16).stiffness(150)}
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
  showGrain = false,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  showGrain?: boolean;
}) {
  return (
    <View style={[styles.accentCardShell, styles.cardShellContinuous, styles.cardShadow]}>
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
        <FadingScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
}: {
  label: string;
  inverted?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View
      style={inverted ? styles.primaryButtonLight : styles.primaryButtonDark}
    >
      <Text
        style={inverted ? styles.primaryButtonTextLight : styles.primaryButtonTextDark}
      >
        {label}
      </Text>
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

  // Convert new `parameters` object (Age Reversal format) → { value, label }[]
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

          {/* Pull quote — Age Reversal editorial callout */}
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

function ActionStepCardView({ card, cardIndex, onContinue }: { card: ActionStepCard; cardIndex?: number; onContinue?: () => void; }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { registerConfig } = useContext(TransportContext);

  // Register transport config: "MARK DONE" → marks complete → auto-advances
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
      centerLabel: isDone ? 'DONE ✓' : 'MARK DONE',
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
  }, [cardIndex, isDone, onContinue, registerConfig]);

  // Support both legacy stepNumber and new stepLabel format
  const eyebrowText = card.stepLabel ?? (card.stepNumber != null ? `Action Step ${card.stepNumber}` : 'Action Step');

  return (
    <CardShell
      scrollable
      eyebrow={eyebrowText}
      title={card.title}
    >
      <View style={styles.actionBody}>
        {/* Age Reversal subtitle */}
        {card.subtitle ? (
          <Text style={styles.actionSubtitle}>{card.subtitle}</Text>
        ) : null}

        {card.duration ? (
          <View style={styles.actionDurationPill}>
            <Ionicons name="time-outline" size={14} color="rgba(6, 41, 12, 0.4)" />
            <Text style={styles.actionDurationText}>{card.duration}</Text>
          </View>
        ) : null}

        <DotList items={card.instructions} textStyle={{ color: '#374151', fontSize: 16, lineHeight: 26 }} />

        {/* Age Reversal purpose callout */}
        {card.purpose ? (
          <View style={styles.actionPurposeContainer}>
            <Text style={styles.actionPurposeLabel}>Why this step</Text>
            <Text style={styles.actionPurposeText}>{card.purpose}</Text>
          </View>
        ) : null}

        {card.whyThisWorks ? (
          <Animated.View
            layout={LinearTransition.springify().damping(18).stiffness(130)}
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
                  entering={FadeInDown.springify().damping(18).stiffness(130)}
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

function MindfulExerciseCardView({ card, cardIndex, onContinue }: { card: MindfulnessExerciseCard | BreathingExerciseCard; cardIndex?: number; onContinue?: () => void; }) {
  const [isActive, setIsActive] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.15);
  const { registerConfig } = useContext(TransportContext);
  const breathingPattern = card.type === 'breathing_exercise' ? card.pattern : undefined;
  const cycles = card.type === 'breathing_exercise' ? card.cycles : undefined;
  const duration = card.type === 'mindfulness_exercise' ? card.duration : undefined;
  const steps = card.type === 'mindfulness_exercise' ? card.steps : undefined;
  const subtitle = card.type === 'mindfulness_exercise' ? card.subtitle : undefined;
  const benefits = card.type === 'mindfulness_exercise' ? card.benefits : undefined;

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const startBreathing = () => {
    setIsActive(true);
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: (breathingPattern?.inhaleSeconds ?? 4) * 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.6, { duration: (breathingPattern?.holdSeconds ?? 0) * 1000 }),
        withTiming(1, { duration: (breathingPattern?.exhaleSeconds ?? 6) * 1000, easing: Easing.inOut(Easing.quad) })
      ),
      cycles ?? -1,
      false
    );
    opacity.value = withTiming(0.4, { duration: 1000 });
  };

  // Register transport config: BEGIN → starts exercise, DONE → advances
  useEffect(() => {
    if (cardIndex == null) return;

    registerConfig(cardIndex, {
      centerIcon: (
        <Ionicons
          name={isActive ? 'checkmark' : 'leaf-outline'}
          size={28}
          color="#06290C"
        />
      ),
      centerLabel: isActive ? 'DONE' : 'BEGIN',
      onCenterPress: () => {
        if (isActive) {
          onContinue?.();
        } else {
          startBreathing();
        }
      },
    });
  }, [cardIndex, isActive, onContinue, registerConfig]);

  const isBreathing = card.type === 'breathing_exercise';

  return (
    <AccentCardShell
      eyebrow={duration ? `Mindful · ${duration}` : 'Grounding'}
      title={card.title}
    >
      {/* Age Reversal subtitle */}
      {subtitle ? (
        <Text style={styles.mindfulSubtitle}>{subtitle}</Text>
      ) : null}

      {/* Age Reversal benefit pills */}
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
                  name={isActive ? "medical-outline" : "water-outline"}
                  size={32}
                  color="rgba(6, 41, 12, 0.4)"
                  style={{ marginBottom: 4 }}
                />
              </View>
            </View>

            {!isActive ? (
              <Pressable
                onPress={startBreathing}
                style={({ pressed }) => [
                  styles.startExerciseButton,
                  pressed && { opacity: 0.8 }
                ]}
              >
                <Text style={styles.startExerciseButtonText}>Begin Focus</Text>
              </Pressable>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.breathingStatusText}>Focus on your breath</Text>
                <Text style={styles.breathingSubtext}>
                  Inhale as it expands, exhale as it contracts
                </Text>
              </View>
            )}
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
  onProgressChange,
}: {
  card: ExerciseRoutineCard;
  cardIndex?: number;
  onContinue?: () => void;
  routineStorageKey?: string;
  onProgressChange?: () => void;
}) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [hasRestored, setHasRestored] = useState(false);
  const { registerConfig } = useContext(TransportContext);

  // ── Detect format ──────────────────────────────────────────────────────────
  // Age Reversal format: single exercise with `name` + `steps` at top level
  const isAgeReversalFormat = Boolean(card.name && Array.isArray(card.steps));
  const routineItems = isAgeReversalFormat ? [] : (card.exercises ?? []);

  // Count total items for progress tracking
  const totalItems = isAgeReversalFormat ? 1 : routineItems.length;
  const completedCount = completedItems.size;
  const allDone = completedCount >= totalItems && totalItems > 0;

  // Register transport config: shows completion progress
  useEffect(() => {
    if (cardIndex == null) return;

    registerConfig(cardIndex, {
      centerIcon: (
        <Ionicons
          name={allDone ? 'checkmark-circle' : 'checkmark'}
          size={28}
          color={allDone ? '#16a34a' : '#06290C'}
        />
      ),
      centerLabel: allDone
        ? 'ALL DONE ✓'
        : totalItems > 1
          ? `${completedCount}/${totalItems} DONE`
          : 'MARK DONE',
      onCenterPress: () => {
        if (allDone) {
          onContinue?.();
        }
        // If not all done, button does nothing — user needs to check items on the card
      },
      disabled: !allDone,
    });
  }, [cardIndex, allDone, completedCount, totalItems, onContinue, registerConfig]);

  // For Age Reversal, the single item id is the card name
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
          setHasRestored(true);
          return;
        }

        const parsed = JSON.parse(rawValue);
        const nextItems = Array.isArray(parsed)
          ? parsed.filter((value): value is string => typeof value === 'string')
          : [];

        setCompletedItems(new Set(nextItems));
      } catch (error) {
        console.error('Failed to restore routine checklist progress', error);
        if (!isCancelled) {
          setCompletedItems(new Set());
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
      if (!routineStorageKey) {
        onProgressChange?.();
        return;
      }

      try {
        await AsyncStorage.setItem(routineStorageKey, JSON.stringify(Array.from(completedItems)));
      } catch (error) {
        console.error('Failed to persist routine checklist progress', error);
      } finally {
        onProgressChange?.();
      }
    };

    void persistProgress();
  }, [completedItems, hasRestored, onProgressChange, routineStorageKey]);

  const toggleItem = (id: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Age Reversal single-exercise render ────────────────────────────────────
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
            style={[
              styles.exerciseDoneButton,
              isCompleted && styles.exerciseDoneButtonCompleted,
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
              style={[
                styles.routineItem,
                index < routineItems.length - 1 && styles.routineItemBorder,
                isCompleted && { opacity: 0.5 },
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
    </CardShell>
  );
}

function AudioCardView({ card, cardIndex }: { card: AudioCard; cardIndex?: number; }) {
  const { registerConfig } = useContext(TransportContext);

  // Register transport config: LISTEN — audio playback is controlled by the in-card player
  useEffect(() => {
    if (cardIndex == null) return;

    registerConfig(cardIndex, {
      centerIcon: (
        <Ionicons
          name="headset-outline"
          size={28}
          color="#06290C"
        />
      ),
      centerLabel: 'LISTEN',
      // No onCenterPress — user controls playback via the in-card player
      // The Next button handles navigation
    });
  }, [cardIndex, registerConfig]);

  return (
    <DarkCardShell eyebrow="Guided meditation" title={card.title}>
      <View style={styles.audioDurationBadge}>
        <Ionicons name="headset-outline" size={14} color="rgba(255, 255, 255, 0.55)" />
        <Text style={styles.audioDurationText}>
          {card.durationSeconds
            ? `${Math.round(card.durationSeconds / 60)} min session`
            : 'Guided session'}
        </Text>
      </View>

      {card.description ? (
        <Text style={styles.audioIntention}>{card.description}</Text>
      ) : null}

      <ProgramAudioPlayer
        embeddedDark
        audio={{
          storagePath: card.audioStoragePath,
          durationSeconds: card.durationSeconds,
        }}
      />

      {card.autoAdvance ? (
        <Text style={styles.autoAdvanceDark}>
          Auto-advance enabled
        </Text>
      ) : null}
    </DarkCardShell>
  );
}

function CalmTriggerCardView({ card }: { card: CalmTriggerCard; }) {
  return (
    <AccentCardShell eyebrow="CALM" title="Need a moment?">
      <Text style={styles.calmContext}>{card.context}</Text>
      <PrimaryVisualButton label="Start 10-Minute Calm Session" />
    </AccentCardShell>
  );
}

function JournalCardView({
  card,
  cardIndex,
  onContinue,
  reflectionStorageKey,
  programReflectionIdentity,
}: {
  card: JournalCard;
  cardIndex?: number;
  onContinue?: () => void;
  reflectionStorageKey?: string;
  programReflectionIdentity?: ProgramReflectionIdentity;
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
  }, [cardIndex, hasSavedReflection, canSave, isSaving, onContinue, registerConfig]);

  if (hasSavedReflection) {
    return (
      <CardShell eyebrow="Reflection · Saved" title={card.prompt}>
        <View style={styles.journalSavedBox}>
          <Text style={styles.journalSavedLabel}>Your reflection</Text>
          <Text style={styles.journalSavedText}>{savedValue}</Text>
        </View>

        <View style={styles.journalButtonRow}>
          <View style={{ flexShrink: 1 }}>
            <PrimaryVisualButton label="Continue" onPress={onContinue} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <GhostVisualButton label="Edit Reflection" onPress={handleEditReflection} />
          </View>
        </View>
      </CardShell>
    );
  }

  return (
    <CardShell
      eyebrow={isEditingSavedReflection ? 'Reflection · Editing' : 'Reflection · Optional'}
      title={card.prompt}
    >
      {card.helperText ? (
        <Text style={styles.genericDesc}>{card.helperText}</Text>
      ) : null}

      <TextInput
        multiline
        placeholder="Start writing..."
        placeholderTextColor="#9CA39E"
        value={value}
        onChangeText={setValue}
        textAlignVertical="top"
        style={styles.journalInput}
      />

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
  isFinalProgramDay = false,
  completionDescription,
  isCompleting = false,
  primaryActionLabel,
  onCompleteDay,
  onBackToProgram,
}: {
  card: CloseCard;
  isCompleted?: boolean;
  isPartial?: boolean;
  isFinalProgramDay?: boolean;
  completionDescription?: string | null;
  isCompleting?: boolean;
  primaryActionLabel?: string;
  onCompleteDay?: () => void;
  onBackToProgram?: () => void;
}) {
  const actionLabel = isCompleted
    ? 'Back to Program'
    : primaryActionLabel
      ? primaryActionLabel
    : isPartial
      ? 'Mark Fully Complete'
    : isCompleting
      ? 'Completing...'
      : isFinalProgramDay
        ? 'Complete Program Day'
        : 'Complete Day';

  return (
    <DarkCardShell eyebrow={isCompleted ? 'Review mode' : isPartial ? 'Saved as partial' : "Today's close"} title={card.message}>
      {card.secondaryMessage ? (
        <Text style={styles.closeSub}>{card.secondaryMessage}</Text>
      ) : null}

      {(isCompleted || isPartial) && completionDescription ? (
        <View style={styles.closeReviewBox}>
          <Text style={styles.closeReviewLabel}>
            {isCompleted ? (isFinalProgramDay ? 'Program status' : 'Next unlock') : 'Day status'}
          </Text>
          <Text style={styles.closeReviewText}>{completionDescription}</Text>
        </View>
      ) : null}

      <PrimaryVisualButton
        label={actionLabel}
        inverted
        onPress={isCompleted ? onBackToProgram : onCompleteDay}
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
  programReflectionContext,
  onRoutineProgressChange,
  closeCardState,
}: {
  card: ContentCard;
  cardIndex?: number;
  programName?: string;
  totalCards?: number;
  onContinue?: () => void;
  reflectionStorageKey?: string;
  routineStorageKey?: string;
  programReflectionContext?: {
    userId?: string;
    programSlug: string;
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
  switch (card.type) {
    case 'intro':
      return <IntroCardView card={card} programName={programName} totalCards={totalCards} />;
    case 'lesson':
      return <LessonCardView card={card} cardIndex={cardIndex} />;
    case 'action_step':
      return <ActionStepCardView card={card} cardIndex={cardIndex} onContinue={onContinue} />;
    case 'mindfulness_exercise':
    case 'breathing_exercise':
      return <MindfulExerciseCardView card={card} cardIndex={cardIndex} onContinue={onContinue} />;
    case 'exercise_routine':
      return (
        <ExerciseRoutineCardView
          card={card}
          cardIndex={cardIndex}
          onContinue={onContinue}
          routineStorageKey={routineStorageKey}
          onProgressChange={onRoutineProgressChange}
        />
      );
    case 'audio':
      return <AudioCardView card={card} cardIndex={cardIndex} />;
    case 'calm_trigger':
      return <CalmTriggerCardView card={card} />;
    case 'journal':
      return (
        <JournalCardView
          card={card}
          cardIndex={cardIndex}
          onContinue={onContinue}
          reflectionStorageKey={reflectionStorageKey}
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
  scrollWrapper: { flexShrink: 1 },
  scrollContent: { paddingBottom: 32 },
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
    flexShrink: 1,
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
    flexShrink: 1,
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.1)',
    backgroundColor: '#EEF6EF', // sage-soft
    paddingHorizontal: 24,
    paddingVertical: 28,
    overflow: 'hidden',
  },
  darkCardShell: {
    flexShrink: 1,
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
    flex: 1,
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
    flex: 1,
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
    backgroundColor: '#EEF6EF',
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
    flexShrink: 1,
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
  startExerciseButton: {
    backgroundColor: '#06290C',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  startExerciseButtonText: {
    color: '#E3F3E5',
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
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
    color: 'rgba(6, 41, 12, 0.5)',
    textAlign: 'center',
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

  // ── Action Step — Age Reversal additions ───────────────────────────────────
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

  // ── Mindfulness — Age Reversal additions ───────────────────────────────────
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

  // ── Exercise — Age Reversal single-exercise layout ─────────────────────────
  exerciseAgeReversalBody: {
    marginTop: 8,
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
  exerciseDoneButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: 'rgba(6, 41, 12, 0.6)',
  },
  exerciseDoneButtonTextCompleted: {
    color: '#E3F3E5',
  },
});

