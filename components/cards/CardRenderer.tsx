import React from 'react';
import { Text, View } from 'react-native';

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
  title: string;
}) {
  return (
    <View className="rounded-3xl border border-gray-200 bg-white p-5">
      {eyebrow ? (
        <Text className="mb-2 font-satoshi-bold text-xs uppercase tracking-wide text-forest/60">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="mb-3 font-erode-semibold text-3xl text-forest">{title}</Text>
      {children}
    </View>
  );
}

function BulletList({
  items,
  textClassName = 'text-gray-700',
}: {
  items: string[];
  textClassName?: string;
}) {
  return (
    <View className="gap-3">
      {items.map((item, index) => (
        <View key={`${item}-${index}`} className="flex-row gap-3">
          <Text className={`font-satoshi-bold text-base ${textClassName}`}>•</Text>
          <Text className={`flex-1 font-satoshi text-base leading-7 ${textClassName}`}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function IntroCardView({ card }: { card: IntroCard }) {
  return (
    <View className="rounded-3xl bg-sage p-6">
      <Text className="mb-2 font-satoshi-bold text-xs uppercase tracking-wide text-forest/60">
        Day {card.dayNumber}
      </Text>
      <Text className="mb-3 font-erode-bold text-4xl text-forest">{card.dayTitle}</Text>
      <Text className="font-satoshi text-base leading-7 text-gray-700">{card.goal}</Text>
      {card.estimatedMinutes ? (
        <Text className="mt-4 font-satoshi-bold text-sm text-forest/70">
          About {card.estimatedMinutes} min
        </Text>
      ) : null}
    </View>
  );
}

function LessonCardView({ card }: { card: LessonCard }) {
  return (
    <CardShell eyebrow="Lesson" title={card.title ?? 'Lesson'}>
      <View className="gap-3">
        {card.paragraphs.map((paragraph, index) => (
          <Text key={`${paragraph}-${index}`} className="font-satoshi text-base leading-7 text-gray-700">
            {paragraph}
          </Text>
        ))}
      </View>
      {card.highlight ? (
        <View className="mt-4 rounded-2xl bg-sage p-4">
          <Text className="font-satoshi-bold text-base leading-7 text-forest">{card.highlight}</Text>
        </View>
      ) : null}
    </CardShell>
  );
}

function ActionStepCardView({ card }: { card: ActionStepCard }) {
  return (
    <CardShell eyebrow={`Step ${card.stepNumber}${card.duration ? ` · ${card.duration}` : ''}`} title={card.title}>
      <BulletList items={card.instructions} />
      {card.whyThisWorks ? (
        <View className="mt-4 rounded-2xl bg-surface p-4">
          <Text className="mb-1 font-satoshi-bold text-sm uppercase tracking-wide text-forest/60">
            Why this works
          </Text>
          <Text className="font-satoshi text-base leading-7 text-gray-700">{card.whyThisWorks}</Text>
        </View>
      ) : null}
      {card.proTip ? (
        <Text className="mt-4 font-satoshi text-sm leading-6 text-forest/70">Pro tip: {card.proTip}</Text>
      ) : null}
    </CardShell>
  );
}

function BreathingExerciseCardView({ card }: { card: BreathingExerciseCard }) {
  return (
    <CardShell eyebrow="Breathing exercise" title={card.title}>
      <View className="mb-4 rounded-2xl bg-sage p-4">
        <Text className="font-satoshi text-base leading-7 text-gray-700">
          Inhale {card.pattern.inhaleSeconds}s
          {card.pattern.holdSeconds ? ` · Hold ${card.pattern.holdSeconds}s` : ''}
          {' · '}
          Exhale {card.pattern.exhaleSeconds}s
        </Text>
        <Text className="mt-2 font-satoshi-bold text-sm text-forest/70">{card.cycles} cycles</Text>
      </View>
      {card.instructions ? (
        <Text className="font-satoshi text-base leading-7 text-gray-700">{card.instructions}</Text>
      ) : null}
    </CardShell>
  );
}

function MindfulnessExerciseCardView({ card }: { card: MindfulnessExerciseCard }) {
  return (
    <CardShell eyebrow={`Mindfulness${card.duration ? ` · ${card.duration}` : ''}`} title={card.title}>
      <BulletList items={card.steps} />
      {card.completionMessage ? (
        <Text className="mt-4 font-satoshi-bold text-base leading-7 text-forest">{card.completionMessage}</Text>
      ) : null}
    </CardShell>
  );
}

function ExerciseRoutineCardView({ card }: { card: ExerciseRoutineCard }) {
  return (
    <CardShell eyebrow={`Routine${card.totalDuration ? ` · ${card.totalDuration}` : ''}`} title={card.title}>
      <View className="gap-4">
        {card.exercises.map((exercise, index) => (
          <View key={`${exercise.name}-${index}`} className="rounded-2xl bg-surface p-4">
            <Text className="mb-2 font-satoshi-bold text-base text-forest">{exercise.name}</Text>
            <BulletList items={exercise.instructions} />
            <Text className="mt-3 font-satoshi text-sm text-forest/70">
              {[exercise.reps, exercise.duration, exercise.rest].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ))}
      </View>
    </CardShell>
  );
}

function AudioCardView({ card }: { card: AudioCard }) {
  return (
    <CardShell eyebrow="Audio" title={card.title}>
      {card.description ? (
        <Text className="mb-4 font-satoshi text-base leading-7 text-gray-700">{card.description}</Text>
      ) : null}
      <View className="rounded-2xl bg-surface p-4">
        <Text className="font-satoshi text-base leading-7 text-gray-700">
          Source: {card.audioStoragePath}
        </Text>
        <Text className="mt-2 font-satoshi-bold text-sm text-forest/70">
          Duration: {Math.round(card.durationSeconds / 60)} min preview
        </Text>
        {card.autoAdvance ? (
          <Text className="mt-2 font-satoshi text-sm text-forest/70">Auto-advance enabled</Text>
        ) : null}
      </View>
    </CardShell>
  );
}

function CalmTriggerCardView({ card }: { card: CalmTriggerCard }) {
  return (
    <CardShell eyebrow="CALM trigger" title="Need a reset?">
      <Text className="font-satoshi text-base leading-7 text-gray-700">{card.context}</Text>
      <Text className="mt-4 font-satoshi text-sm leading-6 text-forest/70">
        This card will launch the shared CALM flow in a later phase.
      </Text>
    </CardShell>
  );
}

function JournalCardView({ card }: { card: JournalCard }) {
  return (
    <CardShell eyebrow="Journal" title="Reflection">
      <Text className="font-satoshi-bold text-base leading-7 text-forest">{card.prompt}</Text>
      {card.helperText ? (
        <Text className="mt-3 font-satoshi text-base leading-7 text-gray-700">{card.helperText}</Text>
      ) : null}
      {card.followUpPrompt ? (
        <Text className="mt-4 font-satoshi text-sm leading-6 text-forest/70">
          Follow-up: {card.followUpPrompt}
        </Text>
      ) : null}
    </CardShell>
  );
}

function CloseCardView({ card }: { card: CloseCard }) {
  return (
    <View className="rounded-3xl bg-forest p-5">
      <Text className="mb-2 font-satoshi-bold text-xs uppercase tracking-wide text-white/70">
        Gentle close
      </Text>
      <Text className="mb-3 font-erode-semibold text-3xl text-white">{card.message}</Text>
      {card.secondaryMessage ? (
        <Text className="font-satoshi text-base leading-7 text-white/85">{card.secondaryMessage}</Text>
      ) : null}
    </View>
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
