import type { OnboardingResponse } from '@/hooks/useOnboardingResponse';
import { formatInr, getOnboardingProjection } from '@/lib/onboarding-metrics';
import type { QuestionnaireAnswersSnapshot } from '@/lib/program-statistics';
import type { ProgramSlug } from '@/lib/programs/types';

export type DashboardStatItemState = 'ready' | 'pending' | 'fallback';

export interface DashboardStatItem {
  id: string;
  label: string;
  value: string;
  sublabel?: string | null;
  state?: DashboardStatItemState;
}

interface DashboardStatContext {
  onboardingResponse: OnboardingResponse | null;
  questionnaireAnswers: QuestionnaireAnswersSnapshot | null;
}

interface ResolveDashboardStatItemsArgs extends DashboardStatContext {
  programSlug: ProgramSlug;
  currentDayNumber: number;
  dailySteps?: {
    isLoading: boolean;
    permissionState: string | null | undefined;
    steps: number | null | undefined;
  } | null;
  totalDays: number;
  completedDays: number[];
  partialDays: number[];
  hasAudio: boolean;
  isBaselineLoading: boolean;
}

interface MetricSpec {
  id: string;
  label: string;
  resolve: (context: DashboardStatContext) => string | null;
}

function getQuestionnaireAnswer(
  questionnaireAnswers: QuestionnaireAnswersSnapshot | null | undefined,
  questionId: string
) {
  const value = questionnaireAnswers?.answers?.[questionId];

  if (Array.isArray(value)) {
    const filtered = value.filter(Boolean);
    return filtered.length ? filtered.join(', ') : null;
  }

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getCurrentStreak(completedDays: number[]) {
  if (completedDays.length === 0) {
    return 0;
  }

  const sortedDays = [...completedDays].sort((left, right) => left - right);
  let streak = 1;

  for (let index = sortedDays.length - 1; index > 0; index -= 1) {
    if (sortedDays[index] === sortedDays[index - 1]! + 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function getQuestionnaireMetricSpecs(programSlug: ProgramSlug): MetricSpec[] {
  switch (programSlug) {
    case 'six_day_reset':
      return [
        {
          id: 'daily-cigarettes',
          label: 'Cigarettes / day',
          resolve: ({ onboardingResponse }) => {
            const projection = getOnboardingProjection(onboardingResponse);
            return projection.dailyAmount > 0 ? String(projection.dailyAmount) : null;
          },
        },
        {
          id: 'daily-spend',
          label: 'Daily spend',
          resolve: ({ onboardingResponse }) => {
            const projection = getOnboardingProjection(onboardingResponse);
            return projection.dailyCost > 0 ? formatInr(projection.dailyCost) : null;
          },
        },
      ];
    case 'ninety_day_transform':
      return [
        {
          id: 'daily-cigarettes',
          label: 'Cigarettes / day',
          resolve: ({ onboardingResponse }) => {
            const projection = getOnboardingProjection(onboardingResponse);
            return projection.dailyAmount > 0 ? String(projection.dailyAmount) : null;
          },
        },
        {
          id: 'ninety-day-savings',
          label: '90-day savings',
          resolve: ({ onboardingResponse }) => {
            const projection = getOnboardingProjection(onboardingResponse);
            return projection.projectedSavings90Days > 0
              ? formatInr(projection.projectedSavings90Days)
              : null;
          },
        },
      ];
    case 'sleep_disorder_reset':
      return [
        {
          id: 'sleep-affected-nights',
          label: 'Nights affected',
          resolve: ({ questionnaireAnswers }) =>
            getQuestionnaireAnswer(questionnaireAnswers, 'sleep_affected_nights'),
        },
        {
          id: 'daily-reliance',
          label: 'Daily reliance',
          resolve: ({ questionnaireAnswers }) =>
            getQuestionnaireAnswer(questionnaireAnswers, 'sleep_reliance_count'),
        },
      ];
    case 'energy_vitality':
      return [
        {
          id: 'daily-caffeine',
          label: 'Daily caffeine',
          resolve: ({ questionnaireAnswers }) =>
            getQuestionnaireAnswer(questionnaireAnswers, 'energy_caffeine_count'),
        },
        {
          id: 'screen-load',
          label: 'Screen load',
          resolve: ({ questionnaireAnswers }) =>
            getQuestionnaireAnswer(questionnaireAnswers, 'energy_screen_hours'),
        },
        {
          id: 'biggest-drain',
          label: 'Biggest drain',
          resolve: ({ questionnaireAnswers }) =>
            getQuestionnaireAnswer(questionnaireAnswers, 'energy_trigger'),
        },
      ];
    case 'age_reversal':
      return [
        {
          id: 'always-on-load',
          label: 'Always-on load',
          resolve: ({ questionnaireAnswers }) =>
            getQuestionnaireAnswer(questionnaireAnswers, 'age_disconnect'),
        },
        {
          id: 'screen-load',
          label: 'Screen load',
          resolve: ({ questionnaireAnswers }) =>
            getQuestionnaireAnswer(questionnaireAnswers, 'age_screen_hours'),
        },
        {
          id: 'hardest-drain',
          label: 'Hardest drain',
          resolve: ({ questionnaireAnswers }) =>
            getQuestionnaireAnswer(questionnaireAnswers, 'age_trigger'),
        },
      ];
    case 'male_sexual_health':
      return [
        {
          id: 'weekly-impact',
          label: 'Weekly impact',
          resolve: ({ questionnaireAnswers }) =>
            getQuestionnaireAnswer(questionnaireAnswers, 'male_frequency'),
        },
        {
          id: 'main-trigger',
          label: 'Main trigger',
          resolve: ({ questionnaireAnswers }) =>
            getQuestionnaireAnswer(questionnaireAnswers, 'male_trigger'),
        },
      ];
  }
}

function getFallbackStatItems(args: {
  completedDays: number[];
  partialDays: number[];
  totalDays: number;
  hasAudio: boolean;
}) {
  const currentStreak = getCurrentStreak(args.completedDays);

  return [
    {
      id: 'current-streak',
      label: 'Current streak',
      value: String(currentStreak),
      sublabel:
        currentStreak > 0
          ? `${currentStreak} day${currentStreak === 1 ? '' : 's'} in a row`
          : 'Build your first streak',
      state: 'fallback' as const,
    },
    {
      id: 'days-completed',
      label: 'Days completed',
      value: `${args.completedDays.length}/${args.totalDays}`,
      sublabel:
        args.partialDays.length > 0
          ? `${args.partialDays.length} partial day${args.partialDays.length === 1 ? '' : 's'} saved`
          : `${args.totalDays}-day guided path`,
      state: 'fallback' as const,
    },
    {
      id: 'journey-length',
      label: 'Journey length',
      value: `${args.totalDays} days`,
      sublabel: args.hasAudio ? 'Guided audio included' : 'Structured daily plan',
      state: 'fallback' as const,
    },
  ];
}

function createPendingCard(metric: MetricSpec): DashboardStatItem {
  return {
    id: metric.id,
    label: metric.label,
    value: '',
    sublabel: '',
    state: 'pending',
  };
}

export function resolveDashboardStatItems(
  args: ResolveDashboardStatItemsArgs
): DashboardStatItem[] {
  const clampedDayNumber = Math.min(Math.max(args.currentDayNumber, 1), args.totalDays);
  const completionPercentage = Math.min(
    100,
    Math.max(0, Math.round((clampedDayNumber / args.totalDays) * 100))
  );

  const items: DashboardStatItem[] = [
    {
      id: 'current-step',
      label: 'Current step',
      value: `Day ${clampedDayNumber}`,
      sublabel: `${completionPercentage}% complete`,
      state: 'ready',
    },
  ];

  if (args.dailySteps?.isLoading) {
    items.push({
      id: 'steps-today',
      label: 'Steps today',
      value: '',
      sublabel: '',
      state: 'pending',
    });
  } else if (args.dailySteps?.permissionState === 'ready') {
    items.push({
      id: 'steps-today',
      label: 'Steps today',
      value: new Intl.NumberFormat('en-IN').format(args.dailySteps.steps ?? 0),
      sublabel: 'Synced from device',
      state: 'ready',
    });
  } else {
    items.push({
      id: 'steps-today',
      label: 'Steps today',
      value: 'Enable',
      sublabel: 'From Statistics',
      state: 'fallback',
    });
  }

  const metricSpecs = getQuestionnaireMetricSpecs(args.programSlug);
  const fallbackItems = getFallbackStatItems({
    completedDays: args.completedDays,
    partialDays: args.partialDays,
    totalDays: args.totalDays,
    hasAudio: args.hasAudio,
  });
  let fallbackIndex = 0;

  for (const metric of metricSpecs) {
    const value = metric.resolve({
      onboardingResponse: args.onboardingResponse,
      questionnaireAnswers: args.questionnaireAnswers,
    });

    if (value) {
      items.push({
        id: metric.id,
        label: metric.label,
        value,
        sublabel: 'Based on your intake',
        state: 'ready',
      });
      continue;
    }

    if (args.isBaselineLoading) {
      items.push(createPendingCard(metric));
      continue;
    }

    items.push(fallbackItems[fallbackIndex] ?? fallbackItems[fallbackItems.length - 1]!);
    fallbackIndex += 1;
  }

  return items.slice(0, 3);
}
