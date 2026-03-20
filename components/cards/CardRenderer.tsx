import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

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

function CardShell({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
}) {
  return (
    <View className="rounded-3xl border border-forest/5 bg-white px-6 py-7">
      {eyebrow ? (
        <Text className="mb-3 font-satoshi-bold text-[11px] uppercase tracking-[1.4px] text-forest/40">
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <Text className="mb-3 font-erode-semibold text-[24px] leading-[30px] text-forest">{title}</Text>
      ) : null}
      {children}
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
    <View className="rounded-3xl border border-forest/10 bg-sage px-6 py-7">
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
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
}) {
  return (
    <View className="rounded-3xl bg-forest px-6 py-7">
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

function DurationBadge({ label, inverted = false }: { label: string; inverted?: boolean }) {
  return (
    <View
      className={`self-start rounded-full px-3 py-1.5 ${
        inverted ? 'bg-white/12' : 'bg-forest/5'
      }`}
    >
      <Text
        className={`font-satoshi-bold text-xs ${
          inverted ? 'text-white/70' : 'text-forest/60'
        }`}
      >
        {label}
      </Text>
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
    <View className="gap-2.5">
      {items.map((item, index) => (
        <View key={`${item}-${index}`} className={`flex-row gap-3 ${itemClassName ?? ''}`}>
          <View className="mt-2.5 h-[5px] w-[5px] rounded-full bg-forest/20" />
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

function IntroCardView({ card }: { card: IntroCard }) {
  return (
    <View className="rounded-3xl border border-forest/5 bg-white px-6 py-7">
      <Text className="mb-3 font-satoshi-bold text-[11px] uppercase tracking-[1.4px] text-forest/40">
        Day {card.dayNumber}
      </Text>
      <Text className="mb-6 font-erode-bold text-4xl leading-[44px] text-forest">{card.dayTitle}</Text>
      <Text className="mb-6 font-satoshi text-base leading-8 text-gray-700">{card.goal}</Text>
      {card.estimatedMinutes ? <DurationBadge label={`~${card.estimatedMinutes} min today`} /> : null}
    </View>
  );
}

function LessonCardView({ card }: { card: LessonCard }) {
  return (
    <CardShell eyebrow="Context" title={card.title ?? 'Lesson'}>
      <View className="gap-4">
        {card.paragraphs.map((paragraph, index) => (
          <Text
            key={`${paragraph}-${index}`}
            className="font-satoshi text-base leading-8 text-gray-700"
          >
            {paragraph}
          </Text>
        ))}
      </View>

      {card.highlight ? (
        <View className="mt-5 border-l-[3px] border-forest/20 pl-5">
          <Text className="font-erode-italic text-[20px] leading-8 text-forest/80">
            {card.highlight}
          </Text>
        </View>
      ) : null}
    </CardShell>
  );
}

function ActionStepCardView({ card }: { card: ActionStepCard }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <CardShell eyebrow="Step" title={card.title}>
      <View className="mb-4 flex-row items-center">
        <View className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-forest">
          <Text className="font-satoshi-bold text-[13px] text-white">{card.stepNumber}</Text>
        </View>
        <View className="flex-1 flex-row flex-wrap items-center">
          <Text className="font-satoshi-bold text-[18px] leading-6 text-forest">{card.title}</Text>
          {card.duration ? (
            <Text className="ml-2 font-satoshi text-[13px] text-forest/40">· {card.duration}</Text>
          ) : null}
        </View>
      </View>

      <View className="pl-10">
        <DotList items={card.instructions} />

        {card.whyThisWorks ? (
          <Animated.View
            layout={LinearTransition.duration(220).easing(Easing.inOut(Easing.ease))}
            className="mt-4 overflow-hidden"
          >
            <Pressable
              className="flex-row items-center justify-between rounded-2xl border border-forest/8 bg-forest/5 px-4 py-3"
              onPress={() => setIsExpanded((value) => !value)}
            >
              <Text className="font-satoshi-medium text-[13px] text-forest/60">Why this works</Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="rgba(5, 41, 12, 0.6)"
              />
            </Pressable>

            {isExpanded ? (
              <Animated.View
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(140)}
                className="mt-3 rounded-2xl bg-forest/5 p-4"
              >
                <Text className="font-satoshi text-sm leading-6 text-gray-600">{card.whyThisWorks}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}

        {card.proTip ? (
          <View className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Text className="font-satoshi text-[13px] leading-5 text-amber-800">
              Pro tip: {card.proTip}
            </Text>
          </View>
        ) : null}
      </View>
    </CardShell>
  );
}

function BreathingExerciseCardView({ card }: { card: BreathingExerciseCard }) {
  return (
    <AccentCardShell eyebrow="Breathing exercise" title={card.title}>
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

function MindfulnessExerciseCardView({ card }: { card: MindfulnessExerciseCard }) {
  const timerLabel = formatTimer(card.timerSeconds) ?? card.duration ?? 'Take your time';

  return (
    <AccentCardShell
      eyebrow={card.duration ? `Grounding · ${card.duration}` : 'Mindfulness'}
      title={card.title}
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

function ExerciseRoutineCardView({ card }: { card: ExerciseRoutineCard }) {
  return (
    <CardShell
      eyebrow={`Routine${card.totalDuration ? ` · ${card.totalDuration}` : ''}`}
      title={card.title}
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

function AudioCardView({ card }: { card: AudioCard }) {
  const totalTime = formatAudioTime(card.durationSeconds);
  const elapsedSeconds = Math.max(1, Math.floor(card.durationSeconds * 0.35));
  const elapsedTime = formatAudioTime(elapsedSeconds);
  const waveformHeights = [12, 20, 32, 24, 38, 28, 16, 30, 22, 35, 18, 25, 15, 28, 20, 32, 14, 26, 18, 22];

  return (
    <CardShell eyebrow="Guided meditation" title={card.title}>
      {card.description ? (
        <Text className="mb-5 font-satoshi text-sm leading-6 text-gray-600">{card.description}</Text>
      ) : null}

      <View className="rounded-2xl bg-forest/5 p-5">
        <View className="mb-3 flex-row items-end gap-[3px]">
          {waveformHeights.map((height, index) => (
            <View
              key={`waveform-${index}`}
              className={`w-1 rounded-full ${index < 10 ? 'bg-forest' : 'bg-forest/20'}`}
              style={{ height }}
            />
          ))}
        </View>

        <View className="mb-3 h-[3px] rounded-full bg-gray-200">
          <View className="h-[3px] w-[35%] rounded-full bg-forest" />
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="font-satoshi text-[13px] text-gray-600">{elapsedTime}</Text>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-forest">
            <Ionicons name="play" size={18} color="#FFFFFF" />
          </View>
          <Text className="font-satoshi text-[13px] text-gray-600">{totalTime}</Text>
        </View>

        {card.autoAdvance ? (
          <Text className="mt-3 text-center font-satoshi text-[13px] text-forest/60">
            Auto-advance enabled
          </Text>
        ) : null}
      </View>
    </CardShell>
  );
}

function CalmTriggerCardView({ card }: { card: CalmTriggerCard }) {
  return (
    <AccentCardShell eyebrow="CALM" title="Need a moment?">
      <Text className="mb-5 mt-3 font-satoshi text-base leading-8 text-gray-700">{card.context}</Text>
      <PrimaryVisualButton label="Start 10-Minute Calm Session" />
    </AccentCardShell>
  );
}

function JournalCardView({ card }: { card: JournalCard }) {
  const [value, setValue] = useState('');

  return (
    <CardShell eyebrow="Reflection · Optional" title={card.prompt}>
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
        <View className="flex-1">
          <PrimaryVisualButton label="Save & Continue" />
        </View>
        <View className="flex-1">
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

function CloseCardView({ card }: { card: CloseCard }) {
  return (
    <DarkCardShell eyebrow="Today's close" title={card.message}>
      {card.secondaryMessage ? (
        <Text className="mb-6 font-satoshi text-sm leading-6 text-white/50">{card.secondaryMessage}</Text>
      ) : null}
      <PrimaryVisualButton label="Complete Day" inverted />
    </DarkCardShell>
  );
}

export function CardRenderer({ card }: { card: ContentCard }) {
  switch (card.type) {
    case 'intro':
      return <IntroCardView card={card} />;
    case 'lesson':
      return <LessonCardView card={card} />;
    case 'action_step':
      return <ActionStepCardView card={card} />;
    case 'breathing_exercise':
      return <BreathingExerciseCardView card={card} />;
    case 'mindfulness_exercise':
      return <MindfulnessExerciseCardView card={card} />;
    case 'exercise_routine':
      return <ExerciseRoutineCardView card={card} />;
    case 'audio':
      return <AudioCardView card={card} />;
    case 'calm_trigger':
      return <CalmTriggerCardView card={card} />;
    case 'journal':
      return <JournalCardView card={card} />;
    case 'close':
      return <CloseCardView card={card} />;
    default:
      return null;
  }
}
