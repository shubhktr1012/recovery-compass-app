import { AppStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { getGuidedIssueLabel, getJourneyConfig } from '@/lib/onboarding.config';
import {
  getActiveQuestionSequence,
  getOnboardingResolution,
  SECONDARY_SYMPTOMS_QUESTION_ID,
} from '@/lib/onboarding.flow';
import type {
  OnboardingAnswers,
  QuestionDefinition,
  SelectionOption,
} from '@/lib/onboarding.types';

export interface OnboardingDraftPayload {
  version: 'onboarding_redesign_v1_draft';
  status: 'draft';
  currentStepId: string;
  currentStepIndex: number;
  updatedAt: string;
  answers: OnboardingAnswers;
}

function getOptionLabel(options: SelectionOption[] | undefined, value: string | null | undefined) {
  if (!options || !value) return null;
  return options.find((option) => option.id === value)?.label ?? value;
}

function serializeQuestionValue(
  question: QuestionDefinition,
  rawValue: string | string[] | undefined
) {
  if (rawValue == null) {
    return null;
  }

  if (question.type === 'multi_select') {
    const selectedValues = Array.isArray(rawValue) ? rawValue : [rawValue];
    return selectedValues
      .map((value) => getOptionLabel(question.options, value))
      .filter(Boolean);
  }

  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  return getOptionLabel(question.options, rawValue) ?? rawValue;
}

function toNumericValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return null;
  if (!value) return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function hasMeaningfulOnboardingDraft(answers: OnboardingAnswers) {
  return Boolean(
    answers.name.trim() ||
      answers.age.trim() ||
      answers.gender ||
      answers.path ||
      answers.selfSelectJourney ||
      answers.guidedMainIssue ||
      Object.keys(answers.questionValues).length > 0
  );
}

export async function loadOnboardingDraft(userId: string) {
  const supabaseAny = supabase as any;
  const { data, error } = await supabaseAny
    .from('profiles')
    .select('onboarding_complete, questionnaire_answers')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || data.onboarding_complete) {
    return null;
  }

  const draft = data.questionnaire_answers as OnboardingDraftPayload | null;
  if (!draft || draft.status !== 'draft' || draft.version !== 'onboarding_redesign_v1_draft') {
    return null;
  }

  return draft;
}

export async function saveOnboardingDraft(args: {
  answers: OnboardingAnswers;
  currentStepId: string;
  currentStepIndex: number;
  email: string | null | undefined;
  userId: string;
}) {
  const { answers, currentStepId, currentStepIndex, email, userId } = args;
  const updatedAt = new Date().toISOString();
  const draftPayload: OnboardingDraftPayload = {
    version: 'onboarding_redesign_v1_draft',
    status: 'draft',
    currentStepId,
    currentStepIndex,
    updatedAt,
    answers,
  };

  const supabaseAny = supabase as any;
  const { error } = await supabaseAny.from('profiles').upsert(
    {
      id: userId,
      email: email ?? null,
      onboarding_complete: false,
      questionnaire_completed: false,
      questionnaire_answers: draftPayload,
      updated_at: updatedAt,
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw error;
  }

  return draftPayload;
}

export async function saveOnboardingQuestionnaire(args: {
  answers: OnboardingAnswers;
  email: string | null | undefined;
  userId: string;
}) {
  const { answers, email, userId } = args;
  const resolution = getOnboardingResolution(answers);

  if (!resolution.journey || !resolution.recommendedProgram || !resolution.primaryConcernLabel) {
    throw new Error('The onboarding flow is incomplete.');
  }

  const updatedAt = new Date().toISOString();
  const journeyConfig = getJourneyConfig(resolution.journey);
  const activeQuestions = getActiveQuestionSequence(answers);
  const serializedQuestionAnswers = Object.fromEntries(
    activeQuestions.map((question) => [
      question.id,
      serializeQuestionValue(question, answers.questionValues[question.id]),
    ])
  );

  const durationAnswer = serializedQuestionAnswers[journeyConfig.questions.duration.id];
  const frictionAnswer = serializedQuestionAnswers[journeyConfig.questions.friction.id];
  const triggerAnswer = serializedQuestionAnswers[journeyConfig.questions.trigger.id];
  const copingAnswer = serializedQuestionAnswers[journeyConfig.questions.coping.id];
  const severityAnswer = serializedQuestionAnswers[journeyConfig.questions.severity.id];
  const secondarySymptoms =
    (serializedQuestionAnswers[SECONDARY_SYMPTOMS_QUESTION_ID] as string[] | null) ?? [];

  const questionnaireAnswers = {
    version: 'onboarding_redesign_v1',
    path: answers.path,
    quickProfile: {
      name: answers.name.trim(),
      age: Number(answers.age),
      gender: answers.gender,
    },
    selectedProgram: answers.path === 'self_select' ? journeyConfig.selectionLabel : null,
    mainIssue:
      answers.path === 'guided_recommendation'
        ? getGuidedIssueLabel(answers.guidedMainIssue)
        : null,
    journey: resolution.journey,
    recommendedProgram: resolution.recommendedProgram,
    secondarySymptoms,
    answers: serializedQuestionAnswers,
  };

  const legacyPayload = {
    user_id: userId,
    full_name: answers.name.trim(),
    age: Number(answers.age),
    target_selection: journeyConfig.selectionLabel,
    past_attempts: typeof durationAnswer === 'string' ? durationAnswer : null,
    triggers: [
      typeof triggerAnswer === 'string' ? triggerAnswer : null,
      typeof copingAnswer === 'string' ? copingAnswer : null,
      ...secondarySymptoms,
    ].filter((value): value is string => Boolean(value)),
    root_cause: resolution.primaryConcernLabel,
    physical_toll: typeof frictionAnswer === 'string' ? frictionAnswer : resolution.primaryConcernLabel,
    mental_toll: null,
    daily_consumption_amount: toNumericValue(answers.questionValues[journeyConfig.questions.severity.id]),
    daily_consumption_cost: null,
    primary_goal: journeyConfig.primaryGoal,
    updated_at: updatedAt,
  };

  const supabaseAny = supabase as any;

  const [{ data: persistedOnboarding, error: onboardingError }, { data: persistedProfile, error: profileError }] =
    await Promise.all([
      supabase
        .from('onboarding_responses')
        .upsert(legacyPayload, { onConflict: 'user_id' })
        .select(
          'id, user_id, target_selection, language_selection, full_name, age, past_attempts, triggers, root_cause, physical_toll, mental_toll, daily_consumption_amount, daily_consumption_cost, primary_goal, created_at, updated_at'
        )
        .single(),
      supabaseAny
        .from('profiles')
        .upsert(
          {
            id: userId,
            email: email ?? null,
            onboarding_complete: true,
            questionnaire_completed: true,
            primary_concern: resolution.primaryConcernLabel,
            recommended_program: resolution.recommendedProgram,
            questionnaire_answers: questionnaireAnswers,
            onboarding_completed_at: updatedAt,
            updated_at: updatedAt,
          },
          { onConflict: 'id' }
        )
        .select(
          'id, email, onboarding_complete, recommended_program, created_at, updated_at, active_program, expo_push_token, push_opt_in'
        )
        .single(),
    ]);

  if (onboardingError) {
    throw onboardingError;
  }

  if (profileError) {
    throw profileError;
  }

  await AppStorage.setItem('hasSeenOnboarding', 'true');

  return {
    persistedOnboarding,
    persistedProfile,
    resolution,
    summary: {
      primaryConcernLabel: resolution.primaryConcernLabel,
      severityAnswer,
    },
  };
}
