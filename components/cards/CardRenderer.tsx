import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { BlurView } from 'expo-blur';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
import type {
  ActionStepCard,
  AudioCard,
  BreathingExerciseCard,
  CalmTriggerCard,
  CloseCard,
  ContentCard,
  ExerciseRoutineCard,
  IntroCard,
  JournalCard,
  LessonCard,
  MindfulnessExerciseCard,
} from '@/types/content';

function ProgressBar({
  currentIndex,
  totalCards,
  variant = 'light',
}: {
  currentIndex?: number;
  totalCards?: number;
  variant?: 'light' | 'dark' | 'accent';
}) {
  if (typeof currentIndex !== 'number' || typeof totalCards !== 'number') {
    return null;
  }

  let emptyColor = 'bg-gray-200';
  let filledColor = 'bg-forest';

  if (variant === 'dark') {
    emptyColor = 'bg-white/20';
    filledColor = 'bg-white';
  } else if (variant === 'accent') {
    emptyColor = 'bg-forest/10';
    filledColor = 'bg-forest';
  }

  return (
    <View className="mb-6 flex-row gap-1.5">
      {Array.from({ length: totalCards }).map((_, index) => (
        <View key={`progress-${index}`} className={`flex-1 rounded-full ${emptyColor}`}>
          <View
            className={`h-[3px] rounded-full ${index <= currentIndex ? filledColor : 'bg-transparent'}`}
          />
        </View>
      ))}
    </View>
  );
}

