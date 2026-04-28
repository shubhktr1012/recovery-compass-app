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
  priceString?: string;
  /** Label for the recommendation stats row, e.g. "10–15" */
  dailyMinutesLabel: string;
  /** Number of program phases for the recommendation stats row */
  phaseCount: number;
}

export interface IntroCard {
  type: 'intro';
  dayNumber: number;
  dayTitle: string;
  goal: string;
  estimatedMinutes?: number;
  /** Optional phase label shown in the top pill, e.g. "Phase 1 · Foundation" */
  phase?: string;
  /** Phase number for Age Reversal program */
  phaseNumber?: number;
  /** Optional structured params for the bottom metric boxes (legacy) */
  params?: { value: string; label: string }[];
  /**
   * Age Reversal format: structured parameters object.
   * Renderer converts this to { value, label } pairs automatically.
   */
  parameters?: {
    sets?: number;
    reps?: number;
    holdSeconds?: number;
    durationMinutes?: number;
    [key: string]: number | string | undefined;
  };
}

export interface LessonCard {
  type: 'lesson';
  title?: string;
  paragraphs: string[];
  highlight?: string;
  /** Optional pull quote displayed as an editorial callout */
  pullQuote?: string | null;
}

export interface ActionStepCard {
  type: 'action_step';
  stepNumber?: number;
  /** Age Reversal format: e.g. "Step 1 · Body Circulation" */
  stepLabel?: string;
  title: string;
  /** Age Reversal format: short subtitle below the title */
  subtitle?: string;
  duration?: string;
  instructions: string[];
  whyThisWorks?: string;
  proTip?: string;
  /** Age Reversal format: why this step matters, shown as a callout */
  purpose?: string;
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
  /** Age Reversal format: short descriptor below title */
  subtitle?: string;
  steps: string[];
  timerSeconds?: number | null;
  completionMessage?: string;
  /** Age Reversal format: list of benefits shown as a pill-row */
  benefits?: string[];
}

/**
 * Supports both formats:
 *
 * Legacy (array-of-exercises): uses `exercises[]`
 * Age Reversal (single-exercise): uses top-level `name`, `steps`, `sets`, etc.
 */
export interface ExerciseRoutineCard {
  type: 'exercise_routine';
  // ── Legacy format ──
  title?: string;
  totalDuration?: string;
  exercises?: {
    name: string;
    instructions: string[];
    reps?: string;
    duration?: string;
    rest?: string;
  }[];
  // ── Age Reversal single-exercise format ──
  /** Exercise category label, e.g. "Isometric Hold" */
  category?: string;
  /** Exercise name, e.g. "Cheek Lift Hold" */
  name?: string;
  /** Muscle group targeted */
  targetMuscle?: string;
  /** Step-by-step instructions as an array */
  steps?: string[];
  sets?: number;
  reps?: number;
  holdSeconds?: number;
  /** Science / physiology note shown at the bottom */
  scienceNote?: string;
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
