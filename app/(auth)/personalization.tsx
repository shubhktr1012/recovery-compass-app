import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Animated as RNAnimated, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import {
  CompassCTA,
  FocusPill,
  GenderSegment,
  InputText,
  LargeNumberInput,
  OptionCard,
  PathCard,
  RecommendationHero,
  SelectChip,
  StepContainer,
  StepHeadline,
  StepPill,
  WhyFitsCard,
} from '@/components/onboarding/intake';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { ONBOARDING_RESPONSE_QUERY_KEY } from '@/hooks/useOnboardingResponse';
import {
  buildOnboardingRealignmentSteps,
  buildOnboardingSteps,
  createInitialOnboardingAnswers,
  getOnboardingResolution,
} from '@/lib/onboarding.flow';
import { hasMeaningfulOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft, saveOnboardingQuestionnaire } from '@/lib/onboarding.persistence';
import { buildRealignmentAnswers } from '@/lib/onboarding.realignment';
import { AppStorage } from '@/lib/storage';
import { GENDER_OPTIONS } from '@/lib/onboarding.types';
import type { GenderOption, GuidedIssueId, JourneyKey, OnboardingPath, OnboardingStep, QuestionDefinition } from '@/lib/onboarding.types';
import { useAuth } from '@/providers/auth';
import { PROFILE_QUERY_KEY, useProfile } from '@/providers/profile';
import type { ProgramSlug } from '@/lib/programs/types';

// ─── Pill label mapping (spec §3) ──────────────────────────────────────────
const STEP_PILL_LABELS: Record<OnboardingStep['type'], string> = {
  quick_profile: 'YOUR PROFILE',
  path_choice: 'YOUR PATH',
  program_choice: 'CHOOSE YOUR PROGRAM',
  guided_issue: 'YOUR MAIN ISSUE',
  question: 'PERSONALIZATION',
  recommendation: 'YOUR RECOMMENDATION',
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function isPositiveInteger(value: string) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function hasAppleIdentity(user: ReturnType<typeof useAuth>['user']) {
  if (!user) {
    return false;
  }

  const primaryProvider =
    typeof user.app_metadata?.provider === 'string' ? user.app_metadata.provider : null;

  if (primaryProvider === 'apple') {
    return true;
  }

  return Boolean(user.identities?.some((identity) => identity.provider === 'apple'));
}

function getAuthDisplayName(user: ReturnType<typeof useAuth>['user']) {
  const metadata = user?.user_metadata;
  const candidates = [
    metadata?.full_name,
    metadata?.name,
    metadata?.display_name,
  ];

  return candidates.find((candidate): candidate is string => {
    return typeof candidate === 'string' && candidate.trim().length > 0;
  })?.trim() ?? '';
}

function getProgramSlugFromRouteParam(value: string | string[] | undefined): ProgramSlug | null {
  if (!value) {
    return null;
  }

  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) {
    return null;
  }

  return candidate in PROGRAM_METADATA ? (candidate as ProgramSlug) : null;
}

const PAYWALL_RETURN_STATE_VERSION = 'onboarding_paywall_return_v1';

function getPaywallReturnStateKey(userId: string) {
  return `onboarding:paywall-return:${userId}`;
}