function FadingScrollView({ children, contentContainerStyle }: { children: React.ReactNode; contentContainerStyle?: any }) {
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Consider scrollable if content height is reasonably larger than scroll view height
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
  }, []);

  const bounceStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bounceValue.value }],
    };
  });

  return (
    <View className="flex-shrink">
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
        contentContainerStyle={[contentContainerStyle, { paddingBottom: 32 }]}
      >
        {children}
      </ScrollView>

      {/* Bottom Fade Mask */}
      {isScrollable && (
        <View
          pointerEvents="none"
          className="absolute bottom-[-10px] left-0 right-0 h-16"
        >
          {/* 
            TODO: Re-enable LinearGradient after running `npx expo run:ios` (or android).
            The app crashes because the native code for expo-linear-gradient isn't built into 
            your current dev client yet.
          */}
          {/* <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 1)']}
            style={{ flex: 1 }}
          /> */}
        </View>
      )}

      {/* Interactive Bottom-Right Scroll FAB */}
      {isScrollable ? (
        <View 
          pointerEvents="box-none"
          className="absolute bottom-4 right-4 items-center justify-center"
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
              style={{
                shadowColor: '#05290C',
                shadowOpacity: 0.1,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
                borderRadius: 9999,
              }}
            >
              <BlurView
                intensity={80}
                tint="light"
                className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-forest/10"
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
  cardIndex,
  totalCards,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  scrollable?: boolean;
  cardIndex?: number;
  totalCards?: number;
}) {
  const content = (
    <>
      {eyebrow ? (
        <Text className="mb-3 font-satoshi-bold text-[11px] uppercase tracking-[1.4px] text-forest/40">
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <Text className="mb-3 font-erode-semibold text-[24px] leading-[30px] text-forest">{title}</Text>
      ) : null}
      {children}
    </>
  );

  return (
    <View className="flex-shrink w-full rounded-3xl border border-forest/5 bg-white px-6 py-7" style={{ borderCurve: 'continuous' }}>
      <ProgressBar currentIndex={cardIndex} totalCards={totalCards} variant="light" />
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
  cardIndex,
  totalCards,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  cardIndex?: number;
  totalCards?: number;
}) {
  return (
    <View className="flex-shrink w-full rounded-3xl border border-forest/10 bg-sage px-6 py-7" style={{ borderCurve: 'continuous' }}>
      <ProgressBar currentIndex={cardIndex} totalCards={totalCards} variant="accent" />
      {eyebrow ? (
        <Text className="mb-3 font-satoshi-bold text-[11px] uppercase tracking-[1.4px] text-forest/40">
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <Text className="text-center font-erode-semibold text-[24px] leading-[30px] text-forest">
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
  cardIndex,
  totalCards,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  cardIndex?: number;
  totalCards?: number;
}) {
  return (
    <View className="flex-shrink w-full rounded-3xl bg-forest px-6 py-7" style={{ borderCurve: 'continuous' }}>
      <ProgressBar currentIndex={cardIndex} totalCards={totalCards} variant="dark" />
      {eyebrow ? (
        <Text className="mb-3 font-satoshi-bold text-[11px] uppercase tracking-[1.4px] text-white/50">
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <Text className="mb-3 font-erode-semibold text-[28px] leading-[34px] text-white">{title}</Text>
      ) : null}
      {children}
    </View>
  );
}

function PrimaryVisualButton({
  label,
  inverted = false,
}: {
  label: string;
  inverted?: boolean;
}) {
  return (
    <View
      className={`items-center rounded-2xl px-5 py-4 ${
        inverted ? 'bg-white' : 'bg-forest'
      }`}
    >
      <Text
        className={`font-satoshi-bold text-[15px] ${
          inverted ? 'text-forest' : 'text-white'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

function GhostVisualButton({ label }: { label: string }) {
  return (
    <View className="items-center rounded-2xl border border-gray-200 px-5 py-4">
      <Text className="font-satoshi text-[15px] text-forest/60">{label}</Text>
    </View>
  );
}

function DotList({
  items,
  textClassName = 'text-gray-700',
  itemClassName,
}: {
  items: string[];
  textClassName?: string;
  itemClassName?: string;
}) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} className={`flex-row items-start gap-4 py-2 ${index < items.length - 1 ? 'border-b border-forest/5' : ''} ${itemClassName ?? ''}`}>
          <View className="mt-[9px] h-[6px] w-[6px] rounded-full bg-[#CADCD6]" />
          <Text className={`flex-1 font-satoshi text-[15px] leading-7 ${textClassName}`}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function formatTimer(seconds?: number) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) {
    return null;
  }

  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
}

function formatAudioTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
}

function IntroCardView({ card, programName, cardIndex, totalCards }: { card: IntroCard; programName?: string; cardIndex?: number; totalCards?: number; }) {
  return (
    <View
      className="flex-shrink w-full rounded-[28px] border border-forest/5 bg-white px-7 pb-8 pt-9"
      style={{
        borderCurve: 'continuous',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 16 },
        elevation: 2,
      }}
    >
      <ProgressBar currentIndex={cardIndex} totalCards={totalCards} variant="light" />
      <Text className="mb-auto font-satoshi-bold text-[11px] uppercase tracking-[2.5px] text-forest/30">
        Day {card.dayNumber}
      </Text>

      <View>
        <Text
          className="mb-5 font-erode text-[44px] leading-[47px] text-forest"
          style={{ letterSpacing: -0.5 }}
        >
          {card.dayTitle}
        </Text>

        <Text className="mb-6 font-satoshi text-[17px] leading-[29px] text-gray-600">{card.goal}</Text>

        {card.estimatedMinutes || programName ? (
          <View className="flex-row items-center gap-4">
            {card.estimatedMinutes ? (
              <View className="rounded-full bg-forest/5 px-[14px] py-[6px]">
                <Text style={{ letterSpacing: 0.3 }} className="font-satoshi-medium text-[12px] text-forest/50">{`~${card.estimatedMinutes} min`}</Text>
              </View>
            ) : null}

            {card.estimatedMinutes && programName ? (
              <View className="h-[3px] w-[3px] rounded-full bg-forest/15" />
            ) : null}

            {programName ? (
              <Text style={{ letterSpacing: 0.3 }} className="font-satoshi-medium text-[12px] text-forest/30">{programName}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function LessonCardView({ card, cardIndex, totalCards }: { card: LessonCard; cardIndex?: number; totalCards?: number; }) {
  return (
    <View
      className="flex-shrink w-full rounded-[28px] border border-forest/5 bg-white px-7 py-9"
      style={{
        borderCurve: 'continuous',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 16 },
        elevation: 2,
      }}
    >
      <ProgressBar currentIndex={cardIndex} totalCards={totalCards} variant="light" />
      <FadingScrollView contentContainerStyle={{ flexGrow: 1 }}>

        <View className="mb-6 self-start rounded-md border border-forest/10 px-3 py-[5px]">
          <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.5px] text-forest/50">Context</Text>
        </View>

        <Text
          className="mb-6 font-erode text-[26px] leading-[31px] text-forest"
          style={{ letterSpacing: -0.3 }}
        >
          {card.title ?? 'Why timing matters'}
        </Text>

        <View className="mb-1">
          {card.paragraphs.map((paragraph, index) => {
            const isDuplicate = card.highlight && paragraph.trim() === card.highlight.trim();

            return (
              <React.Fragment key={`${paragraph}-${index}`}>
                {!isDuplicate ? (
                  <Text className="mb-5 font-satoshi text-[16px] font-light leading-[30px] text-gray-600">
                    {paragraph}
                  </Text>
                ) : null}

                {card.highlight && index === 1 ? (
                  <View className="my-7 border-l-2 border-forest py-6 pl-6">
                    <Text
                      className="font-erode-italic text-[22px] leading-[32px] text-forest/90"
                      style={{ letterSpacing: -0.2 }}
                    >
                      {card.highlight}
                    </Text>
                  </View>
                ) : null}
              </React.Fragment>
            );
          })}

          {card.highlight && card.paragraphs.length <= 1 ? (
            <View className="my-7 border-l-2 border-forest py-6 pl-6">
              <Text
                className="font-erode-italic text-[22px] leading-[32px] text-forest/90"
                style={{ letterSpacing: -0.2 }}
              >
                {card.highlight}
              </Text>
            </View>
          ) : null}
        </View>
      </FadingScrollView>
    </View>
  );
}

function ActionStepCardView({ card, cardIndex, totalCards }: { card: ActionStepCard; cardIndex?: number; totalCards?: number; }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <CardShell scrollable cardIndex={cardIndex} totalCards={totalCards}>
      <View className="mb-[20px] flex-row items-start gap-4">
        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest">
          <Text className="font-satoshi-bold text-[15px] text-white">{card.stepNumber}</Text>
        </View>
        <View className="flex-1 pt-1">
          <Text className="mb-1 font-satoshi-medium text-[20px] leading-[25px] text-forest">
            {card.title}
          </Text>
          {card.duration ? (
            <Text className="font-satoshi text-[13px] text-forest/40">{card.duration}</Text>
          ) : null}
        </View>
      </View>

      <View className="pl-[52px]">
        <DotList items={card.instructions} />

        {card.whyThisWorks ? (
          <Animated.View
            layout={LinearTransition.springify().damping(18).stiffness(130)}
            className="mt-[20px] overflow-hidden"
          >
            <Pressable
              className="flex-row items-center justify-between rounded-[16px] bg-[#F0F7F5] px-5 py-[18px]"
              onPress={() => setIsExpanded((value) => !value)}
            >
              <Text className="font-satoshi-bold text-[12px] uppercase tracking-[1px] text-forest/50">Why this works</Text>
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
                className="mt-2 rounded-[16px] bg-[#F0F7F5] px-5 py-[18px]"
              >
                <Text className="font-satoshi text-[14px] leading-[26px] text-gray-600">{card.whyThisWorks}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}

        {card.proTip ? (
          <View className="mt-3 flex-row items-start gap-2.5 rounded-[14px] border border-[#F0DFC0] bg-[#FEF9F0] px-[18px] py-[14px]">
            <Text className="mt-[1px] text-[16px] text-[#7A5C2E]">✦</Text>
            <Text className="flex-1 font-satoshi text-[13px] leading-[24px] text-[#7A5C2E]">
              {card.proTip}
            </Text>
          </View>
        ) : null}
      </View>
    </CardShell>
  );
}

function BreathingExerciseCardView({ card, cardIndex, totalCards }: { card: BreathingExerciseCard; cardIndex?: number; totalCards?: number; }) {
  return (
    <AccentCardShell eyebrow="Breathing exercise" title={card.title} cardIndex={cardIndex} totalCards={totalCards}>
      <View className="items-center py-8">
        <View className="h-40 w-40 items-center justify-center rounded-full border-2 border-forest/20 bg-sage">
          <Text className="font-erode-semibold-italic text-[18px] text-forest/60">Breathe in...</Text>
        </View>

        <Text className="mt-6 font-satoshi-medium text-sm text-forest/40">
          Cycle 1 of {card.cycles}
        </Text>

        <View className="mt-4 flex-row flex-wrap items-center justify-center gap-3">
          <Text className="font-satoshi text-[13px] text-gray-600">
            Inhale {card.pattern.inhaleSeconds}s
          </Text>
          {card.pattern.holdSeconds ? (
            <>
              <Text className="font-satoshi text-[13px] text-gray-600">·</Text>
              <Text className="font-satoshi text-[13px] text-gray-600">
                Hold {card.pattern.holdSeconds}s
              </Text>
            </>
          ) : null}
          <Text className="font-satoshi text-[13px] text-gray-600">·</Text>
          <Text className="font-satoshi text-[13px] text-gray-600">
            Exhale {card.pattern.exhaleSeconds}s
          </Text>
        </View>

        {card.instructions ? (
          <Text className="mt-6 text-center font-satoshi text-sm leading-6 text-gray-600">
            {card.instructions}
          </Text>
        ) : null}
      </View>
    </AccentCardShell>
  );
}

function MindfulnessExerciseCardView({ card, cardIndex, totalCards }: { card: MindfulnessExerciseCard; cardIndex?: number; totalCards?: number; }) {
  const timerLabel = formatTimer(card.timerSeconds) ?? card.duration ?? 'Take your time';

  return (
    <AccentCardShell
      eyebrow={card.duration ? `Grounding · ${card.duration}` : 'Mindfulness'}
      title={card.title}
      cardIndex={cardIndex}
      totalCards={totalCards}
    >
      <View className="py-6">
        <View>
          {card.steps.map((step, index) => (
            <View
              key={`${step}-${index}`}
              className={`items-center px-2 py-3 ${index < card.steps.length - 1 ? 'border-b border-forest/5' : ''}`}
            >
              <Text className="text-center font-satoshi text-[18px] leading-8 text-forest">{step}</Text>
            </View>
          ))}
        </View>

        <Text className="my-6 text-center font-satoshi text-5xl font-light tracking-[2px] text-forest">
          {timerLabel}
        </Text>

        <Text className="text-center font-satoshi text-sm text-forest/40">
          {card.completionMessage ?? "Take your time. There's no rush."}
        </Text>
      </View>
    </AccentCardShell>
  );
}

function ExerciseRoutineCardView({ card, cardIndex, totalCards }: { card: ExerciseRoutineCard; cardIndex?: number; totalCards?: number; }) {
  return (
    <CardShell
      eyebrow={`Routine${card.totalDuration ? ` · ${card.totalDuration}` : ''}`}
      title={card.title}
      cardIndex={cardIndex}
      totalCards={totalCards}
    >
      <View className="mt-1 gap-3">
        {card.exercises.map((exercise, index) => {
          const meta = [exercise.reps, exercise.duration, exercise.rest].filter(Boolean).join(' · ');

          return (
            <View
              key={`${exercise.name}-${index}`}
              className="rounded-2xl border border-gray-200 bg-surface px-5 py-4"
            >
              <Text className="mb-2 font-satoshi-bold text-base text-forest">{exercise.name}</Text>
              <View className="gap-1.5">
                {exercise.instructions.map((instruction, instructionIndex) => (
                  <Text
                    key={`${instruction}-${instructionIndex}`}
                    className="font-satoshi text-sm leading-6 text-gray-600"
                  >
                    {instruction}
                  </Text>
                ))}
              </View>
              {meta ? (
                <Text className="mt-3 font-satoshi text-[13px] text-forest/60">{meta}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </CardShell>
  );
}

function AudioCardView({ card, cardIndex, totalCards }: { card: AudioCard; cardIndex?: number; totalCards?: number; }) {
  return (
    <CardShell eyebrow="Guided meditation" title={card.title} cardIndex={cardIndex} totalCards={totalCards}>
      {card.description ? (
        <Text className="mb-5 font-satoshi text-sm leading-6 text-gray-600">{card.description}</Text>
      ) : null}
      <ProgramAudioPlayer
        audio={{
          storagePath: card.audioStoragePath,
          durationSeconds: card.durationSeconds,
        }}
      />

      {card.autoAdvance ? (
        <Text className="mt-3 text-center font-satoshi text-[13px] text-forest/60">
          Auto-advance enabled
        </Text>
      ) : null}
    </CardShell>
  );
}

function CalmTriggerCardView({ card, cardIndex, totalCards }: { card: CalmTriggerCard; cardIndex?: number; totalCards?: number; }) {
  return (
    <AccentCardShell eyebrow="CALM" title="Need a moment?" cardIndex={cardIndex} totalCards={totalCards}>
      <Text className="mb-5 mt-3 font-satoshi text-base leading-8 text-gray-700">{card.context}</Text>
      <PrimaryVisualButton label="Start 10-Minute Calm Session" />
    </AccentCardShell>
  );
}

function JournalCardView({ card, cardIndex, totalCards }: { card: JournalCard; cardIndex?: number; totalCards?: number; }) {
  const [value, setValue] = useState('');

  return (
    <CardShell eyebrow="Reflection · Optional" title={card.prompt} cardIndex={cardIndex} totalCards={totalCards}>
      {card.helperText ? (
        <Text className="mb-4 font-satoshi text-sm leading-6 text-gray-600">{card.helperText}</Text>
      ) : null}

      <TextInput
        multiline
        placeholder="Start writing..."
        placeholderTextColor="#9CA39E"
        value={value}
        onChangeText={setValue}
        textAlignVertical="top"
        className="min-h-[120px] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 font-satoshi text-base leading-7 text-forest"
      />

      <View className="mt-4 flex-row gap-3">
        <View className="flex-shrink">
          <PrimaryVisualButton label="Save & Continue" />
        </View>
        <View className="flex-shrink">
          <GhostVisualButton label="Skip" />
        </View>
      </View>

      {card.followUpPrompt ? (
        <Text className="mt-4 font-satoshi text-[13px] leading-5 text-forest/60">
          Follow-up: {card.followUpPrompt}
        </Text>
      ) : null}
    </CardShell>
  );
}

function CloseCardView({ card, cardIndex, totalCards }: { card: CloseCard; cardIndex?: number; totalCards?: number; }) {
  return (
    <DarkCardShell eyebrow="Today's close" title={card.message} cardIndex={cardIndex} totalCards={totalCards}>
      {card.secondaryMessage ? (
        <Text className="mb-6 font-satoshi text-sm leading-6 text-white/50">{card.secondaryMessage}</Text>
      ) : null}
      <PrimaryVisualButton label="Complete Day" inverted />
    </DarkCardShell>
  );
}

export function CardRenderer({
  card,
  programName,
  cardIndex,
  totalCards,
}: {
  card: ContentCard;
  programName?: string;
  cardIndex?: number;
  totalCards?: number;
}) {
  switch (card.type) {
    case 'intro':
      return <IntroCardView card={card} programName={programName} cardIndex={cardIndex} totalCards={totalCards} />;
    case 'lesson':
      return <LessonCardView card={card} cardIndex={cardIndex} totalCards={totalCards} />;
    case 'action_step':
      return <ActionStepCardView card={card} cardIndex={cardIndex} totalCards={totalCards} />;
    case 'breathing_exercise':
      return <BreathingExerciseCardView card={card} cardIndex={cardIndex} totalCards={totalCards} />;
    case 'mindfulness_exercise':
      return <MindfulnessExerciseCardView card={card} cardIndex={cardIndex} totalCards={totalCards} />;
    case 'exercise_routine':
      return <ExerciseRoutineCardView card={card} cardIndex={cardIndex} totalCards={totalCards} />;
    case 'audio':
      return <AudioCardView card={card} cardIndex={cardIndex} totalCards={totalCards} />;
    case 'calm_trigger':
      return <CalmTriggerCardView card={card} cardIndex={cardIndex} totalCards={totalCards} />;
    case 'journal':
      return <JournalCardView card={card} cardIndex={cardIndex} totalCards={totalCards} />;
    case 'close':
      return <CloseCardView card={card} cardIndex={cardIndex} totalCards={totalCards} />;
    default:
      return (
        <CardShell eyebrow="Unsupported card" title="Card type not mapped" cardIndex={cardIndex} totalCards={totalCards}>
          <Text className="font-satoshi text-base leading-7 text-gray-700">
            This card type is not yet wired in the renderer.
          </Text>
        </CardShell>
      );
  }
}
