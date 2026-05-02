import type { ProgramSlug } from '@/lib/programs/types';

export const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'] as const;

export type GenderOption = (typeof GENDER_OPTIONS)[number];

export type OnboardingPath = 'self_select' | 'guided_recommendation';

export type JourneyKey =
  | 'smoking'
  | 'sleep_disorder_reset'
  | 'energy_vitality'
  | 'age_reversal'
  | 'male_sexual_health';

export type GuidedIssueId =
  | 'cravings_smoking_urges'
  | 'poor_sleep'
  | 'low_energy'
  | 'brain_fog'
  | 'stress_overload'
  | 'weight_gain_slowed_metabolism'
  | 'low_libido_poor_performance';

export type SecondarySymptomId = GuidedIssueId;

export interface SelectionOption<Value extends string = string> {
  id: Value;
  label: string;
  description?: string;
}

export type QuestionType = 'single_select' | 'multi_select' | 'number_input' | 'compound_number_input';

export interface QuestionDefinition<OptionId extends string = string> {
  id: string;
  title: string;
  description: string;
  type: QuestionType;
  options?: SelectionOption<OptionId>[];
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  required?: boolean;
  allowEmpty?: boolean;
  inputs?: { id: string; label: string; placeholder?: string }[];
  customOptionId?: string;
  customInputId?: string;
  customInputLabel?: string;
  customInputPlaceholder?: string;
}

export interface JourneyRecommendation {
  title: string;
  subtitle: string;
  whyFits: string;
  focusLabel: string;
  focusPoints: string[];
}

export interface JourneyQuestionSet {
  duration: QuestionDefinition;
  friction: QuestionDefinition;
  lifestyle: QuestionDefinition;
  trigger: QuestionDefinition;
  severity: QuestionDefinition;
  baseline?: QuestionDefinition[];
  spend?: QuestionDefinition;
  coping: QuestionDefinition;
  outcome?: QuestionDefinition;
  startReason: QuestionDefinition;
}

export interface JourneyConfig {
  selectionLabel: string;
  selectionDescription: string;
  primaryGoal: string;
  recommendation: JourneyRecommendation;
  questions: JourneyQuestionSet;
}

export interface OnboardingAnswers {
  name: string;
  age: string;
  gender: GenderOption | '';
  path: OnboardingPath | null;
  selfSelectJourney: JourneyKey | null;
  guidedMainIssue: GuidedIssueId | null;
  questionValues: Record<string, string | string[]>;
}

export type OnboardingStep =
  | {
      id: 'quick_profile';
      type: 'quick_profile';
      title: string;
      description: string;
    }
  | {
      id: 'path_choice';
      type: 'path_choice';
      title: string;
      description: string;
      options: SelectionOption<OnboardingPath>[];
    }
  | {
      id: 'program_choice';
      type: 'program_choice';
      title: string;
      description: string;
      options: SelectionOption<JourneyKey>[];
    }
  | {
      id: 'guided_issue';
      type: 'guided_issue';
      title: string;
      description: string;
      options: SelectionOption<GuidedIssueId>[];
    }
  | {
      id: string;
      type: 'question';
      title: string;
      description: string;
      question: QuestionDefinition;
    }
  | {
      id: 'recommendation';
      type: 'recommendation';
      title: string;
      description: string;
      journey: JourneyKey;
      recommendation: JourneyRecommendation;
    };

export interface OnboardingResolution {
  journey: JourneyKey | null;
  recommendedProgram: ProgramSlug | null;
  primaryConcernLabel: string | null;
}
