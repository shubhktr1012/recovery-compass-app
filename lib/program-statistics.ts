import { OnboardingResponse } from '@/hooks/useOnboardingResponse';
import { formatInr, getOnboardingProjection } from '@/lib/onboarding-metrics';
import { getJourneyConfig } from '@/lib/onboarding.config';
import type { JourneyKey } from '@/lib/onboarding.types';
import type { ProgramSlug } from '@/lib/programs/types';

type QuestionnaireAnswerValue = string | string[] | null | undefined;

export interface QuestionnaireAnswersSnapshot {
  answers?: Record<string, QuestionnaireAnswerValue>;
  journey?: JourneyKey | null;
  recommendedProgram?: ProgramSlug | null;
}

export interface ProgramStatisticCard {
  id: string;
  label: string;
  value: string;
}

export interface ProgramStatisticsSummary {
  journey: JourneyKey;
  cards: ProgramStatisticCard[];
}

function getJourneyForProgram(programSlug: ProgramSlug | null | undefined): JourneyKey | null {
  switch (programSlug) {
    case 'six_day_reset':
    case 'ninety_day_transform':
      return 'smoking';
    case 'sleep_disorder_reset':
      return 'sleep_disorder_reset';
    case 'energy_vitality':
      return 'energy_vitality';
    case 'age_reversal':
      return 'age_reversal';
    case 'male_sexual_health':
      return 'male_sexual_health';
    default:
      return null;
  }
}

function isSameMetricScope(left: ProgramSlug, right: ProgramSlug) {
  return getJourneyForProgram(left) === getJourneyForProgram(right);
}

function isProgramSlug(value: unknown): value is ProgramSlug {
  return (
    value === 'six_day_reset' ||
    value === 'ninety_day_transform' ||
    value === 'sleep_disorder_reset' ||
    value === 'energy_vitality' ||
    value === 'age_reversal' ||
    value === 'male_sexual_health'
  );
}

function isQuestionnaireScopedToProgram(
  questionnaireAnswers: QuestionnaireAnswersSnapshot | null | undefined,
  programSlug: ProgramSlug
) {
  if (!questionnaireAnswers) {
    return false;
  }

  if (
    isProgramSlug(questionnaireAnswers.recommendedProgram) &&
    isSameMetricScope(questionnaireAnswers.recommendedProgram, programSlug)
  ) {
    return true;
  }

  return questionnaireAnswers.journey === getJourneyForProgram(programSlug);
}

function getProgramSlugFromTargetSelection(targetSelection: string | null | undefined): ProgramSlug | null {
  const normalizedTarget = targetSelection?.trim().toLowerCase() ?? '';

  if (!normalizedTarget) {
    return null;
  }

  if (normalizedTarget.includes('6-day') || normalizedTarget.includes('6 day')) {
    return 'six_day_reset';
  }

  if (normalizedTarget.includes('smoking')) {
    return 'ninety_day_transform';
  }

  if (normalizedTarget.includes('sleep')) {
    return 'sleep_disorder_reset';
  }

  if (normalizedTarget.includes('energy')) {
    return 'energy_vitality';
  }

  if (normalizedTarget.includes('biohacking') || normalizedTarget.includes('age')) {
    return 'age_reversal';
  }

  if (normalizedTarget.includes('men') || normalizedTarget.includes('sexual')) {
    return 'male_sexual_health';
  }

  return null;
}

function isOnboardingResponseScopedToProgram(
  onboardingResponse: OnboardingResponse | null | undefined,
  programSlug: ProgramSlug
) {
  const responseProgramSlug = getProgramSlugFromTargetSelection(onboardingResponse?.target_selection);

  return responseProgramSlug ? isSameMetricScope(responseProgramSlug, programSlug) : false;
}

function getAnswerLabel(
  questionnaireAnswers: QuestionnaireAnswersSnapshot | null | undefined,
  questionId: string
) {
  const value = questionnaireAnswers?.answers?.[questionId];

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }

  return value ?? null;
}

function formatCount(value: number | null, fallback = 'Not set') {
  if (!value || value <= 0) {
    return fallback;
  }

  return String(value);
}

