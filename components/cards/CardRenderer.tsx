import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
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
            style={!isAtBottom ? bounceStyle : undefined}
          >
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
        </View>
      ) : null}
    </View>
  );
}

function CardShell({
  children,
  eyebrow,
  title,
  scrollable = false,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  scrollable?: boolean;
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
    <View style={[styles.cardShell, styles.cardShellContinuous]}>
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
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
}) {
  return (
    <View style={[styles.accentCardShell, styles.cardShellContinuous]}>
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
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
}) {
  return (
    <View style={[styles.darkCardShell, styles.cardShellContinuous]}>
      {eyebrow ? (
        <Text style={styles.eyebrowDark}>
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <Text style={styles.titleDark}>{title}</Text>
      ) : null}
      {children}
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

function IntroCardView({ card, programName }: { card: IntroCard; programName?: string; }) {
  return (
    <View style={styles.introCard}>
      <View style={styles.introSpacer} />
      <Text style={styles.introEyebrow}>
        Day {card.dayNumber}
      </Text>

      <View>
        <Text style={styles.introTitle}>
          {card.dayTitle}
        </Text>

        <Text style={styles.introGoal}>{card.goal}</Text>

        {card.estimatedMinutes || programName ? (
          <View style={styles.introMetaRow}>
            {card.estimatedMinutes ? (
              <View style={styles.introMetaPill}>
                <Text style={styles.introMetaTextTime}>{`~${card.estimatedMinutes} min`}</Text>
              </View>
            ) : null}

            {card.estimatedMinutes && programName ? (
              <View style={styles.introMetaDot} />
            ) : null}

            {programName ? (
              <Text style={styles.introMetaTextProgram}>{programName}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function LessonCardView({ card }: { card: LessonCard; }) {
  return (
    <CardShell scrollable>
      <View style={styles.lessonContextPill}>
        <Text style={styles.lessonContextText}>Context</Text>
      </View>

      <Text style={styles.lessonTitle}>
        {card.title ?? 'Why timing matters'}
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
                <View style={styles.lessonHighlightContainer}>
                  <Text style={styles.lessonHighlightText}>
                    {card.highlight}
                  </Text>
                </View>
              ) : null}
            </React.Fragment>
          );
        })}

        {card.highlight && card.paragraphs.length <= 1 ? (
          <View style={styles.lessonHighlightContainer}>
            <Text style={styles.lessonHighlightText}>
              {card.highlight}
            </Text>
          </View>
        ) : null}
      </View>
    </CardShell>
  );
}

function ActionStepCardView({ card }: { card: ActionStepCard; }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <CardShell
      scrollable
      eyebrow={`Action Step ${card.stepNumber}`}
      title={card.title}
    >
      <View style={styles.actionBody}>
        {card.duration ? (
          <View style={styles.actionDurationPill}>
            <Ionicons name="time-outline" size={14} color="rgba(6, 41, 12, 0.4)" />
            <Text style={styles.actionDurationText}>{card.duration}</Text>
          </View>
        ) : null}

        <DotList items={card.instructions} textStyle={{ color: '#374151', fontSize: 16, lineHeight: 26 }} />

        {card.whyThisWorks ? (
          <Animated.View
            layout={LinearTransition.springify().damping(18).stiffness(130)}
            style={styles.whyWorksContainer}
          >
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

function MindfulExerciseCardView({ card }: { card: MindfulnessExerciseCard | BreathingExerciseCard; }) {
  const [isActive, setIsActive] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.15);
  const breathingPattern = card.type === 'breathing_exercise' ? card.pattern : undefined;
  const cycles = card.type === 'breathing_exercise' ? card.cycles : undefined;
  const duration = card.type === 'mindfulness_exercise' ? card.duration : undefined;
  const steps = card.type === 'mindfulness_exercise' ? card.steps : undefined;

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

  const isBreathing = card.type === 'breathing_exercise';

  return (
    <AccentCardShell
      eyebrow={duration ? `Mindful · ${duration}` : 'Grounding'}
      title={card.title}
    >
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

function ExerciseRoutineCardView({ card }: { card: ExerciseRoutineCard; }) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const routineItems = card.exercises ?? [];

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

  return (
    <CardShell
      eyebrow={`Routine${card.totalDuration ? ` · ${card.totalDuration}` : ''}`}
      title={card.title}
      scrollable
    >
      <View style={styles.routineList}>
        {routineItems.map((item, index) => {
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

function AudioCardView({ card }: { card: AudioCard; }) {
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
  onContinue,
  journalStorageKey,
  programReflectionIdentity,
}: {
  card: JournalCard;
  onContinue?: () => void;
  journalStorageKey?: string;
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
    if (!journalStorageKey && !remoteIdentity) return;

    let isCancelled = false;

    const restoreReflection = async () => {
      try {
        if (journalStorageKey) {
          const storedReflection = await AsyncStorage.getItem(journalStorageKey);
          if (!isCancelled && storedReflection) {
            applySavedReflection(storedReflection);
          }
        }

        if (remoteIdentity) {
          const remoteReflection = await getProgramReflection(remoteIdentity);
          if (!isCancelled && remoteReflection?.reflection) {
            applySavedReflection(remoteReflection.reflection);
            if (journalStorageKey) {
              await AsyncStorage.setItem(journalStorageKey, remoteReflection.reflection);
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
  }, [applySavedReflection, journalStorageKey, remoteIdentity]);

  const handleSaveAndContinue = async () => {
    if (!shouldSaveDraft) {
      onContinue?.();
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (journalStorageKey) {
        await AsyncStorage.setItem(journalStorageKey, trimmedValue);
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

function CloseCardView({ card }: { card: CloseCard; }) {
  return (
    <DarkCardShell eyebrow="Today's close" title={card.message}>
      {card.secondaryMessage ? (
        <Text style={styles.closeSub}>{card.secondaryMessage}</Text>
      ) : null}
      <PrimaryVisualButton label="Complete Day" inverted />
    </DarkCardShell>
  );
}

export function CardRenderer({
  card,
  programName,
  onContinue,
  journalStorageKey,
  programReflectionContext,
}: {
  card: ContentCard;
  programName?: string;
  onContinue?: () => void;
  journalStorageKey?: string;
  programReflectionContext?: {
    userId?: string;
    programSlug: string;
    dayNumber: number;
    cardIndex: number;
  };
}) {
  switch (card.type) {
    case 'intro':
      return <IntroCardView card={card} programName={programName} />;
    case 'lesson':
      return <LessonCardView card={card} />;
    case 'action_step':
      return <ActionStepCardView card={card} />;
    case 'mindfulness_exercise':
    case 'breathing_exercise':
      return <MindfulExerciseCardView card={card} />;
    case 'exercise_routine':
      return <ExerciseRoutineCardView card={card} />;
    case 'audio':
      return <AudioCardView card={card} />;
    case 'calm_trigger':
      return <CalmTriggerCardView card={card} />;
    case 'journal':
      return (
        <JournalCardView
          card={card}
          onContinue={onContinue}
          journalStorageKey={journalStorageKey}
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
      return <CloseCardView card={card} />;
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

  // CardShell
  cardShell: {
    flexShrink: 1,
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.05)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  cardShellContinuous: {
    borderCurve: 'continuous',
  },
  accentCardShell: {
    flexShrink: 1,
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.1)',
    backgroundColor: '#E3F3E5', // sage
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  darkCardShell: {
    flexShrink: 1,
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#06290C', // forest
    paddingHorizontal: 24,
    paddingVertical: 28,
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

  // Specific Card Views...
  // Intro Card
  introCard: {
    flex: 1,
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.05)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 36,
    borderCurve: 'continuous',
  },
  introSpacer: {
    flex: 1,
  },
  introEyebrow: {
    marginBottom: 10,
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    color: 'rgba(6, 41, 12, 0.4)',
  },
  introTitle: {
    marginBottom: 20,
    fontFamily: 'Erode',
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.5,
    color: '#06290C',
  },
  introGoal: {
    marginBottom: 32,
    fontFamily: 'Satoshi',
    fontSize: 18,
    lineHeight: 30,
    color: '#4B5563',
  },
  introMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  introMetaPill: {
    borderRadius: 9999,
    backgroundColor: 'rgba(6, 41, 12, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  introMetaTextTime: {
    letterSpacing: 0.3,
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: 'rgba(6, 41, 12, 0.6)',
  },
  introMetaDot: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(6, 41, 12, 0.2)',
  },
  introMetaTextProgram: {
    letterSpacing: 0.3,
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: 'rgba(6, 41, 12, 0.4)',
  },

  // Lesson Card
  lessonContextPill: {
    marginBottom: 24,
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  lessonContextText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: 'rgba(6, 41, 12, 0.5)',
  },
  lessonTitle: {
    marginBottom: 32,
    fontFamily: 'Erode',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: '#06290C',
  },
  lessonBody: {
    marginBottom: 4,
  },
  lessonParagraph: {
    marginBottom: 20,
    fontFamily: 'Satoshi',
    fontWeight: '300',
    fontSize: 16,
    lineHeight: 30,
    color: '#4B5563',
  },
  lessonHighlightContainer: {
    marginVertical: 32,
    borderLeftWidth: 2,
    borderLeftColor: '#06290C',
    paddingVertical: 16,
    paddingLeft: 24,
  },
  lessonHighlightText: {
    fontFamily: 'Erode-Italic',
    fontSize: 24,
    lineHeight: 34,
    letterSpacing: -0.2,
    color: 'rgba(6, 41, 12, 0.9)',
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
    marginBottom: 40,
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
});
