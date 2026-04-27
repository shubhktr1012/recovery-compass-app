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
  JourneyKey,
  SelectionOption,
} from '@/lib/onboarding.types';

export interface OnboardingDraftPayload {
  version: typeof QUESTIONNAIRE_DRAFT_VERSION;
  status: 'draft';
  currentStepId: string;
  currentStepIndex: number;
  updatedAt: string;
  answers: OnboardingAnswers;
}

type QuestionnaireRunSource = 'self_select' | 'guided_recommendation' | 'realignment';

const QUESTIONNAIRE_VERSION = 'onboarding_redesign_v2';
const QUESTIONNAIRE_DRAFT_VERSION = 'onboarding_redesign_v2_draft';

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
      .filter((value): value is string => Boolean(value));
  }

  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  return getOptionLabel(question.options, rawValue) ?? rawValue;
}

function serializeQuestionEntries(
  question: QuestionDefinition,
  answers: OnboardingAnswers
): [string, string | string[] | null][] {
  if (question.type === 'compound_number_input' && question.inputs?.length) {
    return question.inputs.map((input) => [
      input.id,
      serializeQuestionValue(question, answers.questionValues[input.id]),
    ]);
  }

  return [[question.id, serializeQuestionValue(question, answers.questionValues[question.id])]];
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
  if (!draft || draft.status !== 'draft' || draft.version !== QUESTIONNAIRE_DRAFT_VERSION) {
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
    version: QUESTIONNAIRE_DRAFT_VERSION,
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
  source?: QuestionnaireRunSource;
  userId: string;
}) {
  const { answers, email, source, userId } = args;
  const resolution = getOnboardingResolution(answers);

  if (!resolution.journey || !resolution.recommendedProgram || !resolution.primaryConcernLabel) {
    throw new Error('The onboarding flow is incomplete.');
  }

  const updatedAt = new Date().toISOString();
  const journeyConfig = getJourneyConfig(resolution.journey);
  const activeQuestions = getActiveQuestionSequence(answers);
  const serializedQuestionAnswers = Object.fromEntries(
    activeQuestions.flatMap((question) => serializeQuestionEntries(question, answers))
  );

  const numericBaselineQuestion = journeyConfig.questions.baseline?.find(
    (question) => question.type === 'number_input'
  );
  const severityInputId =
    journeyConfig.questions.severity.type === 'compound_number_input' &&
    journeyConfig.questions.severity.inputs?.[0]?.id
      ? journeyConfig.questions.severity.inputs[0].id
      : numericBaselineQuestion?.id
        ? numericBaselineQuestion.id
      : journeyConfig.questions.severity.id;
  const spendInputId =
    journeyConfig.questions.severity.type === 'compound_number_input' &&
    journeyConfig.questions.severity.inputs?.[1]?.id
      ? journeyConfig.questions.severity.inputs[1].id
      : journeyConfig.questions.spend?.id ?? null;

  const durationAnswer = serializedQuestionAnswers[journeyConfig.questions.duration.id];
  const frictionAnswer = serializedQuestionAnswers[journeyConfig.questions.friction.id];
  const lifestyleAnswer = serializedQuestionAnswers[journeyConfig.questions.lifestyle.id];
  const triggerAnswer = serializedQuestionAnswers[journeyConfig.questions.trigger.id];
  const copingAnswer = serializedQuestionAnswers[journeyConfig.questions.coping.id];
  const severityAnswer = serializedQuestionAnswers[severityInputId];
  const outcomeAnswer = journeyConfig.questions.outcome
    ? serializedQuestionAnswers[journeyConfig.questions.outcome.id]
    : null;
  const secondarySymptoms =
    (serializedQuestionAnswers[SECONDARY_SYMPTOMS_QUESTION_ID] as string[] | null) ?? [];
  const dailyConsumptionAmount = toNumericValue(answers.questionValues[severityInputId]);
  const dailyConsumptionCost = spendInputId
    ? toNumericValue(answers.questionValues[spendInputId])
    : null;

  const questionnaireAnswers = {
    version: QUESTIONNAIRE_VERSION,
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
      typeof lifestyleAnswer === 'string' ? lifestyleAnswer : null,
      typeof triggerAnswer === 'string' ? triggerAnswer : null,
      typeof copingAnswer === 'string' ? copingAnswer : null,
      typeof outcomeAnswer === 'string' ? outcomeAnswer : null,
      ...secondarySymptoms,
    ].filter((value): value is string => Boolean(value)),
    root_cause: resolution.primaryConcernLabel,
    physical_toll: typeof frictionAnswer === 'string' ? frictionAnswer : resolution.primaryConcernLabel,
    mental_toll: null,
    daily_consumption_amount: dailyConsumptionAmount,
    daily_consumption_cost: dailyConsumptionCost,
    primary_goal: journeyConfig.primaryGoal,
    updated_at: updatedAt,
  };

  const questionnaireRunPayload = {
    user_id: userId,
    source: source ?? (answers.path === 'guided_recommendation' ? 'guided_recommendation' : 'self_select'),
    questionnaire_version: QUESTIONNAIRE_VERSION,
    journey_key: resolution.journey as JourneyKey,
    recommended_program: resolution.recommendedProgram,
    primary_concern_label: resolution.primaryConcernLabel,
    questionnaire_answers: questionnaireAnswers,
    completed_at: updatedAt,
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
            recommended_program: resolution.recommendedProgram,
            questionnaire_answers: questionnaireAnswers,
            onboarding_completed_at: updatedAt,
            updated_at: updatedAt,
          },
          { onConflict: 'id' }
        )
        .select(
          'id, email, onboarding_complete, questionnaire_answers, recommended_program, created_at, updated_at, expo_push_token, push_opt_in'
        )
        .single(),
    ]);

  if (onboardingError) {
    throw onboardingError;
  }

  if (profileError) {
    throw profileError;
  }

  try {
    const { error: questionnaireRunError } = await supabaseAny
      .from('questionnaire_runs')
      .insert(questionnaireRunPayload);

    if (questionnaireRunError) {
      throw questionnaireRunError;
    }
  } catch (error) {
    console.error('Failed to save questionnaire run history', error);
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
