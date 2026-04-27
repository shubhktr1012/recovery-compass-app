import {
  getGuidedIssueLabel,
  getGuidedIssueOptions,
  getGuidedJourney,
  getJourneyConfig,
  getRecommendedProgramForJourney,
  getSecondarySymptomOptions,
  getSelfSelectOptions,
  PATH_OPTIONS,
} from '@/lib/onboarding.config';
import type {
  GenderOption,
  GuidedIssueId,
  JourneyKey,
  OnboardingAnswers,
  OnboardingResolution,
  OnboardingStep,
  QuestionDefinition,
} from '@/lib/onboarding.types';

export const SECONDARY_SYMPTOMS_QUESTION_ID = 'secondary_symptoms';

export function createInitialOnboardingAnswers(): OnboardingAnswers {
  return {
    name: '',
    age: '',
    gender: '',
    path: null,
    selfSelectJourney: null,
    guidedMainIssue: null,
    questionValues: {},
  };
}

export function getActiveJourney(answers: OnboardingAnswers) {
  if (answers.path === 'self_select') {
    return answers.selfSelectJourney;
  }

  if (answers.path === 'guided_recommendation' && answers.guidedMainIssue) {
    return getGuidedJourney(answers.guidedMainIssue);
  }

  return null;
}

export function buildSecondarySymptomsQuestion(
  gender: GenderOption | '',
  excludedIssueId?: GuidedIssueId | null
): QuestionDefinition {
  return {
    id: SECONDARY_SYMPTOMS_QUESTION_ID,
    title: 'What else is affecting you?',
    description: 'Choose any that also feel true. This adds context but does not change your path.',
    type: 'multi_select',
    required: false,
    allowEmpty: true,
    options: getSecondarySymptomOptions(gender, excludedIssueId),
  };
}

export function getActiveQuestionSequence(answers: OnboardingAnswers): QuestionDefinition[] {
  const journey = getActiveJourney(answers);
  if (!journey) {
    return [];
  }

  const journeyQuestions = getJourneyConfig(journey).questions;
  const secondarySymptoms = buildSecondarySymptomsQuestion(answers.gender, answers.guidedMainIssue);

  return [
    journeyQuestions.friction,
    journeyQuestions.duration,
    journeyQuestions.lifestyle,
    journeyQuestions.severity,
    ...(journeyQuestions.baseline ?? []),
    ...(journeyQuestions.spend ? [journeyQuestions.spend] : []),
    journeyQuestions.trigger,
    journeyQuestions.coping,
    secondarySymptoms,
    ...(journeyQuestions.outcome ? [journeyQuestions.outcome] : []),
    journeyQuestions.readiness,
  ];
}

function getSmokingRecommendedProgram(answers: OnboardingAnswers) {
  const outcome = answers.questionValues.smoking_outcome;
  const duration = answers.questionValues.smoking_duration;
  const dailyCountValue = answers.questionValues.smoking_daily_count;
  const dailyCount = typeof dailyCountValue === 'string' ? Number(dailyCountValue) : 0;

  if (outcome === 'full_quit_longer_path') {
    return 'ninety_day_transform' as const;
  }

  if (
    outcome === 'not_sure' &&
    (dailyCount >= 10 || duration === '3_10_years' || duration === '10_plus_years')
  ) {
    return 'ninety_day_transform' as const;
  }

  return 'six_day_reset' as const;
}

function getRecommendedProgramForAnswers(journey: JourneyKey, answers: OnboardingAnswers) {
  return journey === 'smoking'
    ? getSmokingRecommendedProgram(answers)
    : getRecommendedProgramForJourney(journey);
}

export function buildOnboardingSteps(answers: OnboardingAnswers): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    {
      id: 'quick_profile',
      type: 'quick_profile',
      title: 'Quick profile first.',
      description: 'These details help us personalize your plan, your projections, and the support context around you.',
    },
    {
      id: 'path_choice',
      type: 'path_choice',
      title: 'Choose how you want to move forward.',
      description: 'If you already know the program you want, choose it directly. If not, we will guide you there.',
      options: PATH_OPTIONS,
    },
  ];

  if (!answers.path) {
    return steps;
  }

  if (answers.path === 'self_select') {
    steps.push({
      id: 'program_choice',
      type: 'program_choice',
      title: 'Choose your program.',
      description: 'Pick the path that feels right. We will tailor the onboarding around it.',
      options: getSelfSelectOptions(answers.gender),
    });
  } else {
    steps.push({
      id: 'guided_issue',
      type: 'guided_issue',
      title: 'What’s your main issue right now?',
      description: 'Pick the one issue that feels most true. This determines the recommendation path.',
      options: getGuidedIssueOptions(answers.gender),
    });
  }

  const journey = getActiveJourney(answers);
  if (!journey) {
    return steps;
  }

  getActiveQuestionSequence(answers).forEach((question) => {
    steps.push({
      id: question.id,
      type: 'question',
      title: question.title,
      description: question.description,
      question,
    });
  });

  if (answers.path === 'guided_recommendation') {
    const recommendation = getJourneyConfig(journey).recommendation;
    steps.push({
      id: 'recommendation',
      type: 'recommendation',
      title: recommendation.title,
      description: recommendation.subtitle,
      journey,
      recommendation,
    });
  }

  return steps;
}

export function buildOnboardingRealignmentSteps(answers: OnboardingAnswers): OnboardingStep[] {
  const journey = getActiveJourney(answers);
  if (!journey) {
    return buildOnboardingSteps(answers);
  }

  const steps: OnboardingStep[] = [];

  if (!answers.name.trim() || !answers.age.trim() || !answers.gender) {
    steps.push({
      id: 'quick_profile',
      type: 'quick_profile',
      title: 'A couple of details first.',
      description: 'We only need the basics so we can tailor your unlocked program properly.',
    });
  }

  getActiveQuestionSequence(answers).forEach((question) => {
    steps.push({
      id: question.id,
      type: 'question',
      title: question.title,
      description: question.description,
      question,
    });
  });

  return steps;
}

export function getOnboardingResolution(answers: OnboardingAnswers): OnboardingResolution {
  const journey = getActiveJourney(answers);
  if (!journey) {
    return {
      journey: null,
      recommendedProgram: null,
      primaryConcernLabel: null,
    };
  }

  const primaryConcernLabel =
    answers.path === 'guided_recommendation'
      ? getGuidedIssueLabel(answers.guidedMainIssue)
      : getJourneyConfig(journey).selectionLabel;

  return {
    journey,
    recommendedProgram: getRecommendedProgramForAnswers(journey, answers),
    primaryConcernLabel,
  };
}
