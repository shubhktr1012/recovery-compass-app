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
  const journey = getJourneyForProgram(programSlug);

  if (!journey) {
    return null;
  }

  const projection = getOnboardingProjection(onboardingResponse);
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
          id: 'daily-reliance',
          label: 'Daily reliance count',
          value: formatCount(projection.dailyAmount),
        },
        {
          id: 'sleep-trigger',
          label: 'Main sleep disruptor',
          value: String(getAnswerLabel(questionnaireAnswers, questions.trigger.id) ?? 'Not set'),
        },
        {
          id: 'sleep-coping',
          label: 'Current coping loop',
          value: String(getAnswerLabel(questionnaireAnswers, questions.coping.id) ?? 'Not set'),
        },
      ],
    };
  }

  if (journey === 'energy_vitality') {
    return {
      journey,
      cards: [
        {
          id: 'energy-severity',
          label: 'Desk or screen load',
          value: String(getAnswerLabel(questionnaireAnswers, questions.severity.id) ?? 'Not set'),
        },
        {
          id: 'energy-trigger',
          label: 'Biggest daily drain',
          value: String(getAnswerLabel(questionnaireAnswers, questions.trigger.id) ?? 'Not set'),
        },
        {
          id: 'energy-coping',
          label: 'Current fallback',
          value: String(getAnswerLabel(questionnaireAnswers, questions.coping.id) ?? 'Not set'),
        },
      ],
    };
  }

  if (journey === 'age_reversal') {
    return {
      journey,
      cards: [
        {
          id: 'age-severity',
          label: 'Screen-hour load',
          value: String(getAnswerLabel(questionnaireAnswers, questions.severity.id) ?? 'Not set'),
        },
        {
          id: 'age-trigger',
          label: 'Hardest drain to recover from',
          value: String(getAnswerLabel(questionnaireAnswers, questions.trigger.id) ?? 'Not set'),
        },
        {
          id: 'age-coping',
          label: 'Current survival habit',
          value: String(getAnswerLabel(questionnaireAnswers, questions.coping.id) ?? 'Not set'),
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
        value: String(getAnswerLabel(questionnaireAnswers, questions.severity.id) ?? 'Not set'),
      },
      {
        id: 'male-trigger',
        label: 'Main trigger',
        value: String(getAnswerLabel(questionnaireAnswers, questions.trigger.id) ?? 'Not set'),
      },
      {
        id: 'male-coping',
        label: 'Default response',
        value: String(getAnswerLabel(questionnaireAnswers, questions.coping.id) ?? 'Not set'),
      },
    ],
  };
}
