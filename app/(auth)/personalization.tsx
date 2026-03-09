import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ONBOARDING_RESPONSE_QUERY_KEY } from '@/hooks/useOnboardingResponse';
import { formatInr } from '@/lib/onboarding-metrics';
import { AppStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { PROFILE_QUERY_KEY, useProfile } from '@/providers/profile';

const TOTAL_STEPS = 16;
const PROJECTION_DAYS = 90;
const CALCULATING_STEP_INDEX = 14;
const FINAL_STEP_INDEX = 15;

const TARGET_OPTIONS = ['Quit Smoking', 'Quit Alcohol', 'Conquer Both'] as const;
const LANGUAGE_OPTIONS = ['English', 'Hindi'] as const;
const PAST_ATTEMPTS_OPTIONS = ['First time', 'Tried once', 'Tried multiple times'] as const;
const TRIGGER_OPTIONS = ['Waking up', 'Socializing', 'Work stress', 'Late at night', 'Boredom'] as const;
const ROOT_CAUSE_OPTIONS = ['To relax', 'To escape stress', 'Anger / frustration', 'Habit / autopilot'] as const;
const PHYSICAL_TOLL_OPTIONS = ['Always', 'Often', 'Rarely'] as const;
const PRIMARY_GOAL_OPTIONS = [
  'Regain my health',
  'Save my money',
  'Be stronger for my family',
  'Prove to myself I can',
] as const;
const CALCULATING_MESSAGES = [
  'Analyzing your triggers...',
  'Calculating your financial upside...',
  'Building your 90-day protocol...',
] as const;

type WizardData = {
  age: string;
  dailyConsumptionAmount: string;
  dailyConsumptionCost: string;
  fullName: string;
  languageSelection: string;
  mentalToll: boolean | null;
  pastAttempts: string;
  physicalToll: string;
  primaryGoal: string;
  rootCause: string;
  targetSelection: string;
  triggers: string[];
};

type StepMeta = {
  title: string;
  description: string;
};

const STEP_META: StepMeta[] = [
  { title: 'What brings you here today?', description: 'Pick the outcome you want us to build your plan around.' },
  { title: 'Choose your language', description: 'We will tailor the tone and examples to your comfort zone.' },
  { title: 'Let’s personalize your journey', description: 'Your name and age help us shape the experience around you.' },
  { title: 'Tell us about the past', description: 'Your quitting history helps us understand your pressure points.' },
  { title: 'When do cravings hit the hardest?', description: 'Choose the moments that pull you back most often.' },
  { title: 'What usually drives the habit?', description: 'We want the trigger behind the trigger.' },
  { title: 'How is this hitting your body?', description: 'A quick reality check makes the next step more personal.' },
  { title: 'And what about the mental toll?', description: 'This helps us calibrate the emotional side of the plan.' },
  { title: 'Let’s look at the numbers', description: 'Daily consumption and daily spend unlock your financial projection.' },
  { title: 'This is not a willpower problem', description: 'It is a loop, and loops can be redesigned.' },
  { title: 'What is your number one reason?', description: 'Your strongest reason becomes the emotional anchor for the plan.' },
  { title: 'Your body wants to recover', description: 'Healing starts earlier than most people think.' },
  { title: 'You are not doing this alone', description: 'The system works better when it feels like a brotherhood, not a lecture.' },
  { title: 'The proof is in the pattern change', description: 'Small daily wins compound fast when the plan fits your triggers.' },
  { title: 'Calculating your custom plan...', description: 'Give us a second to assemble your 90-day projection.' },
  { title: 'Here is what the next 90 days can look like', description: 'This is the version of your life we want to hand back to you.' },
];

function OptionCard({
  description,
  onPress,
  selected = false,
  title,
}: {
  description?: string;
  onPress: () => void;
  selected?: boolean;
  title: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className={`rounded-3xl border px-5 py-4 mb-3 ${
        selected ? 'bg-forest border-forest' : 'bg-white border-gray-200'
      }`}
      onPress={onPress}
    >
      <Text className={`font-satoshi-bold text-base ${selected ? 'text-white' : 'text-forest'}`}>{title}</Text>
      {description ? (
        <Text className={`font-satoshi mt-1 leading-6 ${selected ? 'text-white/80' : 'text-gray-500'}`}>
          {description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function InfoCard({
  body,
  eyebrow,
  title,
}: {
  body: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
      {eyebrow ? <Text className="font-satoshi-bold text-xs uppercase text-gray-400 mb-2">{eyebrow}</Text> : null}
      <Text className="font-erode-semibold text-2xl text-forest mb-2">{title}</Text>
      <Text className="font-satoshi text-base leading-7 text-gray-600">{body}</Text>
    </View>
  );
}

function getUnitsLabel(targetSelection: string) {
  if (targetSelection === 'Quit Alcohol') return 'drinks avoided';
  if (targetSelection === 'Quit Smoking') return 'cigarettes avoided';
  return 'vices sidestepped';
}

export default function Personalization() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useProfile();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [calculationMessageIndex, setCalculationMessageIndex] = useState(0);
  const [data, setData] = useState<WizardData>({
    age: '',
    dailyConsumptionAmount: '',
    dailyConsumptionCost: '',
    fullName: '',
    languageSelection: '',
    mentalToll: null,
    pastAttempts: '',
    physicalToll: '',
    primaryGoal: '',
    rootCause: '',
    targetSelection: '',
    triggers: [],
  });

  const projection = useMemo(() => {
    const dailyAmount = Number(data.dailyConsumptionAmount) || 0;
    const dailyCost = Number(data.dailyConsumptionCost) || 0;
    const monthlySpend = Math.round(dailyCost * 30);
    const yearlySpend = Math.round(dailyCost * 365);
    const projectedSavings90Days = Math.round(dailyCost * PROJECTION_DAYS);
    const avoidedUnits90Days = dailyAmount * PROJECTION_DAYS;

    return {
      avoidedUnits90Days,
      dailyAmount,
      monthlySpend,
      projectedSavings90Days,
      yearlySpend,
    };
  }, [data.dailyConsumptionAmount, data.dailyConsumptionCost]);

  useEffect(() => {
    if (step !== CALCULATING_STEP_INDEX) return;

    setCalculationMessageIndex(0);

    const messageInterval = setInterval(() => {
      setCalculationMessageIndex((index) => (index + 1) % CALCULATING_MESSAGES.length);
    }, 900);

    const advanceTimer = setTimeout(() => {
      setStep(FINAL_STEP_INDEX);
    }, 2600);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(advanceTimer);
    };
  }, [step]);

  const currentStep = STEP_META[step];

  const handleUpdate = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((previous) => ({ ...previous, [key]: value }));
  };

  const toggleTrigger = (trigger: string) => {
    void Haptics.selectionAsync();

    setData((previous) => {
      const exists = previous.triggers.includes(trigger);
      if (exists) {
        return { ...previous, triggers: previous.triggers.filter((item) => item !== trigger) };
      }

      if (previous.triggers.length >= 3) {
        Alert.alert('Top 3 only', 'Choose the three moments that hit you hardest for now.');
        return previous;
      }

      return { ...previous, triggers: [...previous.triggers, trigger] };
    });
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        return Boolean(data.targetSelection) || 'Choose what you want to take control of.';
      case 1:
        return Boolean(data.languageSelection) || 'Choose a language to continue.';
      case 2:
        return (
          (Boolean(data.fullName.trim()) &&
            Boolean(data.age.trim()) &&
            Number.isInteger(Number(data.age)) &&
            Number(data.age) > 0) ||
          'Enter your name and a valid age.'
        );
      case 3:
        return Boolean(data.pastAttempts) || 'Tell us whether you have tried before.';
      case 4:
        return data.triggers.length > 0 || 'Pick at least one trigger.';
      case 5:
        return Boolean(data.rootCause) || 'Choose the main driver.';
      case 6:
        return Boolean(data.physicalToll) || 'Choose the option that feels true.';
      case 7:
        return data.mentalToll !== null || 'Choose yes or no.';
      case 8:
        return (
          (Number(data.dailyConsumptionAmount) > 0 && Number(data.dailyConsumptionCost) > 0) ||
          'Enter your daily amount and daily spend.'
        );
      case 10:
        return Boolean(data.primaryGoal) || 'Choose the goal that matters most.';
      default:
        return true;
    }
  };

  const saveOnboarding = async () => {
    setLoading(true);

    try {
      if (!user) {
        throw new Error('No user found');
      }

      const updatedAt = new Date().toISOString();
      const onboardingPayload = {
        user_id: user.id,
        age: Number(data.age),
        daily_consumption_amount: Number(data.dailyConsumptionAmount),
        daily_consumption_cost: Number(data.dailyConsumptionCost),
        full_name: data.fullName.trim(),
        language_selection: data.languageSelection,
        mental_toll: data.mentalToll,
        past_attempts: data.pastAttempts,
        physical_toll: data.physicalToll,
        primary_goal: data.primaryGoal,
        root_cause: data.rootCause,
        target_selection: data.targetSelection,
        triggers: data.triggers,
        updated_at: updatedAt,
      };

      const { data: persistedOnboarding, error: onboardingError } = await supabase
        .from('onboarding_responses')
        .upsert(onboardingPayload, { onConflict: 'user_id' })
        .select(
          'id, user_id, target_selection, language_selection, full_name, age, past_attempts, triggers, root_cause, physical_toll, mental_toll, daily_consumption_amount, daily_consumption_cost, primary_goal, created_at, updated_at'
        )
        .single();

      if (onboardingError) throw onboardingError;

      const profilePayload = {
        id: user.id,
        email: user.email ?? null,
        onboarding_complete: true,
        updated_at: updatedAt,
      };

      const { data: persistedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select('id, email, onboarding_complete, created_at, updated_at, active_program, expo_push_token, push_opt_in')
        .single();

      if (profileError) throw profileError;
      if (!persistedProfile?.onboarding_complete) {
        throw new Error('Profile setup did not persist. Please try again.');
      }

      await AppStorage.setItem('hasSeenOnboarding', 'true');

      queryClient.setQueryData(ONBOARDING_RESPONSE_QUERY_KEY(user.id), persistedOnboarding);
      queryClient.setQueryData(PROFILE_QUERY_KEY(user.id), persistedProfile);

      await refreshProfile();
    } catch (error: any) {
      Alert.alert('Could not save your plan', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === FINAL_STEP_INDEX) {
      await saveOnboarding();
      return;
    }

    if (step === CALCULATING_STEP_INDEX) {
      return;
    }

    const validation = validateStep();
    if (validation !== true) {
      Alert.alert('Required', validation);
      return;
    }

    void Haptics.selectionAsync();
    setStep((previous) => previous + 1);
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View>
            {TARGET_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                title={option}
                description="We will tailor the journey, messaging, and projection around this goal."
                selected={data.targetSelection === option}
                onPress={() => handleUpdate('targetSelection', option)}
              />
            ))}
          </View>
        );
      case 1:
        return (
          <View>
            {LANGUAGE_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                title={option}
                description="This changes the tone of the journey, not the science behind it."
                selected={data.languageSelection === option}
                onPress={() => handleUpdate('languageSelection', option)}
              />
            ))}
          </View>
        );
      case 2:
        return (
          <View className="space-y-5">
            <Input
              label="Full name"
              placeholder="What should we call you?"
              value={data.fullName}
              onChangeText={(value) => handleUpdate('fullName', value)}
            />
            <Input
              label="Age"
              placeholder="Your age"
              value={data.age}
              keyboardType="number-pad"
              onChangeText={(value) => handleUpdate('age', value)}
            />
          </View>
        );
      case 3:
        return (
          <View>
            {PAST_ATTEMPTS_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                title={option}
                selected={data.pastAttempts === option}
                onPress={() => handleUpdate('pastAttempts', option)}
              />
            ))}
          </View>
        );
      case 4:
        return (
          <View>
            <Text className="font-satoshi text-sm text-gray-400 mb-4">Choose up to 3 triggers.</Text>
            {TRIGGER_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                title={option}
                selected={data.triggers.includes(option)}
                onPress={() => toggleTrigger(option)}
              />
            ))}
          </View>
        );
      case 5:
        return (
          <View>
            {ROOT_CAUSE_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                title={option}
                selected={data.rootCause === option}
                onPress={() => handleUpdate('rootCause', option)}
              />
            ))}
          </View>
        );
      case 6:
        return (
          <View>
            {PHYSICAL_TOLL_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                title={option}
                selected={data.physicalToll === option}
                onPress={() => handleUpdate('physicalToll', option)}
              />
            ))}
          </View>
        );
      case 7:
        return (
          <View>
            <OptionCard
              title="Yes, I feel guilt or regret after giving in."
              selected={data.mentalToll === true}
              onPress={() => handleUpdate('mentalToll', true)}
            />
            <OptionCard
              title="No, not really."
              selected={data.mentalToll === false}
              onPress={() => handleUpdate('mentalToll', false)}
            />
          </View>
        );
      case 8:
        return (
          <View className="space-y-5">
            <Input
              label="How much do you consume daily?"
              placeholder="e.g. 12"
              value={data.dailyConsumptionAmount}
              keyboardType="number-pad"
              onChangeText={(value) => handleUpdate('dailyConsumptionAmount', value)}
            />
            <Input
              label="How much does that cost you each day?"
              placeholder="e.g. 250"
              value={data.dailyConsumptionCost}
              keyboardType="decimal-pad"
              onChangeText={(value) => handleUpdate('dailyConsumptionCost', value)}
            />
            <View className="rounded-3xl bg-forest p-5">
              <Text className="font-satoshi-bold text-white/70 text-xs uppercase mb-3">The cost of autopilot</Text>
              <Text className="font-erode-bold text-white text-4xl mb-3">{formatInr(projection.monthlySpend)}</Text>
              <Text className="font-satoshi text-white/80 mb-4">That is your projected monthly spend at the current pace.</Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="font-satoshi text-white/60 text-xs mb-1">Monthly</Text>
                  <Text className="font-satoshi-bold text-white text-lg">{formatInr(projection.monthlySpend)}</Text>
                </View>
                <View>
                  <Text className="font-satoshi text-white/60 text-xs mb-1">Yearly</Text>
                  <Text className="font-satoshi-bold text-white text-lg">{formatInr(projection.yearlySpend)}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      case 9:
        return (
          <View>
            <InfoCard
              eyebrow="Neuroscience"
              title="It is not a lack of discipline"
              body="The loop is chemical, emotional, and environmental. Recovery Compass attacks all three with trigger mastery, craving redirection, and daily reinforcement that compounds."
            />
            <InfoCard
              eyebrow="90-Day Freedom System"
              title="One system, three levers"
              body="Trigger mastery stops the pattern early. Craving redirection gives you a better move in the moment. Neuroscience-backed repetition helps the new identity stick."
            />
          </View>
        );
      case 10:
        return (
          <View>
            {PRIMARY_GOAL_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                title={option}
                selected={data.primaryGoal === option}
                onPress={() => handleUpdate('primaryGoal', option)}
              />
            ))}
          </View>
        );
      case 11:
        return (
          <View>
            <InfoCard
              eyebrow="24 Hours"
              title="Your body starts responding immediately"
              body="Blood pressure begins settling, inflammation starts cooling off, and the first signs of recovery show up faster than most people expect."
            />
            <InfoCard
              eyebrow="2 Weeks to 1 Month"
              title="Energy starts coming back online"
              body="Breathing, sleep quality, mental sharpness, and daily energy begin to improve when the cycle stops winning every day."
            />
          </View>
        );
      case 12:
        return (
          <View>
            <InfoCard
              eyebrow="Private Network"
              title="A brotherhood beats isolation"
              body="The app is designed so you never feel like you are white-knuckling this alone. Private accountability, anonymous support, and visible wins make the hard days easier to survive."
            />
          </View>
        );
      case 13:
        return (
          <View>
            <InfoCard
              eyebrow="Proof"
              title="“I finally stopped negotiating with myself.”"
              body="A strong system changes the daily script. The goal is not just fewer cravings. It is fewer arguments in your own head, more control, more money, and more respect for the man in the mirror."
            />
            <View className="rounded-3xl bg-white border border-gray-200 p-5">
              <Text className="font-satoshi-bold text-yellow-500 text-sm mb-2">★★★★★</Text>
              <Text className="font-satoshi text-gray-600 leading-7">
                “The projection hit me hard. For the first time, I could actually see what staying the same was costing me.”
              </Text>
            </View>
          </View>
        );
      case 14:
        return (
          <View className="flex-1 items-center justify-center pt-16">
            <View className="w-24 h-24 rounded-full bg-forest items-center justify-center mb-6">
              <ActivityIndicator color="white" size="large" />
            </View>
            <Text className="font-erode-bold text-3xl text-forest text-center mb-3">Building your plan...</Text>
            <Text className="font-satoshi text-gray-500 text-center text-base">
              {CALCULATING_MESSAGES[calculationMessageIndex]}
            </Text>
          </View>
        );
      case 15:
        return (
          <View>
            <View className="rounded-3xl bg-forest p-6 mb-5">
              <Text className="font-satoshi-bold text-white/70 text-xs uppercase mb-3">Money saved in 90 days</Text>
              <Text className="font-erode-bold text-white text-5xl mb-2">{formatInr(projection.projectedSavings90Days)}</Text>
              <Text className="font-satoshi text-white/80">This is the cost of the old pattern if nothing changes.</Text>
            </View>

            <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
              <Text className="font-erode-semibold text-2xl text-forest mb-2">{projection.avoidedUnits90Days.toLocaleString()} {getUnitsLabel(data.targetSelection)}</Text>
              <Text className="font-satoshi text-gray-600 leading-7">
                That is your projected upside across the next {PROJECTION_DAYS} days if you follow through.
              </Text>
            </View>

            <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
              <Text className="font-erode-semibold text-2xl text-forest mb-2">Health gained</Text>
              <Text className="font-satoshi text-gray-600 leading-7">
                Expect stronger energy, deeper sleep, reduced anxiety, and a clearer sense that you are back in command of your own behavior.
              </Text>
            </View>

            <View className="rounded-3xl bg-sage border border-gray-200 p-5">
              <Text className="font-satoshi-bold text-forest/70 text-xs uppercase mb-2">Your why</Text>
              <Text className="font-erode-semibold text-2xl text-forest mb-2">{data.primaryGoal}</Text>
              <Text className="font-satoshi text-gray-600 leading-7">
                We will keep this in front of you when motivation dips and cravings try to negotiate.
              </Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const primaryButtonLabel =
    step === FINAL_STEP_INDEX ? 'VIEW MY PLAN' : step === 13 ? 'Build My Plan' : 'Continue';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <View className="flex-1 px-6 pt-6">
        <View className="mb-6">
          <Text className="text-sm font-satoshi-bold text-gray-400 mb-2">
            Step {step + 1} of {TOTAL_STEPS}
          </Text>
          <View className="h-1 bg-gray-200 rounded-full mb-6 overflow-hidden">
            <View
              className="h-full bg-forest"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </View>
          <Text className="font-erode-bold text-3xl text-forest mb-2">{currentStep.title}</Text>
          <Text className="font-satoshi text-gray-500 text-lg">{currentStep.description}</Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-6"
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {step !== CALCULATING_STEP_INDEX ? (
          <View className="pb-8 pt-4">
            <Button
              label={primaryButtonLabel}
              onPress={() => void handleNext()}
              loading={loading}
              size="lg"
            />
            {step > 0 ? (
              <Button
                label="Back"
                variant="ghost"
                onPress={() => setStep((previous) => Math.max(0, previous - 1))}
                className="mt-2"
                disabled={loading}
              />
            ) : null}
          </View>
        ) : (
          <View className="pb-8 pt-4" />
        )}
      </View>
    </SafeAreaView>
  );
}
