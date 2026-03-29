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
import { saveOnboardingQuestionnaire } from '@/lib/onboarding.persistence';
import { GENDER_OPTIONS } from '@/lib/onboarding.types';
import type { GenderOption, GuidedIssueId, JourneyKey, OnboardingPath, OnboardingStep, QuestionDefinition } from '@/lib/onboarding.types';
import { useAuth } from '@/providers/auth';
import { PROFILE_QUERY_KEY } from '@/providers/profile';

function SegmentedProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View className="flex-row gap-1.5">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View key={`questionnaire-progress-${index}`} className="h-[4px] flex-1 rounded-full bg-forest/10 overflow-hidden">
          {index <= currentStep && (
            <Animated.View 
              entering={FadeIn.duration(400)} 
              className="h-full w-full rounded-full bg-forest" 
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
        className={`mb-3 w-full rounded-[24px] border ${compact ? 'px-5 py-4' : 'px-6 py-5'} ${
          selected
            ? 'border-forest bg-forest shadow-lg shadow-forest/20'
            : 'border-forest/5 bg-white shadow-sm shadow-forest/5'
        }`}
      >
        <View className="flex-row items-center justify-between">
          <Text
            className={`font-satoshi-bold ${compact ? 'text-[15px]' : 'text-base'} ${
              selected ? 'text-white' : 'text-forest'
            }`}
          >
            {title}
          </Text>
          {selected && (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="ml-3 h-2.5 w-2.5 rounded-full bg-white"
            />
          )}
        </View>
        {description ? (
          <Text
            className={`mt-2 font-satoshi text-sm leading-[22px] ${
              selected ? 'text-white/80' : 'text-forest/60'
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
    <View className="mb-4 rounded-[28px] border border-forest/5 bg-white px-6 py-6 shadow-sm shadow-forest/5">
      {eyebrow ? (
        <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-forest/50">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="mt-3 font-erode-semibold text-[28px] leading-[34px] text-forest">{title}</Text>
      <Text className="mt-2 font-satoshi text-[15px] leading-relaxed text-forest/70">{body}</Text>
    </View>
  );
}

function isPositiveInteger(value: string) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

export default function Personalization() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
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
          className="rounded-[24px] border-forest/5 bg-white px-6 py-4 font-satoshi text-base text-forest shadow-sm shadow-forest/5"
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
        <View className="mb-5 rounded-[32px] bg-forest px-6 py-6 shadow-xl shadow-forest/20">
          <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-white/50">
            Recommended Path
          </Text>
          <Text className="mt-3 font-erode-bold text-4xl leading-10 text-white">
            {currentStep.recommendation.title}
          </Text>
          <Text className="mt-3 font-satoshi text-base leading-7 text-white/80">
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
            className="mb-3 flex-row items-center rounded-[24px] bg-white px-5 py-4 shadow-sm shadow-forest/5"
          >
            <View className="mr-3 h-1.5 w-1.5 rounded-full bg-forest/30" />
            <Text className="flex-1 font-satoshi text-[15px] leading-relaxed text-forest/80">{point}</Text>
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
              className="rounded-[24px] border-forest/5 bg-white px-6 py-4 font-satoshi text-base text-forest shadow-sm shadow-forest/5"
            />
            <Input
              label="Age"
              placeholder="Your age"
              value={answers.age}
              onChangeText={(value) => updateQuickProfile('age', value)}
              keyboardType="number-pad"
              containerClassName="mb-5"
              className="rounded-[24px] border-forest/5 bg-white px-6 py-4 font-satoshi text-base text-forest shadow-sm shadow-forest/5"
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

  return (
    <View className="flex-1 bg-sage">
      <StatusBar style="dark" />

      <View className="absolute -right-32 top-[-5%] h-[400px] w-[400px] rounded-full bg-white/40" />
      <View className="absolute -left-32 bottom-[-5%] h-[400px] w-[400px] rounded-full bg-[#FAFAF7]/60" />

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

          <View className="mb-4 mt-6">
            <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-forest/50">
              {progressLabel}
            </Text>
          </View>

          <Animated.View 
            key={`step-${stepIndex}`}
            entering={FadeIn.duration(500)}
            className="flex-1"
          >
            <View className="mb-6">
              <Text className="font-erode-bold text-[34px] leading-[40px] text-forest">
                {currentStep.title}
              </Text>
              {currentStep.description && (
                <Text className="mt-2 font-satoshi text-base leading-7 text-forest/70">
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
              className="rounded-full py-4 shadow-xl shadow-forest/10"
            />
            {stepIndex > 0 ? (
              <Button
                label="Back"
                variant="ghost"
                onPress={handleBack}
                disabled={isSaving}
                className="mt-2 rounded-full"
              />
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
