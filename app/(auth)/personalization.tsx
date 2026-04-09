import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ONBOARDING_RESPONSE_QUERY_KEY } from '@/hooks/useOnboardingResponse';
import { buildOnboardingSteps, createInitialOnboardingAnswers, getOnboardingResolution } from '@/lib/onboarding.flow';
import { hasMeaningfulOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft, saveOnboardingQuestionnaire } from '@/lib/onboarding.persistence';
import { GENDER_OPTIONS } from '@/lib/onboarding.types';
import type { GenderOption, GuidedIssueId, JourneyKey, OnboardingPath, OnboardingStep, QuestionDefinition } from '@/lib/onboarding.types';
import { useAuth } from '@/providers/auth';
import { PROFILE_QUERY_KEY } from '@/providers/profile';

function SegmentedProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View className="flex-row gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View key={`questionnaire-progress-${index}`} className="h-[4px] flex-1 overflow-hidden rounded-full bg-[#D8DED5]">
          {index <= currentStep && (
            <Animated.View 
              entering={FadeIn.duration(400)} 
              className="h-full w-full rounded-full bg-[#183226]" 
            />
          )}
        </View>
      ))}
    </View>
  );
}

function SelectionCard({
  compact = false,
  description,
  onPress,
  selected,
  title,
}: {
  compact?: boolean;
  description?: string;
  onPress: () => void;
  selected: boolean;
  title: string;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={animatedStyle}
        className={`mb-3 w-full rounded-[24px] border ${compact ? 'px-4 py-4' : 'px-5 py-4.5'} ${
          selected
            ? 'border-[#183226] bg-[#EEF2EB]'
            : 'border-[#DCE1D8] bg-white/88'
        }`}
      >
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text
              className={`font-satoshi-bold ${compact ? 'text-[15px] leading-[22px]' : 'text-[16px] leading-[24px]'} ${
                selected ? 'text-[#13281D]' : 'text-[#1A3024]'
              }`}
            >
              {title}
            </Text>
          </View>
          <View className={`mt-1 h-4 w-4 rounded-full border ${selected ? 'border-[#183226] bg-[#183226]' : 'border-[#BFB29B] bg-transparent'}`}>
            {selected ? <View className="m-[3px] h-[6px] w-[6px] rounded-full bg-[#F6F1E7]" /> : null}
          </View>
        </View>
        {description ? (
          <Text
            className={`mt-2.5 font-satoshi text-[14px] leading-[22px] ${
              selected ? 'text-[#3F473E]' : 'text-[#5D574E]'
            }`}
          >
            {description}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function RecommendationCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body: string;
}) {
  return (
    <View className="mb-4 rounded-[24px] border border-[#DCE1D8] bg-white/88 px-5 py-5">
      {eyebrow ? (
        <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-[#70695E]">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="mt-3 font-erode-semibold text-[26px] leading-[32px] text-[#13281D]">{title}</Text>
      <Text className="mt-2 font-satoshi text-[14px] leading-6 text-[#585249]">{body}</Text>
    </View>
  );
}

function isPositiveInteger(value: string) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

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
  const insets = useSafeAreaInsets();
  const progressLabel = answers.path
    ? `Step ${stepIndex + 1} of ${steps.length}`
    : stepIndex === 0
      ? 'Getting started'
      : 'Choose your path';

  useEffect(() => {
    if (stepIndex > steps.length - 1) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [stepIndex, steps.length]);

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

  useEffect(() => {
    if (!didRestoreDraft) {
      return;
    }

    Alert.alert('Progress restored', 'We restored your progress so you can keep going.');
    setDidRestoreDraft(false);
  }, [didRestoreDraft]);

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

  const renderQuestion = (question: QuestionDefinition) => {
    if (question.type === 'number_input') {
      const currentValue = answers.questionValues[question.id];

      return (
        <Input
          label="Answer"
          placeholder={question.placeholder}
          value={typeof currentValue === 'string' ? currentValue : ''}
          onChangeText={(value) => updateQuestionValue(question.id, value)}
          keyboardType={question.keyboardType}
          className="rounded-[20px] border-[#DCE1D8] bg-white/92 px-5 py-4 font-satoshi text-[15px] text-forest"
        />
      );
    }

    if (question.type === 'multi_select') {
      const currentValue = answers.questionValues[question.id];
      const selectedValues = Array.isArray(currentValue) ? currentValue : [];

      return (
        <View>
          <Text className="mb-4 font-satoshi text-sm text-forest/60">Choose any that apply.</Text>
          {question.options?.map((option) => (
            <SelectionCard
              key={option.id}
              title={option.label}
              description={option.description}
              selected={selectedValues.includes(option.id)}
              onPress={() => toggleQuestionValue(question.id, option.id)}
            />
          ))}
        </View>
      );
    }

    const currentValue = answers.questionValues[question.id];

    return (
      <View>
        {question.options?.map((option) => (
          <SelectionCard
            key={option.id}
            title={option.label}
            description={option.description}
            selected={currentValue === option.id}
            onPress={() => updateQuestionValue(question.id, option.id)}
          />
        ))}
      </View>
    );
  };

  const renderRecommendation = () => {
    if (currentStep.type !== 'recommendation') {
      return null;
    }

    const primaryConcernCopy = resolution.primaryConcernLabel
      ? `You told us the main issue is ${resolution.primaryConcernLabel.toLowerCase()}.`
      : 'You gave us enough context to narrow this down clearly.';

    return (
      <View>
        <View className="mb-5 rounded-[24px] bg-forest px-5 py-5 shadow-xl shadow-forest/20">
          <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-white/50">
            Recommended Path
          </Text>
          <Text className="mt-3 font-erode-bold text-[32px] leading-[36px] text-white">
            {currentStep.recommendation.title}
          </Text>
          <Text className="mt-3 font-satoshi text-[15px] leading-7 text-white/80">
            {currentStep.recommendation.subtitle}
          </Text>
        </View>

        <RecommendationCard
          eyebrow="Why this fits"
          title="Why we matched you here"
          body={`${primaryConcernCopy} ${currentStep.recommendation.whyFits}`}
        />

        <Text className="mb-3 mt-4 font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-forest/50">
          {currentStep.recommendation.focusLabel}
        </Text>
        {currentStep.recommendation.focusPoints.map((point, index) => (
          <View
            key={`${currentStep.journey}-focus-${index}`}
            className="mb-3 flex-row items-center rounded-[20px] border border-[#DCE1D8] bg-white/88 px-4 py-3.5"
          >
            <View className="mr-3 h-1.5 w-1.5 rounded-full bg-forest/30" />
            <Text className="flex-1 font-satoshi text-[14px] leading-6 text-forest/80">{point}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep.type) {
      case 'quick_profile':
        return (
          <View>
            <Input
              label="Name"
              placeholder="What should we call you?"
              value={answers.name}
              onChangeText={(value) => updateQuickProfile('name', value)}
              containerClassName="mb-5"
              className="rounded-[20px] border-[#DCE1D8] bg-white/92 px-5 py-4 font-satoshi text-[15px] text-forest"
            />
            <Input
              label="Age"
              placeholder="Your age"
              value={answers.age}
              onChangeText={(value) => updateQuickProfile('age', value)}
              keyboardType="number-pad"
              containerClassName="mb-5"
              className="rounded-[20px] border-[#DCE1D8] bg-white/92 px-5 py-4 font-satoshi text-[15px] text-forest"
            />

            <Text className="mb-3 ml-1 font-satoshi text-sm text-forest/65">Gender</Text>
            <View className="flex-col gap-3">
              {GENDER_OPTIONS.map((option) => (
                <SelectionCard
                  key={option}
                  compact
                  title={option}
                  selected={answers.gender === option}
                  onPress={() => updateGender(option)}
                />
              ))}
            </View>
          </View>
        );
      case 'path_choice':
        return (
          <View>
            {currentStep.options.map((option) => (
              <SelectionCard
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
          <View>
            {currentStep.options.map((option) => (
              <SelectionCard
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
          <View>
            {currentStep.options.map((option) => (
              <SelectionCard
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

  const primaryButtonLabel = stepIndex === steps.length - 1 ? 'See plans' : 'Continue';

  if (!isDraftReady) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F6F1] px-8">
        <StatusBar style="dark" />
        <Text className="font-erode-semibold text-3xl text-[#13281D] text-center">Restoring your progress</Text>
        <Text className="mt-3 max-w-[280px] font-satoshi text-base leading-7 text-[#5B554C] text-center">
          We are picking up your questionnaire from where you left off.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F6F6F1]">
      <StatusBar style="dark" />

      <View className="absolute -right-32 top-[-5%] h-[420px] w-[420px] rounded-full bg-[#EEF1EA]" />
      <View className="absolute -left-28 bottom-[-4%] h-[360px] w-[360px] rounded-full bg-[#F0F2ED]" />
      <View className="absolute left-10 top-24 h-20 w-20 rounded-full border border-[#DDE3D9] bg-[#FAFBF8]/80" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View 
          className="flex-1 px-6" 
          style={{ paddingTop: Math.max(insets.top + 16, 20), paddingBottom: insets.bottom }}
        >
          <SegmentedProgress currentStep={stepIndex} totalSteps={steps.length} />

          <View className="mb-4 mt-6 flex-row items-start justify-between">
            <View>
              <Text className="font-satoshi-bold text-[11px] uppercase tracking-[2.1px] text-[#726B60]">
                Personalization
              </Text>
              <Text className="mt-2 font-satoshi text-[13px] leading-6 text-[#6D665A]">
                A calmer start, tailored to what you need most.
              </Text>
            </View>
            <Text className="font-satoshi text-[12px] tracking-[1.5px] text-[#8C8578]">
              {progressLabel}
            </Text>
          </View>

          <Animated.View 
            key={`step-${stepIndex}`}
            entering={FadeIn.duration(500)}
            className="flex-1"
          >
            <View className="mb-7 max-w-[94%]">
              <Text className="font-erode-semibold text-[32px] leading-[36px] text-[#13281D]">
                {currentStep.title}
              </Text>
              {currentStep.description && (
                <Text className="mt-3 font-satoshi text-[15px] leading-7 text-[#5A544B]">
                  {currentStep.description}
                </Text>
              )}
            </View>

            <ScrollView
              className="flex-1"
              contentContainerClassName="pb-6"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderCurrentStep()}
            </ScrollView>
          </Animated.View>

          <View className="pb-4 pt-4">
            <Button
              label={primaryButtonLabel}
              onPress={() => void handleNext()}
              loading={isSaving}
              size="lg"
              className="rounded-full border border-[#183226] bg-[#173428] py-3.5 shadow-xl shadow-[#173428]/10"
              textClassName="font-satoshi-bold text-[14px] tracking-[0.2px] text-[#F5F0E4]"
            />
            {stepIndex > 0 ? (
              <Button
                label="Back"
                variant="ghost"
                onPress={handleBack}
                disabled={isSaving}
                className="mt-2 rounded-full"
                textClassName="font-satoshi text-[14px] text-[#5A544B]"
              />
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
