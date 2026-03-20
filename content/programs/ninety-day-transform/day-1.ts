import type { DayContent } from '@/types/content';

export const ninetyDayTransformDay1: DayContent = {
  programSlug: 'ninety_day_transform',
  dayNumber: 1,
  dayTitle: 'Arriving',
  estimatedMinutes: 7,
  cards: [
    {
      type: 'intro',
      dayNumber: 1,
      dayTitle: 'Arriving',
      goal: 'Arrive calmly and honestly, without pressure to fix everything today.',
      estimatedMinutes: 7,
    },
    {
      type: 'lesson',
      title: 'Day 1 principle',
      paragraphs: [
        'You are not here to change everything at once. You are here to notice where you are without pushing or performing.',
        'The first day succeeds if it creates a little space between you and your habits.',
      ],
      highlight: 'Nothing needs to change right now. Simply arriving is enough.',
    },
    {
      type: 'audio',
      title: 'One Minute of Arriving',
      description: 'A guided settling-in audio that introduces awareness without pressure.',
      audioStoragePath: 'ninety-day/day-001.mp3',
      durationSeconds: 420,
    },
    {
      type: 'mindfulness_exercise',
      title: 'Gentle arrival check-in',
      duration: '1 min',
      steps: [
        'Notice the surface beneath you and the support under your body.',
        'Let your breath continue naturally without trying to control it.',
        'If thoughts appear, notice them and return to one point of focus on the breath.',
      ],
      completionMessage: 'Awareness is enough for today.',
    },
    {
      type: 'journal',
      prompt: 'What made you start today?',
      helperText: 'There is no right answer. Write as little or as much as you want.',
    },
    {
      type: 'close',
      message: 'You showed up today. That matters more than how today went.',
      secondaryMessage: 'Come back later today or tomorrow. There is nothing else to prove right now.',
    },
  ],
};
