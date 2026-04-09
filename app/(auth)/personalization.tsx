import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Href, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  CompassCTA,
  FocusPointRow,
  InlineSelectRow,
  InputText,
  LargeNumberInput,
  ProgressLine,
  RecommendationHero,
  SelectChip,
  StepContainer,
  StepHeadline,
  StepPill,
  SurfaceSelectCard,
} from '@/components/onboarding/intake';
import { ONBOARDING_RESPONSE_QUERY_KEY } from '@/hooks/useOnboardingResponse';
import { buildOnboardingSteps, createInitialOnboardingAnswers, getOnboardingResolution } from '@/lib/onboarding.flow';
import { hasMeaningfulOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft, saveOnboardingQuestionnaire } from '@/lib/onboarding.persistence';
import { GENDER_OPTIONS } from '@/lib/onboarding.types';
import type { GenderOption, GuidedIssueId, JourneyKey, OnboardingPath, OnboardingStep, QuestionDefinition } from '@/lib/onboarding.types';
import { useAuth } from '@/providers/auth';
import { PROFILE_QUERY_KEY } from '@/providers/profile';

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

// ─── Screen ─────────────────────────────────────────────────────────────────
export default function Personalization() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [didRestoreDraft, setDidRestoreDraft] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [answers, setAnswers] = useState(createInitialOnboardingAnswers);

  const steps = useMemo(() => buildOnboardingSteps(answers), [answers]);
  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];
  const resolution = useMemo(() => getOnboardingResolution(answers), [answers]);

  // ─── Clamp step index if steps change ───────────────────────────────────
  useEffect(() => {
    if (stepIndex > steps.length - 1) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [stepIndex, steps.length]);

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
        console.error('Failed to restore onboarding draft', error);
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
  }, [user]);

  // ─── Auto-save draft ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isDraftReady || !user || isSaving) {
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
        console.error('Failed to save onboarding draft', error);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [answers, currentStep.id, isDraftReady, isSaving, stepIndex, user]);

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

    if (!question.required && question.allowEmpty) {
      return true;
    }

    switch (question.type) {
      case 'number_input':
        return (
          (typeof rawValue === 'string' && isPositiveInteger(rawValue)) ||
          'Enter a valid number before continuing.'
        );
      case 'single_select':
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
          (Boolean(answers.name.trim()) && isPositiveInteger(answers.age) && Boolean(answers.gender)) ||
          'Enter your name, a valid age, and your gender to continue.'
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
      const { persistedOnboarding, persistedProfile } = await saveOnboardingQuestionnaire({
        answers,
        email: user.email,
        userId: user.id,
      });

      queryClient.setQueryData(ONBOARDING_RESPONSE_QUERY_KEY(user.id), persistedOnboarding);
      queryClient.setQueryData(PROFILE_QUERY_KEY(user.id), persistedProfile);

      router.replace('/paywall' as Href);
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

    if (question.type === 'multi_select') {
      const currentValue = answers.questionValues[question.id];
      const selectedValues = Array.isArray(currentValue) ? currentValue : [];

      return (
        <View className="mt-8 flex-row flex-wrap" style={{ gap: 10 }}>
          {question.options?.map((option) => (
            <SelectChip
              key={option.id}
              label={option.label}
              selected={selectedValues.includes(option.id)}
              onPress={() => toggleQuestionValue(question.id, option.id)}
            />
          ))}
        </View>
      );
    }

    // single_select — inline text rows
    const currentValue = answers.questionValues[question.id];

    return (
      <View className="mt-8">
        {question.options?.map((option, index) => (
          <InlineSelectRow
            key={option.id}
            label={option.label}
            selected={currentValue === option.id}
            onPress={() => updateQuestionValue(question.id, option.id)}
            isLast={index === (question.options?.length ?? 0) - 1}
          />
        ))}
      </View>
    );
  };

  // ─── Render: recommendation reveal ─────────────────────────────────────
  const renderRecommendation = () => {
    if (currentStep.type !== 'recommendation') {
      return null;
    }

    const primaryConcernCopy = resolution.primaryConcernLabel
      ? `You told us the main issue is ${resolution.primaryConcernLabel.toLowerCase()}.`
      : 'You gave us enough context to narrow this down clearly.';

    return (
      <View className="mt-8">
        {/* Hero card */}
        <RecommendationHero
          title={`${currentStep.recommendation.title} fits your current pattern.`}
          subtitle={currentStep.recommendation.subtitle}
        />

        {/* Why this fits */}
        <View className="mt-6">
          <StepPill label="WHY THIS FITS" />
          <Text className="mt-4 font-satoshi text-[15px] leading-[26px] text-forest/70">
            {primaryConcernCopy} {currentStep.recommendation.whyFits}
          </Text>
        </View>

        {/* Divider */}
        <View className="my-4 h-[1px] w-[24px] bg-forest/15" />

        {/* Focus points */}
        <View>
          <StepPill label={currentStep.recommendation.focusLabel.toUpperCase()} />
          <View className="mt-4" style={{ gap: 16 }}>
            {currentStep.recommendation.focusPoints.map((point, index) => (
              <FocusPointRow
                key={`${currentStep.journey}-focus-${index}`}
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
          <View className="mt-8">
            <InputText
              value={answers.name}
              onChangeText={(value) => updateQuickProfile('name', value)}
              placeholder="What should we call you?"
              autoFocus
              maxLength={80}
            />

            <View className="mt-8">
              <Text className="font-satoshi-bold text-[10px] uppercase tracking-[2.4px] text-forest/35 mb-4">
                AGE
              </Text>
              <LargeNumberInput
                value={answers.age}
                onChangeText={(value) => updateQuickProfile('age', value)}
                unit="years"
                maxLength={3}
              />
            </View>

            <View className="mt-8">
              <Text className="font-satoshi-bold text-[10px] uppercase tracking-[2.4px] text-forest/35 mb-4">
                GENDER
              </Text>
              {GENDER_OPTIONS.map((option, index) => (
                <InlineSelectRow
                  key={option}
                  label={option}
                  selected={answers.gender === option}
                  onPress={() => updateGender(option)}
                  isLast={index === GENDER_OPTIONS.length - 1}
                />
              ))}
            </View>
          </View>
        );

      case 'path_choice':
        return (
          <View className="mt-8">
            {currentStep.options.map((option) => (
              <SurfaceSelectCard
                key={option.id}
                title={option.label}
                description={option.description}
                selected={answers.path === option.id}
                onPress={() => updatePath(option.id)}
              />
            ))}
          </View>
        );

      case 'program_choice':
        return (
          <View className="mt-8">
            {currentStep.options.map((option) => (
              <SurfaceSelectCard
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
          <View className="mt-8">
            {currentStep.options.map((option) => (
              <SurfaceSelectCard
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
  const ctaLabel = currentStep.type === 'recommendation' ? 'See plans' : 'Continue';

  // ─── Loading state ─────────────────────────────────────────────────────
  if (!isDraftReady) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <StatusBar style="dark" />
        <Text className="font-erode-semibold text-[28px] leading-[34px] text-forest text-center">
          Restoring your progress
        </Text>
        <Text className="mt-3 max-w-[280px] font-satoshi text-[15px] leading-[24px] text-forest/50 text-center">
          We are picking up your questionnaire from where you left off.
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
        footer={
          <CompassCTA
            label={ctaLabel}
            onPress={() => void handleNext()}
            loading={isSaving}
          />
        }
      >
        {/* Progress line */}
        <ProgressLine currentStep={stepIndex} totalSteps={steps.length} />

        {/* Content with transition */}
        <Animated.View
          key={`step-${stepIndex}`}
          entering={FadeIn.duration(400)}
        >
          {/* Pill label — 48px below progress */}
          <View className="mt-12">
            <StepPill label={STEP_PILL_LABELS[currentStep.type]} />
          </View>

          {/* Headline */}
          <StepHeadline
            title={currentStep.title}
            description={currentStep.description}
          />

          {/* Interaction zone */}
          {renderCurrentStep()}
        </Animated.View>
      </StepContainer>
    </KeyboardAvoidingView>
  );
}
