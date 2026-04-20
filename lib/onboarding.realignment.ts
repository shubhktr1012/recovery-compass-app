import { createInitialOnboardingAnswers } from '@/lib/onboarding.flow';
import type { GenderOption, JourneyKey, OnboardingAnswers } from '@/lib/onboarding.types';
import { GENDER_OPTIONS } from '@/lib/onboarding.types';
import type { ProgramSlug } from '@/lib/programs/types';

type QuestionnaireQuickProfile = {
  age?: unknown;
  gender?: unknown;
  name?: unknown;
};

type QuestionnaireSnapshot = {
  journey?: unknown;
  quickProfile?: QuestionnaireQuickProfile;
};

function isJourneyKey(value: unknown): value is JourneyKey {
  return (
    value === 'smoking' ||
    value === 'sleep_disorder_reset' ||
    value === 'energy_vitality' ||
    value === 'age_reversal' ||
    value === 'male_sexual_health'
  );
}

function isGenderOption(value: unknown): value is GenderOption {
  return GENDER_OPTIONS.includes(value as GenderOption);
}

function asQuestionnaireSnapshot(
  questionnaireAnswers: Record<string, unknown> | null | undefined
): QuestionnaireSnapshot | null {
  if (!questionnaireAnswers || typeof questionnaireAnswers !== 'object') {
    return null;
  }

  return questionnaireAnswers as QuestionnaireSnapshot;
}

export function getJourneyForProgramSlug(programSlug: ProgramSlug | null | undefined): JourneyKey | null {
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

export function getStoredOnboardingJourney(args: {
  questionnaireAnswers?: Record<string, unknown> | null;
  recommendedProgram?: ProgramSlug | null;
}) {
  const snapshot = asQuestionnaireSnapshot(args.questionnaireAnswers);
  if (isJourneyKey(snapshot?.journey)) {
    return snapshot.journey;
  }

  return getJourneyForProgramSlug(args.recommendedProgram ?? null);
}

export function hasOnboardingContextMismatch(args: {
  onboardingComplete?: boolean | null;
  ownedProgram?: ProgramSlug | null;
  questionnaireAnswers?: Record<string, unknown> | null;
  recommendedProgram?: ProgramSlug | null;
}) {
  if (!args.onboardingComplete || !args.ownedProgram) {
    return false;
  }

  const ownedJourney = getJourneyForProgramSlug(args.ownedProgram);
  if (!ownedJourney) {
    return false;
  }

  const storedJourney = getStoredOnboardingJourney({
    questionnaireAnswers: args.questionnaireAnswers,
    recommendedProgram: args.recommendedProgram,
  });

  return storedJourney !== ownedJourney;
}

export function buildRealignmentAnswers(args: {
  ownedProgram: ProgramSlug;
  questionnaireAnswers?: Record<string, unknown> | null;
}): OnboardingAnswers {
  const snapshot = asQuestionnaireSnapshot(args.questionnaireAnswers);
  const quickProfile = snapshot?.quickProfile;
  const targetJourney = getJourneyForProgramSlug(args.ownedProgram);

  if (!targetJourney) {
    return createInitialOnboardingAnswers();
  }

  const name = typeof quickProfile?.name === 'string' ? quickProfile.name.trim() : '';
  const age =
    typeof quickProfile?.age === 'number'
      ? String(quickProfile.age)
      : typeof quickProfile?.age === 'string'
        ? quickProfile.age
        : '';
  const gender = isGenderOption(quickProfile?.gender) ? quickProfile.gender : '';

  return {
    ...createInitialOnboardingAnswers(),
    name,
    age,
    gender,
    path: 'self_select',
    selfSelectJourney: targetJourney,
    guidedMainIssue: null,
    questionValues: {},
  };
}
