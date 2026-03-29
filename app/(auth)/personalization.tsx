import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

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
        <View key={`questionnaire-progress-${index}`} className="h-[3px] flex-1 rounded-full bg-forest/10">
          <View className={`h-[3px] rounded-full ${index <= currentStep ? 'bg-forest' : 'bg-transparent'}`} />
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
  return (
    <Pressable
      style={({ pressed }) => [
        styles.selectionCardBase,
        compact ? styles.selectionCardCompact : styles.selectionCardRegular,
        selected ? styles.selectionCardSelected : styles.selectionCardIdle,
        pressed ? styles.selectionCardPressed : null,
      ]}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <Text
          style={[
            styles.selectionCardTitle,
            compact ? styles.selectionCardTitleCompact : styles.selectionCardTitleRegular,
            selected ? styles.selectionCardTitleSelected : styles.selectionCardTitleIdle,
          ]}
        >
          {title}
        </Text>
        {selected ? <View style={styles.selectionCardIndicator} /> : null}
      </View>
      {description ? (
        <Text
          style={[
            styles.selectionCardDescription,
            selected ? styles.selectionCardDescriptionSelected : styles.selectionCardDescriptionIdle,
          ]}
        >
          {description}
        </Text>
      ) : null}
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
    <View className="mb-4 rounded-[28px] border border-forest/10 bg-white/90 px-5 py-5">
      {eyebrow ? (
        <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-forest/55">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="mt-3 font-erode-semibold text-[30px] leading-[36px] text-forest">{title}</Text>
      <Text className="mt-3 font-satoshi text-base leading-7 text-forest/75">{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selectionCardBase: {
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  selectionCardCompact: {
    paddingVertical: 16,
  },
  selectionCardRegular: {
    paddingVertical: 20,
  },
  selectionCardIdle: {
    backgroundColor: '#F5FAF6',
    borderColor: '#D4E1D6',
  },
  selectionCardSelected: {
    backgroundColor: '#05290C',
    borderColor: '#05290C',
    shadowColor: '#05290C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  selectionCardPressed: {
    opacity: 0.92,
  },
  selectionCardTitle: {
    fontFamily: 'Satoshi-Bold',
  },
  selectionCardTitleCompact: {
    fontSize: 15,
  },
  selectionCardTitleRegular: {
    fontSize: 16,
  },
  selectionCardTitleIdle: {
    color: '#05290C',
  },
  selectionCardTitleSelected: {
    color: '#FFFFFF',
  },
  selectionCardDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 8,
  },
  selectionCardDescriptionIdle: {
    color: 'rgba(5, 41, 12, 0.72)',
  },
  selectionCardDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
  selectionCardIndicator: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 10,
    marginLeft: 12,
    width: 10,
  },
});

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
          className="rounded-[28px] border-forest/10 bg-sage/60 py-4 text-forest"
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
        <View className="mb-5 rounded-[32px] bg-forest px-6 py-6">
          <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-white/65">
            Recommended Path
          </Text>
          <Text className="mt-3 font-erode-bold text-4xl leading-10 text-white">
            {currentStep.recommendation.title}
          </Text>
          <Text className="mt-3 font-satoshi text-base leading-7 text-white/82">
            {currentStep.recommendation.subtitle}
          </Text>
        </View>

        <RecommendationCard
          eyebrow="Why this fits"
          title="Why we matched you here"
          body={`${primaryConcernCopy} ${currentStep.recommendation.whyFits}`}
        />

        <Text className="mb-3 font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-forest/55">
          {currentStep.recommendation.focusLabel}
        </Text>
        {currentStep.recommendation.focusPoints.map((point, index) => (
          <View
            key={`${currentStep.journey}-focus-${index}`}
            className="mb-3 rounded-[28px] border border-forest/10 bg-white/90 px-5 py-5"
          >
            <Text className="font-satoshi text-base leading-7 text-forest/75">{point}</Text>
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
              className="rounded-[28px] border-forest/10 bg-sage/60 py-4 text-forest"
            />
            <Input
              label="Age"
              placeholder="Your age"
              value={answers.age}
              onChangeText={(value) => updateQuickProfile('age', value)}
              keyboardType="number-pad"
              containerClassName="mb-5"
              className="rounded-[28px] border-forest/10 bg-sage/60 py-4 text-forest"
            />

            <Text className="mb-3 ml-1 font-satoshi text-sm text-forest/65">Gender</Text>
            <View className="flex-row flex-wrap gap-3">
              {GENDER_OPTIONS.map((option) => (
                <View key={option} className="min-w-[31%] flex-1">
                  <SelectionCard
                    compact
                    title={option}
                    selected={answers.gender === option}
                    onPress={() => updateGender(option)}
                  />
                </View>
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
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />

      <View className="absolute -right-8 top-8 h-44 w-44 rounded-full bg-sage/50" />
      <View className="absolute -left-10 bottom-16 h-56 w-56 rounded-full bg-white/60" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View className="flex-1 px-6 pt-5">
          <SegmentedProgress currentStep={stepIndex} totalSteps={steps.length} />

          <View className="mb-6 mt-5">
            <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-forest/50">
              {progressLabel}
            </Text>
            <Text className="mt-3 font-erode-bold text-[34px] leading-[42px] text-forest">
              {currentStep.title}
            </Text>
            <Text className="mt-3 font-satoshi text-base leading-7 text-forest/68">
              {currentStep.description}
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="pb-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderCurrentStep()}
          </ScrollView>

          <View className="pb-8 pt-4">
            <Button
              label={primaryButtonLabel}
              onPress={() => void handleNext()}
              loading={isSaving}
              size="lg"
              className="rounded-full py-4"
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
    </SafeAreaView>
  );
}
