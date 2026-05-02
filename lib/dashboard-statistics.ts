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

function getJourneyForProgram(programSlug: ProgramSlug) {
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
  }
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

function isSameMetricScope(left: ProgramSlug, right: ProgramSlug) {
  return getJourneyForProgram(left) === getJourneyForProgram(right);
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
  const items: DashboardStatItem[] = [];
  const scopedContext: DashboardStatContext = {
    onboardingResponse: isOnboardingResponseScopedToProgram(args.onboardingResponse, args.programSlug)
      ? args.onboardingResponse
      : null,
    questionnaireAnswers: isQuestionnaireScopedToProgram(args.questionnaireAnswers, args.programSlug)
      ? args.questionnaireAnswers
      : null,
  };

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
    const value = metric.resolve(scopedContext);

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
