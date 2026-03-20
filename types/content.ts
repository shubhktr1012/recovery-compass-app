export type ProgramSlug =
  | 'six_day_reset'
  | 'ninety_day_transform'
  | 'sleep_disorder_reset'
  | 'energy_vitality'
  | 'age_reversal'
  | 'male_sexual_health';

export type ProgramCategory =
  | 'smoking'
  | 'sleep'
  | 'energy'
  | 'aging'
  | 'sexual_health';

export type ProgramContentStatus = 'sample' | 'ready' | 'placeholder';

export interface ProgramCatalogEntry {
  slug: ProgramSlug;
  name: string;
  description: string;
  totalDays: number;
  category: ProgramCategory;
  hasAudio: boolean;
  contentStatus: ProgramContentStatus;
}

export interface IntroCard {
  type: 'intro';
  dayNumber: number;
  dayTitle: string;
  goal: string;
  estimatedMinutes?: number;
}

export interface LessonCard {
  type: 'lesson';
  title?: string;
  paragraphs: string[];
  highlight?: string;
}

export interface ActionStepCard {
  type: 'action_step';
  stepNumber: number;
  title: string;
  duration?: string;
  instructions: string[];
  whyThisWorks?: string;
  proTip?: string;
}

export interface BreathingExerciseCard {
  type: 'breathing_exercise';
  title: string;
  pattern: {
    inhaleSeconds: number;
    holdSeconds?: number;
    exhaleSeconds: number;
  };
  cycles: number;
  instructions?: string;
}

export interface MindfulnessExerciseCard {
  type: 'mindfulness_exercise';
  title: string;
  duration?: string;
  steps: string[];
  timerSeconds?: number;
  completionMessage?: string;
}

export interface ExerciseRoutineCard {
  type: 'exercise_routine';
  title: string;
  totalDuration?: string;
  exercises: {
    name: string;
    instructions: string[];
    reps?: string;
    duration?: string;
    rest?: string;
  }[];
}

export interface AudioCard {
  type: 'audio';
  title: string;
  description?: string;
  audioStoragePath: string;
  durationSeconds: number;
  autoAdvance?: boolean;
}

export interface CalmTriggerCard {
  type: 'calm_trigger';
  context: string;
}

export interface JournalCard {
  type: 'journal';
  prompt: string;
  helperText?: string;
  followUpPrompt?: string;
}

export interface CloseCard {
  type: 'close';
  message: string;
  secondaryMessage?: string;
}

export type ContentCard =
  | IntroCard
  | LessonCard
  | ActionStepCard
  | BreathingExerciseCard
  | MindfulnessExerciseCard
  | ExerciseRoutineCard
  | AudioCard
  | CalmTriggerCard
  | JournalCard
  | CloseCard;

export interface DayContent {
  programSlug: ProgramSlug;
  dayNumber: number;
  dayTitle: string;
  estimatedMinutes?: number;
  cards: ContentCard[];
}

export interface ProgramContent extends ProgramCatalogEntry {
  days: DayContent[];
}
