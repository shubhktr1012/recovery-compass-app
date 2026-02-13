export interface ProgramDay {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
}

export const PROGRAM_DAYS: ProgramDay[] = [
  {
    id: 1,
    title: 'Reset Your Environment',
    description: 'Remove smoking cues from your home, car, and work setup.',
    durationMinutes: 10,
  },
  {
    id: 2,
    title: 'Craving Interruption Drill',
    description: 'Practice a 90-second breathing cycle when an urge appears.',
    durationMinutes: 8,
  },
  {
    id: 3,
    title: 'Trigger Mapping',
    description: 'Write the top 3 moments where cravings are strongest today.',
    durationMinutes: 12,
  },
  {
    id: 4,
    title: 'Hydration and Walk',
    description: 'Use a short walk and water break to interrupt old routines.',
    durationMinutes: 15,
  },
  {
    id: 5,
    title: 'Stress Exit Plan',
    description: 'Create a one-step plan for stress spikes before they happen.',
    durationMinutes: 12,
  },
  {
    id: 6,
    title: 'Social Script Practice',
    description: 'Prepare one line to decline cigarettes in social settings.',
    durationMinutes: 10,
  },
  {
    id: 7,
    title: 'Week One Reflection',
    description: 'Review your wins and identify one pattern to improve next week.',
    durationMinutes: 15,
  },
  {
    id: 8,
    title: 'Sleep and Recovery Check',
    description: 'Tune your evening routine to reduce fatigue-based cravings.',
    durationMinutes: 10,
  },
  {
    id: 9,
    title: 'Reward Rewire',
    description: 'Pick a healthy reward for each smoke-free milestone hit this week.',
    durationMinutes: 8,
  },
  {
    id: 10,
    title: 'Future-Self Commitment',
    description: 'Write a short note to your future self for days when motivation dips.',
    durationMinutes: 12,
  },
];