// ─── Screen ─────────────────────────────────────────────────────────────────
export default function Personalization() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { access, profile } = useProfile();
  const params = useLocalSearchParams<{ mode?: string | string[]; program?: string | string[]; resume?: string | string[] }>();
  const [didRestoreDraft, setDidRestoreDraft] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [answers, setAnswers] = useState(createInitialOnboardingAnswers);
  const resumeMode = Array.isArray(params.resume) ? params.resume[0] : params.resume;
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const isRealignmentMode = mode === 'realign';
  const ownedProgram = access.ownedProgram as ProgramSlug | null;
  const realignmentProgramParam = getProgramSlugFromRouteParam(params.program);
  const realignmentProgram = isRealignmentMode
    ? realignmentProgramParam ?? ownedProgram
    : ownedProgram;
  const isAppleAuthenticated = hasAppleIdentity(user);
  const authDisplayName = getAuthDisplayName(user);
  const profileDisplayName = profile?.display_name?.trim() ?? '';
  const nameFromIdentity = profileDisplayName || authDisplayName;

  const steps = useMemo(
    () => (isRealignmentMode ? buildOnboardingRealignmentSteps(answers) : buildOnboardingSteps(answers)),
    [answers, isRealignmentMode]
  );
  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];
  const resolution = useMemo(() => getOnboardingResolution(answers), [answers]);
  const realignmentProgramName =
    isRealignmentMode && realignmentProgram ? PROGRAM_METADATA[realignmentProgram]?.name ?? null : null;

  const stepFadeAnim = React.useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    stepFadeAnim.setValue(0);
    RNAnimated.timing(stepFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [stepIndex, stepFadeAnim]);

  // ─── Clamp step index if steps change ───────────────────────────────────
  useEffect(() => {
    if (stepIndex > steps.length - 1) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [stepIndex, steps.length]);

  useEffect(() => {
    if (!nameFromIdentity) {
      return;
    }

    setAnswers((current) => {
      if (current.name.trim()) {
        return current;
      }

      return {
        ...current,
        name: nameFromIdentity,
      };
    });
  }, [nameFromIdentity]);

  // ─── Restore draft ──────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const restoreDraft = async () => {
      if (!user) {
        if (isMounted) {
          setIsDraftReady(true);
        }
        return;
      }

      try {
        if (isRealignmentMode) {
          if (!realignmentProgram) {
            if (isMounted) {
              setIsDraftReady(true);
            }
            return;
          }

          const nextAnswers = buildRealignmentAnswers({
            ownedProgram: realignmentProgram,
            questionnaireAnswers: profile?.questionnaire_answers ?? null,
          });

          if (!isMounted) {
            return;
          }

          setAnswers(nextAnswers);
          setStepIndex(0);
          return;
        }

        const shouldRestorePaywallReturn = resumeMode === 'review';

        if (shouldRestorePaywallReturn) {
          const rawReturnState = await AppStorage.getItem(getPaywallReturnStateKey(user.id));

          if (rawReturnState) {
            const returnState = JSON.parse(rawReturnState) as {
              version?: string;
              currentStepId?: string;
              currentStepIndex?: number;
              answers?: ReturnType<typeof createInitialOnboardingAnswers>;
            };

            if (
              returnState.version === PAYWALL_RETURN_STATE_VERSION &&
              returnState.answers
            ) {
              const restoredAnswers = {
                ...createInitialOnboardingAnswers(),
                ...returnState.answers,
                questionValues: returnState.answers.questionValues ?? {},
              };
              const restoredSteps = buildOnboardingSteps(restoredAnswers);
              const restoredIndex = restoredSteps.findIndex((step) => step.id === returnState.currentStepId);

              setAnswers(restoredAnswers);
              setStepIndex(
                restoredIndex >= 0
                  ? restoredIndex
                  : Math.max(0, Math.min(returnState.currentStepIndex ?? restoredSteps.length - 1, restoredSteps.length - 1))
              );
              setDidRestoreDraft(true);
              return;
            }
          }
        }

        const draft = await loadOnboardingDraft(user.id);
        if (!isMounted) return;

        if (draft) {
          const restoredAnswers = {
            ...createInitialOnboardingAnswers(),
            ...draft.answers,
            questionValues: draft.answers.questionValues ?? {},
          };

          const restoredSteps = buildOnboardingSteps(restoredAnswers);
          const restoredIndex = restoredSteps.findIndex((step) => step.id === draft.currentStepId);

          setAnswers(restoredAnswers);
          setStepIndex(
            restoredIndex >= 0
              ? restoredIndex
              : Math.max(0, Math.min(draft.currentStepIndex ?? 0, restoredSteps.length - 1))
          );
          setDidRestoreDraft(true);
        }
      } catch (error) {
        console.warn('Failed to restore onboarding draft', error);
      } finally {
        if (isMounted) {
          setIsDraftReady(true);
        }
      }
    };

    void restoreDraft();

    return () => {
      isMounted = false;
    };
  }, [isRealignmentMode, profile?.questionnaire_answers, realignmentProgram, resumeMode, user]);

  // ─── Auto-save draft ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isDraftReady || !user || isSaving || isRealignmentMode) {
      return;
    }

    if (!hasMeaningfulOnboardingDraft(answers)) {
      return;
    }

    const timer = setTimeout(() => {
      void saveOnboardingDraft({
        answers,
        currentStepId: currentStep.id,
        currentStepIndex: stepIndex,
        email: user.email,
        userId: user.id,
      }).catch((error) => {
        console.warn('Failed to save onboarding draft', error);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [answers, currentStep.id, isDraftReady, isRealignmentMode, isSaving, stepIndex, user]);

  // ─── Draft restored alert ──────────────────────────────────────────────
  useEffect(() => {
    if (!didRestoreDraft) {
      return;
    }

    Alert.alert('Progress restored', 'We restored your progress so you can keep going.');
    setDidRestoreDraft(false);
  }, [didRestoreDraft]);

  // ─── State updaters (unchanged) ────────────────────────────────────────
  const updateQuickProfile = <K extends 'name' | 'age'>(key: K, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const updateGender = (gender: GenderOption) => {
    setAnswers((current) => {
      let nextSelfSelectJourney = current.selfSelectJourney;
      let nextGuidedIssue = current.guidedMainIssue;

      if (gender !== 'Male' && nextSelfSelectJourney === 'male_sexual_health') {
        nextSelfSelectJourney = null;
      }

      if (gender !== 'Male' && nextGuidedIssue === 'low_libido_poor_performance') {
        nextGuidedIssue = null;
      }

      return {
        ...current,
        gender,
        selfSelectJourney: nextSelfSelectJourney,
        guidedMainIssue: nextGuidedIssue,
      };
    });
  };

  const updatePath = (path: OnboardingPath) => {
    setAnswers((current) => ({
      ...current,
      path,
      selfSelectJourney: path === 'self_select' ? current.selfSelectJourney : null,
      guidedMainIssue: path === 'guided_recommendation' ? current.guidedMainIssue : null,
      questionValues: path === current.path ? current.questionValues : {},
    }));
  };

  const updateSelfSelectJourney = (journey: JourneyKey) => {
    setAnswers((current) => ({
      ...current,
      selfSelectJourney: journey,
      questionValues: journey === current.selfSelectJourney ? current.questionValues : {},
    }));
  };

  const updateGuidedIssue = (issue: GuidedIssueId) => {
    setAnswers((current) => ({
      ...current,
      guidedMainIssue: issue,
      questionValues: issue === current.guidedMainIssue ? current.questionValues : {},
    }));
  };

  const updateQuestionValue = (questionId: string, value: string) => {
    setAnswers((current) => ({
      ...current,
      questionValues: {
        ...current.questionValues,
        [questionId]: value,
      },
    }));
  };

  const toggleQuestionValue = (questionId: string, value: string) => {
    setAnswers((current) => {
      const existingValue = current.questionValues[questionId];
      const existingValues = Array.isArray(existingValue) ? existingValue : [];
      const nextValues = existingValues.includes(value)
        ? existingValues.filter((item) => item !== value)
        : [...existingValues, value];

      return {
        ...current,
        questionValues: {
          ...current.questionValues,
          [questionId]: nextValues,
        },
      };
    });
  };

  // ─── Validation (unchanged) ────────────────────────────────────────────
  const validateQuestion = (question: QuestionDefinition) => {
    const rawValue = answers.questionValues[question.id];

    if (
      !question.required &&
      question.allowEmpty &&
      !(question.customOptionId && rawValue === question.customOptionId)
    ) {
      return true;
    }

    switch (question.type) {
      case 'number_input':
        return (
          (typeof rawValue === 'string' && isPositiveInteger(rawValue)) ||
          'Enter a valid number before continuing.'
        );
      case 'compound_number_input':
        if (!question.inputs || question.inputs.length === 0) return true;
        for (const input of question.inputs) {
          const val = answers.questionValues[input.id];
          if (!(typeof val === 'string' && isPositiveInteger(val))) {
            return 'Enter valid numbers for all fields before continuing.';
          }
        }
        return true;
      case 'single_select':
        const customInputValue = question.customInputId
          ? answers.questionValues[question.customInputId]
          : null;

        if (
          question.customOptionId &&
          rawValue === question.customOptionId &&
          !(typeof customInputValue === 'string' && customInputValue.trim())
        ) {
          return 'Write your reason or choose another option before continuing.';
        }

        return (
          (typeof rawValue === 'string' && Boolean(rawValue)) ||
          'Choose the option that feels most true before continuing.'
        );
      case 'multi_select':
        if (question.allowEmpty) {
          return true;
        }

        return (
          (Array.isArray(rawValue) && rawValue.length > 0) ||
          'Choose at least one option before continuing.'
        );
      default:
        return true;
    }
  };

  const validateCurrentStep = (step: OnboardingStep) => {
    switch (step.type) {
      case 'quick_profile':
        return (
          ((isAppleAuthenticated || Boolean(answers.name.trim())) &&
            isPositiveInteger(answers.age) &&
            Boolean(answers.gender)) ||
          (isAppleAuthenticated
            ? 'Enter a valid age and your gender to continue.'
            : 'Enter your name, a valid age, and your gender to continue.')
        );
      case 'path_choice':
        return Boolean(answers.path) || 'Choose how you want to move forward.';
      case 'program_choice':
        return Boolean(answers.selfSelectJourney) || 'Choose the program you want before continuing.';
      case 'guided_issue':
        return Boolean(answers.guidedMainIssue) || 'Choose your main issue before continuing.';
      case 'question':
        return validateQuestion(step.question);
      case 'recommendation':
        return true;
      default:
        return true;
    }
  };

  // ─── Save & nav (unchanged) ────────────────────────────────────────────
  const saveAndContinue = async () => {
    if (!user) {
      Alert.alert('No account found', 'Please sign in again and retry.');
      return;
    }

    setIsSaving(true);

    try {
      if (isRealignmentMode) {
        await AppStorage.removeItem(getPaywallReturnStateKey(user.id));
      } else {
        await AppStorage.setItem(
          getPaywallReturnStateKey(user.id),
          JSON.stringify({
            version: PAYWALL_RETURN_STATE_VERSION,
            currentStepId: currentStep.id,
            currentStepIndex: stepIndex,
            answers,
          })
        );
      }

      const { persistedOnboarding, persistedProfile } = await saveOnboardingQuestionnaire({
        answers,
        email: user.email,
        source: isRealignmentMode ? 'realignment' : undefined,
        userId: user.id,
      });

      queryClient.setQueryData(ONBOARDING_RESPONSE_QUERY_KEY(user.id), persistedOnboarding);
      queryClient.setQueryData(PROFILE_QUERY_KEY(user.id), persistedProfile);
      await queryClient.invalidateQueries({ queryKey: ['questionnaire-runs', user.id, 'journeys'] });

      if (isRealignmentMode && realignmentProgram) {
        router.replace('/(tabs)/program');
        return;
      }

      // The root navigation gate will move authenticated users to the right
      // next step once onboarding state is persisted.
      return;
    } catch (error: any) {
      Alert.alert('Could not save your onboarding', error?.message ?? 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (isSaving) {
      return;
    }

    const validation = validateCurrentStep(currentStep);
    if (validation !== true) {
      Alert.alert('Required', validation);
      return;
    }

    if (stepIndex === steps.length - 1) {
      await saveAndContinue();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const handleBack = () => {
    setStepIndex((current) => Math.max(0, current - 1));
  };

  // ─── Render: question interaction zones ────────────────────────────────
  const renderQuestion = (question: QuestionDefinition) => {
    if (question.type === 'number_input') {
      const currentValue = answers.questionValues[question.id];

      return (
        <LargeNumberInput
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChangeText={(value) => updateQuestionValue(question.id, value)}
          unit={question.placeholder}
          autoFocus
          onSubmitEditing={() => void handleNext()}
        />
      );
    }

    if (question.type === 'compound_number_input' && question.inputs) {
      return (
        <View style={{ marginTop: 24, gap: 16 }}>
          {question.inputs.map((input, index) => {
            const currentValue = answers.questionValues[input.id];
            const isLast = index === question.inputs!.length - 1;
            return (
              <InputText
                key={input.id}
                label={input.label}
                value={typeof currentValue === 'string' ? currentValue : ''}
                onChangeText={(value) => updateQuestionValue(input.id, value)}
                placeholder={input.placeholder || ''}
                autoFocus={index === 0}
                keyboardType="numeric"
                inputMode="numeric"
                onSubmitEditing={() => {
                  if (isLast) void handleNext();
                }}
              />
            );
          })}
        </View>
      );
    }

    if (question.type === 'multi_select') {
      const currentValue = answers.questionValues[question.id];
      const selectedValues = Array.isArray(currentValue) ? currentValue : [];

      return (
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {question.options?.map((option) => (
              <SelectChip
                key={option.id}
                label={option.label}
                selected={selectedValues.includes(option.id)}
                onPress={() => toggleQuestionValue(question.id, option.id)}
              />
            ))}
          </View>
          {question.allowEmpty && (
            <Text style={{ fontFamily: 'Satoshi-Regular', fontSize: 12, color: 'rgba(6,41,12,0.35)', marginTop: 14, textAlign: 'center' }}>
              You can skip this if nothing else applies.
            </Text>
          )}
        </View>
      );
    }

    // single_select — card-based options
    const currentValue = answers.questionValues[question.id];
    const customInputId = question.customInputId;
    const shouldShowCustomInput =
      Boolean(customInputId) &&
      typeof currentValue === 'string' &&
      currentValue === question.customOptionId;

    return (
      <View style={{ marginTop: 20, gap: 8 }}>
        {question.options?.map((option) => (
          <OptionCard
            key={option.id}
            label={option.label}
            sublabel={option.description}
            selected={currentValue === option.id}
            onPress={() => updateQuestionValue(question.id, option.id)}
          />
        ))}
        {shouldShowCustomInput && customInputId ? (
          <View style={{ marginTop: 8 }}>
            <InputText
              label={question.customInputLabel}
              value={
                typeof answers.questionValues[customInputId] === 'string'
                  ? answers.questionValues[customInputId]
                  : ''
              }
              onChangeText={(value) => updateQuestionValue(customInputId, value)}
              placeholder={question.customInputPlaceholder}
              multiline
              maxLength={160}
              autoFocus
            />
          </View>
        ) : null}
        {question.allowEmpty ? (
          <Text style={{ fontFamily: 'Satoshi-Regular', fontSize: 12, color: 'rgba(6,41,12,0.35)', marginTop: 8, textAlign: 'center' }}>
            You can skip this for now.
          </Text>
        ) : null}
      </View>
    );
  };

  // ─── Render: recommendation reveal ─────────────────────────────────────
  const renderRecommendation = () => {
    if (currentStep.type !== 'recommendation') {
      return null;
    }

    const journey = currentStep.journey;
    const rec = currentStep.recommendation;
    const programSlug = resolution.recommendedProgram;
    const programMeta = programSlug ? PROGRAM_METADATA[programSlug] : null;

    const primaryConcernCopy = resolution.primaryConcernLabel
      ? `You told us the main issue is ${resolution.primaryConcernLabel.toLowerCase()}.`
      : 'You gave us enough context to narrow this down clearly.';

    const stats = programMeta
      ? [
          { value: String(programMeta.totalDays), label: 'Days' },
          { value: programMeta.dailyMinutesLabel, label: 'Min / day' },
          { value: String(programMeta.phaseCount), label: 'Phases' },
        ]
      : undefined;

    return (
      <View style={{ marginTop: 24 }}>
        {/* Hero card */}
        <RecommendationHero
          title={rec.title}
          subtitle={rec.subtitle}
          programName={programMeta?.name}
          tagline={programMeta?.description}
          stats={stats}
        />

        {/* Why this fits */}
        <View style={{ marginTop: 20 }}>
          <WhyFitsCard text={`${primaryConcernCopy} ${rec.whyFits}`} />
        </View>

        {/* Focus areas as pills */}
        <View style={{ marginTop: 20 }}>
          <StepPill label={rec.focusLabel.toUpperCase()} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {rec.focusPoints.map((point, index) => (
              <FocusPill
                key={`${journey}-focus-${index}`}
                text={point}
              />
            ))}
          </View>
        </View>
      </View>
    );
  };

  // ─── Render: the interaction zone for each step type ───────────────────
  const renderCurrentStep = () => {
    switch (currentStep.type) {
      case 'quick_profile':
        return (
          <View style={{ marginTop: 20, gap: 12 }}>
            {!isAppleAuthenticated ? (
              <InputText
                label="NAME"
                value={answers.name}
                onChangeText={(value) => updateQuickProfile('name', value)}
                placeholder="What should we call you?"
                autoFocus
                maxLength={80}
              />
            ) : null}

            <LargeNumberInput
              variant="age"
              label="AGE"
              value={answers.age}
              onChangeText={(value) => updateQuickProfile('age', value)}
              maxLength={3}
            />

            <View style={{ marginTop: 4 }}>
              <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 9, letterSpacing: 9 * 0.18, color: 'rgba(6,41,12,0.35)', textTransform: 'uppercase', marginBottom: 10 }}>
                GENDER
              </Text>
              <GenderSegment
                options={[...GENDER_OPTIONS]}
                selected={answers.gender}
                onSelect={(value) => updateGender(value as GenderOption)}
              />
            </View>
          </View>
        );

      case 'path_choice':
        return (
          <View style={{ marginTop: 20, gap: 10 }}>
            {currentStep.options.map((option) => (
              <PathCard
                key={option.id}
                title={option.label}
                description={option.description}
                icon={option.id === 'self_select' ? 'navigate-outline' : 'compass-outline'}
                selected={answers.path === option.id}
                onPress={() => updatePath(option.id)}
              />
            ))}
          </View>
        );

      case 'program_choice':
        return (
          <View style={{ marginTop: 20, gap: 10 }}>
            {currentStep.options.map((option) => (
              <PathCard
                key={option.id}
                title={option.label}
                description={option.description}
                selected={answers.selfSelectJourney === option.id}
                onPress={() => updateSelfSelectJourney(option.id)}
              />
            ))}
          </View>
        );

      case 'guided_issue':
        return (
          <View style={{ marginTop: 20, gap: 10 }}>
            {currentStep.options.map((option) => (
              <PathCard
                key={option.id}
                title={option.label}
                description={option.description}
                selected={answers.guidedMainIssue === option.id}
                onPress={() => updateGuidedIssue(option.id)}
              />
            ))}
          </View>
        );

      case 'question':
        return renderQuestion(currentStep.question);

      case 'recommendation':
        return renderRecommendation();

      default:
        return null;
    }
  };

  // ─── CTA label ─────────────────────────────────────────────────────────
  const ctaLabel =
    isRealignmentMode && stepIndex === steps.length - 1
      ? 'Save and continue'
      : currentStep.type === 'recommendation'
        ? 'See plans'
        : 'Continue';

  const ctaVariant: 'primary' | 'highlight' =
    currentStep.type === 'recommendation' ? 'highlight' : 'primary';

  // Determine headline variant: serif for emotional questions, sans for utility
  const headlineVariant: 'serif' | 'sans' =
    currentStep.type === 'quick_profile' || currentStep.type === 'path_choice'
      ? 'sans'
      : 'serif';

  // ─── Loading state ─────────────────────────────────────────────────────
  if (!isDraftReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 32 }}>
        <StatusBar style="dark" />
        <Text style={{ fontFamily: 'Erode-Semibold', fontSize: 28, lineHeight: 34, color: '#06290C', textAlign: 'center' }}>
          {isRealignmentMode ? 'Preparing your program' : 'Restoring your progress'}
        </Text>
        <Text style={{ marginTop: 12, maxWidth: 280, fontFamily: 'Satoshi-Regular', fontSize: 15, lineHeight: 24, color: 'rgba(6,41,12,0.50)', textAlign: 'center' }}>
          {isRealignmentMode
            ? 'We are loading a few questions so your unlocked program matches your profile.'
            : 'We are picking up your questionnaire from where you left off.'}
        </Text>
      </View>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <StatusBar style="dark" />

      <StepContainer
        currentStep={stepIndex}
        totalSteps={steps.length}
        onBack={handleBack}
        showBack={stepIndex > 0}
        showProgress={currentStep.type !== 'recommendation'}
        footer={
          <CompassCTA
            label={ctaLabel}
            variant={ctaVariant}
            onPress={() => void handleNext()}
            loading={isSaving}
          />
        }
      >
        {/* Content with transition */}
        <RNAnimated.View
          key={`step-${stepIndex}`}
          style={{ opacity: stepFadeAnim }}
        >
          {/* Pill label */}
          <View style={{ marginTop: 28 }}>
            <StepPill label={STEP_PILL_LABELS[currentStep.type]} />
          </View>

          {/* Headline */}
          <StepHeadline
            title={currentStep.title}
            description={currentStep.description}
            variant={headlineVariant}
          />

          {isRealignmentMode ? (
            <View className="mt-6 rounded-3xl border border-forest/10 bg-white/80 px-5 py-4">
              <Text className="font-satoshi-bold text-[14px] text-forest">
                {realignmentProgramName
                  ? `${realignmentProgramName} is already unlocked`
                  : 'Your program is already unlocked'}
              </Text>
              <Text className="mt-2 font-satoshi text-[14px] leading-[22px] text-forest/60">
                Answer a few quick questions so we can tailor this program to the path you actually chose.
              </Text>
            </View>
          ) : null}

          {/* Interaction zone */}
          {renderCurrentStep()}
        </RNAnimated.View>
      </StepContainer>
    </KeyboardAvoidingView>
  );
}