export function getProgramStatisticsSummary(
  programSlug: ProgramSlug | null | undefined,
  onboardingResponse: OnboardingResponse | null,
  questionnaireAnswers?: QuestionnaireAnswersSnapshot | null
): ProgramStatisticsSummary | null {
  if (!isProgramSlug(programSlug)) {
    return null;
  }

  const journey = getJourneyForProgram(programSlug);

  if (!journey) {
    return null;
  }

  const scopedOnboardingResponse = isOnboardingResponseScopedToProgram(onboardingResponse, programSlug)
    ? onboardingResponse
    : null;
  const scopedQuestionnaireAnswers = isQuestionnaireScopedToProgram(questionnaireAnswers, programSlug)
    ? questionnaireAnswers
    : null;
  const projection = getOnboardingProjection(scopedOnboardingResponse);
  const questions = getJourneyConfig(journey).questions;

  if (journey === 'smoking') {
    return {
      journey,
      cards: [
        {
          id: 'daily-cigarettes',
          label: 'Daily cigarettes',
          value: formatCount(projection.dailyAmount),
        },
        {
          id: 'daily-spend',
          label: 'Daily spend',
          value: projection.dailyCost > 0 ? formatInr(projection.dailyCost) : 'Not set',
        },
        {
          id: 'ninety-day-savings',
          label: '90-day savings',
          value: projection.projectedSavings90Days > 0 ? formatInr(projection.projectedSavings90Days) : 'Not set',
        },
      ],
    };
  }

  if (journey === 'sleep_disorder_reset') {
    return {
      journey,
      cards: [
        {
          id: 'sleep-affected-nights',
          label: 'Nights affected weekly',
          value: String(getAnswerLabel(scopedQuestionnaireAnswers, questions.severity.id) ?? 'Not set'),
        },
        {
          id: 'daily-reliance',
          label: 'Daily reliance count',
          value: formatCount(projection.dailyAmount),
        },
        {
          id: 'sleep-coping',
          label: 'Current coping loop',
          value: String(getAnswerLabel(scopedQuestionnaireAnswers, questions.coping.id) ?? 'Not set'),
        },
      ],
    };
  }

  if (journey === 'energy_vitality') {
    return {
      journey,
      cards: [
        {
          id: 'energy-caffeine',
          label: 'Daily caffeine baseline',
          value: String(getAnswerLabel(scopedQuestionnaireAnswers, 'energy_caffeine_count') ?? 'Not set'),
        },
        {
          id: 'energy-severity',
          label: 'Desk or screen load',
          value: String(getAnswerLabel(scopedQuestionnaireAnswers, questions.severity.id) ?? 'Not set'),
        },
        {
          id: 'energy-coping',
          label: 'Current fallback',
          value: String(getAnswerLabel(scopedQuestionnaireAnswers, questions.coping.id) ?? 'Not set'),
        },
      ],
    };
  }

  if (journey === 'age_reversal') {
    return {
      journey,
      cards: [
        {
          id: 'age-disconnect',
          label: 'Always-on load',
          value: String(getAnswerLabel(scopedQuestionnaireAnswers, questions.lifestyle.id) ?? 'Not set'),
        },
        {
          id: 'age-severity',
          label: 'Screen-hour load',
          value: String(getAnswerLabel(scopedQuestionnaireAnswers, questions.severity.id) ?? 'Not set'),
        },
        {
          id: 'age-coping',
          label: 'Current survival habit',
          value: String(getAnswerLabel(scopedQuestionnaireAnswers, questions.coping.id) ?? 'Not set'),
        },
      ],
    };
  }

  return {
    journey,
    cards: [
      {
        id: 'male-severity',
        label: 'Weekly impact frequency',
        value: String(getAnswerLabel(scopedQuestionnaireAnswers, questions.severity.id) ?? 'Not set'),
      },
      {
        id: 'male-trigger',
        label: 'Main trigger',
        value: String(getAnswerLabel(scopedQuestionnaireAnswers, questions.trigger.id) ?? 'Not set'),
      },
      {
        id: 'male-coping',
        label: 'Default response',
        value: String(getAnswerLabel(scopedQuestionnaireAnswers, questions.coping.id) ?? 'Not set'),
      },
    ],
  };
}
