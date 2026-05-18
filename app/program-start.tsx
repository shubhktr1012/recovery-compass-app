import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { AppTypography } from '@/constants/typography';
import { AppColors } from '@/constants/theme';
import { useDailySteps } from '@/hooks/useDailySteps';
import { requestNotificationPermissionAsync } from '@/lib/notification-permissions';
import {
  getLocalProgramStartDate,
  getProgramStartRecommendation,
  type ProgramStartOption,
  type ProgramStartRecommendation,
} from '@/lib/programs/lifecycle';
import { markStepPermissionPromptDismissed } from '@/lib/step-permission-prompt';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { useProfile } from '@/providers/profile';
import type { ProgramSlug } from '@/types/content';

type PermissionStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'skipped'
  | 'unavailable'
  | 'error';

function isPermissionSatisfied(status: PermissionStatus) {
  return status === 'granted' || status === 'unavailable';
}

function StartChoice({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-[26px] px-5 py-5 border ${
        selected ? 'bg-forest border-forest/80' : 'border-forest/5 bg-white shadow-sm shadow-forest/5'
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View className="flex-row items-start gap-4">
        <View
          className={`h-7 w-7 rounded-full items-center justify-center border-[1.5px] ${
            selected ? 'border-transparent bg-white' : 'border-forest/10 bg-transparent'
          }`}
        >
          {selected && <Ionicons name="checkmark" size={16} color={AppColors.forest} />}
        </View>
        <View className="flex-1 -mt-0.5">
          <Text
            className={selected ? 'text-white' : 'text-forest'}
            style={AppTypography.displayCardSmTight}
          >
            {label}
          </Text>
          <Text
            className={`mt-1.5 ${selected ? 'text-white/65' : 'text-forest/50'}`}
            style={AppTypography.bodyCompact}
          >
            {description}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function PermissionRow({
  body,
  icon,
  status,
  title,
  isLast,
}: {
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: PermissionStatus;
  title: string;
  isLast?: boolean;
}) {
  const isGranted = status === 'granted';
  const isUnavailable = status === 'unavailable';
  const tickScale = useRef(new Animated.Value(isGranted ? 1 : 0)).current;

  useEffect(() => {
    if (isGranted) {
      Animated.spring(tickScale, {
        damping: 12,
        stiffness: 200,
        toValue: 1,
        useNativeDriver: true,
      }).start();
      return;
    }

    tickScale.setValue(0);
  }, [isGranted, tickScale]);

  return (
    <View className={`px-5 py-5 ${isLast ? '' : 'border-b border-forest/5'}`}>
      <View className="flex-row items-start gap-4">
        <View
          className={`h-11 w-11 items-center justify-center rounded-full ${
            isGranted ? 'bg-forest' : 'bg-sageSoft'
          }`}
        >
          <Ionicons
            name={isGranted ? 'checkmark' : icon}
            size={isGranted ? 18 : 20}
            color={isGranted ? AppColors.white : AppColors.forest}
          />
        </View>
        <View className="flex-1 mt-0.5">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-forest" style={AppTypography.bodyStrong}>
              {title}
            </Text>
            {isGranted ? (
              <Animated.View
                className="rounded-full bg-sageSoft px-2.5 py-1"
                style={{ transform: [{ scale: tickScale }] }}
              >
                <Text className="text-forest" style={[AppTypography.metaMedium, { lineHeight: 15 }]}>
                  Enabled
                </Text>
              </Animated.View>
            ) : null}
            {isUnavailable ? (
              <View className="rounded-full bg-forest/8 px-2.5 py-1">
                <Text className="text-forest/40" style={[AppTypography.metaMedium, { lineHeight: 15 }]}>
                  Not available
                </Text>
              </View>
            ) : null}
          </View>
          <Text className={`mt-1.5 ${isGranted ? 'text-forest/65' : 'text-forest/50'}`} style={AppTypography.bodyCompact}>
            {body}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getRecommendedChoiceCopy(recommendation: ProgramStartRecommendation) {
  if (recommendation.window === 'overnight_waiting') {
    return {
      label: 'Start today at 5:00 AM',
      description: 'Day 1 opens when the new program day begins.',
    };
  }

  if (recommendation.window === 'day_active') {
    return {
      label: 'Start today',
      description: 'Use today as Day 1 and begin immediately.',
    };
  }

  return {
    label: 'Start tomorrow',
    description: 'It is late in the program day, so Day 1 opens tomorrow morning.',
  };
}

export default function ProgramStartSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { access, configureProgramStart, profile, refreshProfile } = useProfile();
  const dailySteps = useDailySteps();
  const userId = user?.id ?? null;
  const startRecommendation = useMemo(() => getProgramStartRecommendation(new Date()), []);
  const recommendedChoiceCopy = getRecommendedChoiceCopy(startRecommendation);
  const [selectedOption, setSelectedOption] = useState<ProgramStartOption>(startRecommendation.option);
  const [isSaving, setIsSaving] = useState(false);
  const [hasConfiguredStart, setHasConfiguredStart] = useState(
    Boolean(access.scheduledStartDate)
  );
  const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>(() =>
    profile?.notifications_enabled || profile?.push_opt_in ? 'granted' : 'idle'
  );
  const [stepStatus, setStepStatus] = useState<PermissionStatus>('idle');
  const [notificationCanAskAgain, setNotificationCanAskAgain] = useState(true);
  const [stepCanAskAgain, setStepCanAskAgain] = useState(true);
  const programSlug = access.ownedProgram as ProgramSlug | null;

  const todayStartDate = useMemo(() => getLocalProgramStartDate('today'), []);
  const tomorrowStartDate = useMemo(() => getLocalProgramStartDate('tomorrow'), []);
  const selectedStartDate = selectedOption === 'today' ? todayStartDate : tomorrowStartDate;
  const recommendedOption = startRecommendation.option;

  useEffect(() => {
    if (access.scheduledStartDate) {
      setHasConfiguredStart(true);
    }
  }, [access.scheduledStartDate]);

  useEffect(() => {
    if (notificationStatus === 'requesting') return;

    if (profile?.notifications_enabled || profile?.push_opt_in) {
      setNotificationStatus('granted');
    }
  }, [notificationStatus, profile?.notifications_enabled, profile?.push_opt_in]);

  useEffect(() => {
    if (stepStatus === 'requesting') return;

    if (dailySteps.summary) {
      setStepCanAskAgain(dailySteps.summary.canAskAgain);
    }
  }, [dailySteps.summary, stepStatus]);

  const effectiveStepStatus = useMemo<PermissionStatus>(() => {
    if (stepStatus !== 'idle') return stepStatus;
    if (dailySteps.summary?.permissionState === 'ready') return 'granted';
    if (dailySteps.summary?.permissionState === 'unavailable') return 'unavailable';
    if (dailySteps.summary?.permissionState === 'denied') return 'denied';
    if (dailySteps.summary?.permissionState === 'error') return 'error';
    return 'idle';
  }, [dailySteps.summary?.permissionState, stepStatus]);

  const notificationSatisfied = isPermissionSatisfied(notificationStatus);
  const stepSatisfied = isPermissionSatisfied(effectiveStepStatus);
  const allPermissionsGranted = notificationSatisfied && stepSatisfied;
  const needsSettings =
    (notificationStatus === 'denied' && !notificationCanAskAgain) ||
    (effectiveStepStatus === 'denied' && !stepCanAskAgain);
  const isBusy =
    isSaving ||
    notificationStatus === 'requesting' ||
    stepStatus === 'requesting' ||
    dailySteps.isEnabling;
    
  const ctaLabel = (() => {
    if (isSaving) return 'Setting up...';
    if (needsSettings) return 'Open settings to continue';
    if (hasConfiguredStart && allPermissionsGranted) return 'Continue to program';
    return 'Confirm & enable access';
  })();

  const handleChoose = (option: ProgramStartOption) => {
    void Haptics.selectionAsync();
    setSelectedOption(option);
  };

  const syncNotificationPreference = async ({
    enabled,
    expoPushToken,
  }: {
    enabled: boolean;
    expoPushToken: string | null;
  }) => {
    if (!userId) return;

    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from('profiles')
      .update({
        expo_push_token: expoPushToken,
        notifications_enabled: enabled,
        push_opt_in: enabled,
        updated_at: updatedAt,
      })
      .eq('id', userId);

    if (error) throw error;
    await refreshProfile();
  };

  const handleEnableNotifications = async (): Promise<PermissionStatus> => {
    setNotificationStatus('requesting');

    try {
      const result = await requestNotificationPermissionAsync();
      const isEnabled = result.status === 'granted';
      const nextStatus: PermissionStatus = isEnabled ? 'granted' : result.status;
      setNotificationCanAskAgain(result.canAskAgain ?? false);

      await syncNotificationPreference({
        enabled: isEnabled,
        expoPushToken: result.expoPushToken,
      });

      setNotificationStatus(nextStatus);
      await Haptics.notificationAsync(
        isEnabled
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
      return nextStatus;
    } catch (error: any) {
      setNotificationStatus('error');
      Alert.alert('Notifications failed', error?.message ?? 'Please try again.');
      return 'error';
    }
  };

  const handleEnableSteps = async (): Promise<PermissionStatus> => {
    setStepStatus('requesting');

    try {
      const result = await dailySteps.enableStepTracking();
      const isEnabled = result.permissionState === 'ready';
      const nextStatus: PermissionStatus = isEnabled
        ? 'granted'
        : result.permissionState === 'unavailable'
          ? 'unavailable'
          : 'denied';
      setStepCanAskAgain(result.canAskAgain);
      setStepStatus(nextStatus);

      if (!isEnabled && userId) {
        await markStepPermissionPromptDismissed(userId);
      }

      await Haptics.notificationAsync(
        isEnabled
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
      return nextStatus;
    } catch (error: any) {
      setStepStatus('error');
      Alert.alert('Step tracking failed', error?.message ?? 'Please try again.');
      return 'error';
    }
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error: any) {
      Alert.alert(
        'Could not open settings',
        error?.message ?? 'Please open your device settings and enable the required permissions.'
      );
    }
  };

  const handleContinue = async () => {
    if (!programSlug) {
      router.replace('/' as const);
      return;
    }

    setIsSaving(true);

    try {
      if (needsSettings) {
        await handleOpenSettings();
        return;
      }

      let nextNotificationStatus = notificationStatus;
      let nextStepStatus = effectiveStepStatus;

      if (hasConfiguredStart && notificationSatisfied && stepSatisfied) {
        if (userId && nextStepStatus !== 'granted') {
           await markStepPermissionPromptDismissed(userId);
        }

        await Haptics.selectionAsync();
        router.replace('/(tabs)/program' as const);
        return;
      }

      if (!hasConfiguredStart) {
        await configureProgramStart(programSlug, selectedStartDate);
        setHasConfiguredStart(true);
      }

      if (!isPermissionSatisfied(nextNotificationStatus)) {
        nextNotificationStatus = await handleEnableNotifications();
      }

      if (!isPermissionSatisfied(nextStepStatus)) {
        nextStepStatus = await handleEnableSteps();
      }

      if (isPermissionSatisfied(nextNotificationStatus) && isPermissionSatisfied(nextStepStatus)) {
        if (userId && nextStepStatus !== 'granted') {
          await markStepPermissionPromptDismissed(userId);
        }

        await Haptics.selectionAsync();
        router.replace('/(tabs)/program' as const);
      }
    } catch (error: any) {
      Alert.alert(
        'Could not finish setup',
        error?.message ?? 'Please try again in a moment.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <View className="flex-1 flex-col px-6 pt-4 pb-8">
        {/* Navigation bar fixed at the top inside the safe area */}
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            hitSlop={20}
            className="h-11 w-11 items-center justify-center rounded-full border border-forest/10 bg-white"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color="#06290C" />
          </Pressable>
          <Text className="uppercase text-forest/35" style={[AppTypography.eyebrow, { letterSpacing: 1.6 }]}>
            Program Setup
          </Text>
          <View className="h-11 w-11" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero text */}
          <View className="mb-10">
            <Text className="text-forest tracking-[-0.03em]" style={AppTypography.displayHero}>
              Set up your first day.
            </Text>
            <Text className="mt-3 text-forest/60 pr-4" style={AppTypography.body}>
              Choose when to start, and grant the access needed to support your daily rhythm.
            </Text>
          </View>

          {/* Start choice */}
          <View className="gap-3 mb-12">
            <StartChoice
              label={recommendedChoiceCopy.label}
              description={recommendedChoiceCopy.description}
              selected={selectedOption === recommendedOption}
              onPress={() => handleChoose(recommendedOption)}
            />
            {recommendedOption === 'today' ? (
              <StartChoice
                label="Start tomorrow"
                description="Begin fresh at 5:00 AM tomorrow."
                selected={selectedOption === 'tomorrow'}
                onPress={() => handleChoose('tomorrow')}
              />
            ) : null}
          </View>

          {/* Permissions block */}
          <View>
            <View 
              className={`rounded-[28px] overflow-hidden border ${
                allPermissionsGranted ? 'border-forest/5 bg-surface' : 'border-forest/5 bg-white shadow-sm shadow-forest/5'
              }`}
            >
              <PermissionRow
                icon="notifications-outline"
                title="Notifications"
                body="Daily reminders when your session is ready."
                status={notificationStatus}
              />
              <PermissionRow
                icon="walk-outline"
                title="Step tracking"
                body="Movement stats that reset with your program day."
                status={effectiveStepStatus}
                isLast
              />
            </View>
            
            <View className="mt-5 flex-row items-center gap-2.5 px-4">
              <Ionicons name="lock-closed-outline" size={14} color="rgba(6,41,12,0.4)" />
              <Text className="flex-1 text-forest/40" style={AppTypography.meta}>
                Used only for your experience. We never sell or share your data.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Area with CTA */}
        <View className="pt-4">
          <Pressable
            onPress={handleContinue}
            disabled={isBusy}
            className={`rounded-full py-4 items-center justify-center ${
              isBusy ? 'bg-forest/55' : 'bg-forest'
            }`}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            {isSaving ? (
              <ActivityIndicator color={AppColors.white} />
            ) : (
              <Text className="text-white" style={AppTypography.buttonLg}>
                {ctaLabel}
              </Text>
            )}
          </Pressable>

          {needsSettings ? (
            <Text className="mt-4 text-center text-forest/40" style={AppTypography.meta}>
              Enable the denied permission in device settings, then return here.
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
