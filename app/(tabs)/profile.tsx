import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Svg, Path } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { useAuth } from '@/providers/auth';
import { clearDevClockOverride, readDevClockOverride, setDevClockOverride, useMinuteClock } from '@/hooks/useMinuteClock';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { useDailySteps } from '@/hooks/useDailySteps';
import { EMPTY_FINALIZED_DAY_STATES, useFinalizedDayStates } from '@/hooks/useFinalizedDayStates';
import { getProgramStatisticsSummary } from '@/lib/program-statistics';
import { buildDayStateProgressSummary, buildRollingCompletionSummary } from '@/lib/day-state-summary';
import {
  ACCOUNT_SETTINGS_ROUTE,
  ACCOUNT_STATISTICS_ROUTE,
  MY_PROGRAMS_ROUTE,
  PROGRAM_TAB_ROUTE,
} from '@/lib/navigation/routes';
import { getProgramScheduleStartSource, isProgramStartPending } from '@/lib/programs/lifecycle';
import { getProgramScheduledDay } from '@/lib/programs/schedule';
import { useProfile } from '@/providers/profile';
import { supabase } from '@/lib/supabase';
import { NotificationService } from '@/lib/notifications';
import type { NotificationPlan, NotificationPlanType } from '@/lib/notification-scheduler';
import { EditProfileSheet } from '@/components/account/EditProfileSheet';
import { AccountWatermark } from '@/components/ui/TabWatermarks';
import type { ProgramSlug } from '@/types/content';
import { AppColors } from '@/constants/theme';
import { AppTypography } from '@/constants/typography';
import { resolveProfileIdentity } from '@/lib/profile-identity';
import { buildWidgetPayload, syncWidgetData } from '@/lib/widget-bridge';

const STAT_CARD_WIDTH = 164;
const STAT_CARD_GAP = 10;
const STAT_CARD_SNAP = STAT_CARD_WIDTH + STAT_CARD_GAP;
const DEV_NOTIFICATION_TYPES: {
  delaySeconds: number;
  label: string;
  timeSlot?: NotificationPlan['data']['timeSlot'];
  type: NotificationPlanType;
}[] = [
  { delaySeconds: 15, label: 'Morning ready', timeSlot: 'morning', type: 'morning_session_ready' },
  { delaySeconds: 30, label: 'Afternoon check-in', timeSlot: 'afternoon', type: 'afternoon_check_in' },
  { delaySeconds: 45, label: 'Evening routine', timeSlot: 'evening', type: 'evening_routine' },
  { delaySeconds: 60, label: 'Missed morning catch-up', type: 'missed_morning_catch_up' },
  { delaySeconds: 75, label: 'Day completed', type: 'day_completed' },
  { delaySeconds: 90, label: 'Partial day', type: 'partial_day' },
  { delaySeconds: 105, label: 'Absence waiting', type: 'absence_waiting' },
  { delaySeconds: 120, label: 'Absence saved', type: 'absence_last_active' },
  { delaySeconds: 135, label: 'Paused re-entry', type: 'paused_reentry' },
];

interface StatCard {
  label: string;
  value: string | number;
  subtitle: string;
  context?: string;
  variant: 'forest' | 'sage';
}

function formatStartedDate(value: string | null | undefined) {
  if (!value) return null;

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function getProgressSummary(args: {
  currentDay: number | null;
  totalDays: number;
  completedDays: number[];
  completionState: string;
}) {
  if (args.completionState === 'completed') {
    return {
      dayNumber: args.totalDays,
      percentage: 100,
    };
  }

  const completedCount = args.completedDays.length;
  const dayNumber = Math.max(args.currentDay ?? completedCount + 1, 1);
  const percentage = Math.min(100, Math.max(1, Math.round((dayNumber / args.totalDays) * 100)));

  return {
    dayNumber,
    percentage,
  };
}

function getPhaseLabel(dayNumber: number, totalDays: number) {
  const ratio = totalDays > 0 ? dayNumber / totalDays : 0;

  if (ratio <= 0.25) return 'Phase 1 · Foundation';
  if (ratio <= 0.5) return 'Phase 2 · Regulation';
  if (ratio <= 0.75) return 'Phase 3 · Momentum';
  return 'Phase 4 · Integration';
}

function getStartReasonPrefix(programSlug: ProgramSlug | null | undefined) {
  switch (programSlug) {
    case 'six_day_reset':
    case 'ninety_day_transform':
      return 'smoking';
    case 'sleep_disorder_reset':
      return 'sleep';
    case 'energy_vitality':
      return 'energy';
    case 'age_reversal':
      return 'age';
    case 'male_sexual_health':
      return 'male';
    default:
      return null;
  }
}

function getStoredStartReason(args: {
  programSlug: ProgramSlug | null | undefined;
  questionnaireAnswers: Record<string, unknown> | null | undefined;
}) {
  const prefix = getStartReasonPrefix(args.programSlug);
  const answers = args.questionnaireAnswers?.answers;

  if (!prefix || !answers || typeof answers !== 'object') {
    return null;
  }

  const answerMap = answers as Record<string, unknown>;
  const selectedReason = answerMap[`${prefix}_start_reason`];
  const customReason = answerMap[`${prefix}_start_reason_custom`];

  const selectedCustomReason =
    selectedReason === 'I will write my own reason' || selectedReason === 'custom_reason';

  if (selectedCustomReason && typeof customReason === 'string' && customReason.trim()) {
    return customReason.trim();
  }

  if (
    typeof selectedReason === 'string' &&
    selectedReason.trim() &&
    selectedReason !== 'I will write my own reason'
  ) {
    return selectedReason.trim();
  }

  return null;
}

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { access, profile, progress, uploadAvatar } = useProfile();
  const onboardingQuery = useOnboardingResponse();
  const dailySteps = useDailySteps();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeStatIndex, setActiveStatIndex] = useState(0);
  const [devClockOverride, setDevClockOverrideState] = useState<Date | null>(null);
  const [isSchedulingDevNotification, setIsSchedulingDevNotification] = useState(false);
  const userId = user?.id ?? null;
  const currentTime = useMinuteClock();
  const activeProgramSlug = access.ownedProgram as ProgramSlug | null;
  const activeProgram = activeProgramSlug ? PROGRAM_METADATA[activeProgramSlug] : null;
  const finalizedDayStatesQuery = useFinalizedDayStates(userId, activeProgramSlug);
  const finalizedDayStates = finalizedDayStatesQuery.data ?? EMPTY_FINALIZED_DAY_STATES;
  const dayStateSummary = useMemo(
    () => buildDayStateProgressSummary(finalizedDayStates),
    [finalizedDayStates]
  );
  const rollingCompletionSummary = useMemo(
    () => buildRollingCompletionSummary(finalizedDayStates),
    [finalizedDayStates]
  );
  const hasFinalizedDayStateTruth = finalizedDayStates.length > 0;
  const completedDaysForStats = hasFinalizedDayStateTruth
    ? dayStateSummary.completedDays
    : progress?.completedDays ?? [];

  React.useEffect(() => {
    if (!__DEV__) {
      return;
    }

    let isCancelled = false;

    const loadOverride = async () => {
      try {
        const value = await readDevClockOverride();
        if (!isCancelled) {
          setDevClockOverrideState(value);
        }
      } catch (error) {
        console.error('Failed to load dev clock override', error);
      }
    };

    void loadOverride();

    return () => {
      isCancelled = true;
    };
  }, []);

  const journalCountQuery = useQuery({
    queryKey: ['journal-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: Boolean(userId),
  });

  const fallbackStreakSummary = useMemo(() => {
    const days = progress?.completedDays ?? [];
    if (days.length === 0) return { currentStreak: 0, bestStreak: 0 };

    const sorted = [...days].sort((a, b) => a - b);
    let best = 1;
    let runLength = 1;

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1]! + 1) {
        runLength++;
      } else {
        runLength = 1;
      }
      best = Math.max(best, runLength);
    }

    let current = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      if (sorted[i] === sorted[i - 1]! + 1) {
        current++;
      } else {
        break;
      }
    }

    return { currentStreak: current, bestStreak: best };
  }, [progress?.completedDays]);

  const currentStreak = hasFinalizedDayStateTruth
    ? dayStateSummary.currentStreak
    : fallbackStreakSummary.currentStreak;
  const bestStreak = hasFinalizedDayStateTruth
    ? dayStateSummary.bestStreak
    : fallbackStreakSummary.bestStreak;

  const startReason = useMemo(
    () =>
      getStoredStartReason({
        programSlug: activeProgramSlug,
        questionnaireAnswers: profile?.questionnaire_answers ?? null,
      }),
    [activeProgramSlug, profile?.questionnaire_answers]
  );

  const profileIdentity = resolveProfileIdentity({
    displayName: profile?.display_name,
    fullName: onboardingQuery.data?.full_name,
    email: user?.email,
    fallbackLabel: 'Your Account',
  });
  const avatarUrl = profile?.avatar_url ?? null;
  const emailDisplay = user?.email ?? 'Signed in';
  const displayName = profileIdentity.displayName;
  const displayInitial = profileIdentity.initial;
  const startedDate = formatStartedDate(profile?.created_at);
  const scheduleStartSource = getProgramScheduleStartSource(access);
  const scheduledStartPending = isProgramStartPending(access, currentTime);
  const scheduledProgramDayNumber = activeProgram
    ? access.completionState === 'completed'
      ? activeProgram.totalDays
      : scheduledStartPending
        ? 1
      : scheduleStartSource
        ? getProgramScheduledDay(scheduleStartSource, activeProgram.totalDays, currentTime)
        : access.currentDay ?? null
    : null;

  const progressSummary = activeProgram
    ? getProgressSummary({
        currentDay: scheduledProgramDayNumber,
        totalDays: activeProgram.totalDays,
        completedDays: completedDaysForStats,
        completionState: access.completionState,
      })
    : null;

  const activeProgramStatistics = useMemo(() => {
    return getProgramStatisticsSummary(
      activeProgramSlug,
      onboardingQuery.data ?? null,
      profile?.questionnaire_answers ?? null
    );
  }, [activeProgramSlug, onboardingQuery.data, profile?.questionnaire_answers]);

  const statCards: StatCard[] = useMemo(() => {
    const baseCards: Omit<StatCard, 'variant'>[] = [
      {
        label: 'Steps today',
        value:
          dailySteps.summary?.permissionState === 'ready'
            ? dailySteps.formattedSteps
            : 'Enable',
        subtitle: 'Daily movement',
        context:
          dailySteps.summary?.permissionState === 'ready'
            ? dailySteps.summary.providerLabel
            : 'Set up in statistics',
      },
      {
        label: 'Reflections',
        value: journalCountQuery.data ?? 0,
        subtitle: 'Written',
        context: 'Across journal entries',
      },
      {
        label: 'Current streak',
        value: currentStreak,
        subtitle: 'Days in a row',
        context: currentStreak >= bestStreak && currentStreak > 0 ? 'Your longest yet' : bestStreak > 0 ? `Best: ${bestStreak} days` : 'Start tomorrow',
      },
    ];

    if (hasFinalizedDayStateTruth && rollingCompletionSummary.cardsTotal > 0) {
      baseCards.push({
        label: '7-day score',
        value: `${rollingCompletionSummary.completionPercentage}%`,
        subtitle: 'Cards completed',
        context: `${rollingCompletionSummary.cardsCompleted}/${rollingCompletionSummary.cardsTotal} cards · ${rollingCompletionSummary.daysCount} day${rollingCompletionSummary.daysCount === 1 ? '' : 's'}`,
      });
    }

    if (activeProgram && progressSummary) {
      const phaseNum = Math.min(4, Math.ceil((progressSummary.dayNumber / activeProgram.totalDays) * 4));
      const completedCount = access.completionState === 'completed'
        ? activeProgram.totalDays
        : completedDaysForStats.length;

      baseCards.unshift({
        label: 'Days',
        value: `${completedCount}/${activeProgram.totalDays}`,
        subtitle: 'Completed',
        context: `Day ${progressSummary.dayNumber} · ${activeProgram.name}`,
      });

      baseCards.splice(2, 0, {
        label: 'Progress',
        value: `${progressSummary.percentage}%`,
        subtitle: 'Journey',
        context: access.completionState === 'completed' ? `All 4 phases` : `Phase ${phaseNum} of 4`,
      });
    }

    if (activeProgramStatistics?.cards.length) {
      const programMetricCards = activeProgramStatistics.cards
        .filter((card) => card.value && card.value !== 'Not set')
        .slice(0, 2)
        .map((card) => ({
          label: card.label,
          value: card.value,
          subtitle: 'Baseline',
          context: activeProgram?.name ?? 'Current journey',
        }));

      baseCards.splice(activeProgram && progressSummary ? 3 : 1, 0, ...programMetricCards);
    }

    return baseCards.map((card, index) => ({
      ...card,
      variant: index % 2 === 0 ? 'forest' : 'sage',
    }));
  }, [access.completionState, activeProgram, activeProgramStatistics?.cards, bestStreak, completedDaysForStats.length, currentStreak, dailySteps.formattedSteps, dailySteps.summary?.permissionState, dailySteps.summary?.providerLabel, hasFinalizedDayStateTruth, journalCountQuery.data, progressSummary, rollingCompletionSummary.cardsCompleted, rollingCompletionSummary.cardsTotal, rollingCompletionSummary.completionPercentage, rollingCompletionSummary.daysCount]);

  const handleStatScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / STAT_CARD_SNAP);
    setActiveStatIndex(Math.max(0, Math.min(nextIndex, statCards.length - 1)));
  };

  const handleAvatarTap = async () => {
    try {
      const { requireOptionalNativeModule } = await import('expo-modules-core');
      const hasImagePickerNativeModule = Boolean(requireOptionalNativeModule('ExponentImagePicker'));
      if (!hasImagePickerNativeModule) {
        Alert.alert('Profile photo unavailable', 'Photo upload needs a fresh native iOS build.');
        return;
      }
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Profile photo unavailable', 'We could not open your photo library right now.');
    }
  };

  const syncWidgetForDevClock = async (now: Date) => {
    const widgetPayload = buildWidgetPayload({
      access,
      progress,
      steps: dailySteps.summary?.steps ?? 0,
      now,
    });

    if (widgetPayload) {
      await syncWidgetData(widgetPayload);
    }
  };

  const getDevClockPresetDate = (hours: number, minutes: number) => {
    const startSource = getProgramScheduleStartSource(access);
    const startedAt = startSource ? new Date(startSource) : null;
    const hasValidStartedAt = startedAt && !Number.isNaN(startedAt.getTime());

    if (hasValidStartedAt && access.completionState !== 'completed') {
      const currentJourneyDay = Math.max(1, access.currentDay ?? progress?.currentDay ?? 1);
      const boundaryDate = new Date(
        startedAt.getFullYear(),
        startedAt.getMonth(),
        startedAt.getDate() + currentJourneyDay - 1
      );
      boundaryDate.setHours(hours, minutes, 0, 0);
      return boundaryDate;
    }

    const fallbackDate = new Date(devClockOverride ?? new Date());
    fallbackDate.setHours(hours, minutes, 0, 0);
    return fallbackDate;
  };

  const applyDevClockPreset = async (hours: number, minutes: number) => {
    const nextValue = getDevClockPresetDate(hours, minutes);
    await setDevClockOverride(nextValue);
    setDevClockOverrideState(nextValue);
    await syncWidgetForDevClock(nextValue);
  };

  const handleClearDevClockOverride = async () => {
    await clearDevClockOverride();
    setDevClockOverrideState(null);
    await syncWidgetForDevClock(new Date());
  };

  const handleScheduleDevNotification = async () => {
    if (!activeProgram || !access.ownedProgram) {
      Alert.alert('No active program', 'Open an active program before scheduling a notification test.');
      return;
    }

    setIsSchedulingDevNotification(true);

    try {
      const now = new Date();
      const dayNumber = Math.max(access.currentDay ?? progress?.currentDay ?? 1, 1);
      const programSlug = access.ownedProgram as ProgramSlug;
      const plan: NotificationPlan = {
        id: `program:${programSlug}:day:${dayNumber}:morning_session_ready`,
        tier: 'card_reminder',
        type: 'morning_session_ready',
        title: 'Recovery Compass test',
        body: `${activeProgram.name} notification test. Tap to open Day ${dayNumber}.`,
        triggerAt: new Date(now.getTime() + 15_000),
        data: {
          notificationTier: 'card_reminder',
          notificationType: 'morning_session_ready',
          programSlug,
          dayNumber,
          timeSlot: 'morning',
        },
      };

      await NotificationService.scheduleProgramNotificationPlans([plan], { now });
      Alert.alert('Test scheduled', 'Lock or background the app. A test notification should arrive in about 15 seconds.');
    } catch (error: any) {
      Alert.alert('Notification test failed', error?.message ?? 'Could not schedule the test notification.');
    } finally {
      setIsSchedulingDevNotification(false);
    }
  };

  const handleScheduleDevNotificationLab = async () => {
    if (!activeProgram || !access.ownedProgram) {
      Alert.alert('No active program', 'Open an active program before scheduling notification lab tests.');
      return;
    }

    setIsSchedulingDevNotification(true);

    try {
      const now = new Date();
      const dayNumber = Math.max(access.currentDay ?? progress?.currentDay ?? 1, 1);
      const programSlug = access.ownedProgram as ProgramSlug;
      const plans: NotificationPlan[] = DEV_NOTIFICATION_TYPES.map((item) => ({
        id: `program:${programSlug}:day:${dayNumber}:dev_lab:${item.type}`,
        tier:
          item.type === 'missed_morning_catch_up'
            ? 'missed_card_nudge'
            : item.type === 'day_completed' || item.type === 'partial_day'
              ? 'completion_motivation'
              : item.type.startsWith('absence_') || item.type === 'paused_reentry'
                ? 'absence_reengagement'
                : 'card_reminder',
        type: item.type,
        title: `Lab: ${item.label}`,
        body: `${activeProgram.name} notification lab. Tap to open Day ${dayNumber}.`,
        triggerAt: new Date(now.getTime() + item.delaySeconds * 1000),
        data: {
          notificationTier:
            item.type === 'missed_morning_catch_up'
              ? 'missed_card_nudge'
              : item.type === 'day_completed' || item.type === 'partial_day'
                ? 'completion_motivation'
                : item.type.startsWith('absence_') || item.type === 'paused_reentry'
                  ? 'absence_reengagement'
                  : 'card_reminder',
          notificationType: item.type,
          programSlug,
          dayNumber,
          ...(item.timeSlot ? { timeSlot: item.timeSlot } : {}),
        },
      }));

      await NotificationService.scheduleProgramNotificationPlans(plans, { now });
      Alert.alert(
        'Notification Lab scheduled',
        'Lock or background the app. All notification types will arrive every 15 seconds for the next 2 minutes.'
      );
    } catch (error: any) {
      Alert.alert('Notification Lab failed', error?.message ?? 'Could not schedule notification lab tests.');
    } finally {
      setIsSchedulingDevNotification(false);
    }
  };

  const devClockLabel = devClockOverride
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }).format(devClockOverride)
    : 'Using device time';

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerContainer}>
            <AccountWatermark 
              width={280} 
              height={170} 
              opacity={0.06} 
              style={{ position: 'absolute', right: -20, top: -10 }} 
            />

            <View style={styles.headerTopRow}>
              <Text style={styles.headerEyebrow}>Your account</Text>

              <TouchableOpacity
                onPress={() => router.push(ACCOUNT_SETTINGS_ROUTE)}
                activeOpacity={0.8}
                style={styles.settingsButton}
              >
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(227,243,229,0.7)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <View style={styles.contentWrap}>
          <View style={styles.identityCard}>
            <TouchableOpacity onPress={() => void handleAvatarTap()} activeOpacity={0.82} style={styles.avatarTouchable}>
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarPlaceholder}>{displayInitial}</Text>
                )}
              </View>
            </TouchableOpacity>

            <Text style={styles.identityName}>{displayName}</Text>
            <Text style={styles.identityEmail}>{emailDisplay}</Text>

            <TouchableOpacity
              onPress={() => setIsEditOpen(true)}
              activeOpacity={0.78}
              style={styles.editProfilePill}
            >
              <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.5)" strokeWidth={2} strokeLinecap="round">
                <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </Svg>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* ACTIVE PROGRAM */}
          {activeProgram && progressSummary ? (
            <>
              <Text style={styles.sectionEyebrow}>{access.completionState === 'completed' ? 'Program' : 'Active Program'}</Text>
              <TouchableOpacity
                onPress={() => router.push(PROGRAM_TAB_ROUTE)}
                activeOpacity={0.9}
                style={styles.programCard}
              >
                <View style={styles.programInner}>
                  <View style={styles.programWatermark}>
                    <Svg width={110} height={110} viewBox="0 0 200 200" fill="none" style={{ opacity: 0.08 }}>
                      <Path d="M100 10C100 10 165 55 165 105C165 148 135 182 100 192C65 182 35 148 35 105C35 55 100 10 100 10Z" fill="#E3F3E5" />
                    </Svg>
                  </View>

                  <View style={styles.programTopRow}>
                    {access.completionState === 'completed' ? (
                      <View style={styles.completedBadge}>
                        <View style={styles.completedBadgeDot} />
                        <Text style={styles.completedBadgeText}>Completed · {activeProgram.totalDays} days</Text>
                      </View>
                    ) : (
                      <View style={styles.phasePill}>
                        <Text style={styles.phasePillText}>
                          {getPhaseLabel(progressSummary.dayNumber, activeProgram.totalDays)}
                        </Text>
                      </View>
                    )}
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(227,243,229,0.45)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M9 18l6-6-6-6" />
                    </Svg>
                  </View>

                  <Text style={styles.programName}>{activeProgram.name}</Text>

                  {access.completionState === 'completed' ? (
                    <Text style={styles.programMeta}>
                      {startedDate ? `Completed journey · Began ${startedDate}` : 'Completed journey'}
                    </Text>
                  ) : (
                    <View style={styles.programDayRow}>
                      <Text style={styles.programDayCount}>
                        {progressSummary.dayNumber} <Text style={styles.programDayTotal}>/ {activeProgram.totalDays} days</Text>
                      </Text>
                      <Text style={styles.programPct}>{progressSummary.percentage}%</Text>
                    </View>
                  )}

                  <View style={styles.programProgressTrack}>
                    <View style={[styles.programProgressFill, { width: `${progressSummary.percentage}%` }]} />
                  </View>
                </View>
              </TouchableOpacity>
            </>
          ) : null}

          <Text style={styles.sectionEyebrow}>Programs</Text>
          <TouchableOpacity
            onPress={() => router.push(MY_PROGRAMS_ROUTE)}
            activeOpacity={0.78}
            style={styles.programLibraryRow}
          >
            <View style={styles.programLibraryIcon}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </Svg>
            </View>
            <View style={styles.programLibraryCopy}>
              <Text style={styles.programLibraryTitle}>My programs</Text>
              <Text style={styles.programLibrarySubtitle}>Switch your current journey or open unlocked programs.</Text>
            </View>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.35)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 18l6-6-6-6" />
            </Svg>
          </TouchableOpacity>

          {/* PROGRESS / STATS */}
          <Text style={styles.sectionEyebrow}>Progress</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statsScrollWrap}
            contentContainerStyle={styles.statsScrollContent}
            snapToInterval={STAT_CARD_SNAP}
            decelerationRate="fast"
            onMomentumScrollEnd={handleStatScroll}
            scrollEventThrottle={16}
          >
            {statCards.map((card, index) => {
              const isSage = card.variant === 'sage';
              return (
                <View
                  key={card.label}
                  style={[
                    styles.statCard,
                    isSage ? styles.statCardSage : styles.statCardForest,
                    index < statCards.length - 1 && { marginRight: STAT_CARD_GAP },
                  ]}
                >
                  <View style={styles.statAccentStripe} />
                  <View style={styles.statWatermark}>
                    <Svg width={80} height={80} viewBox="0 0 200 200" fill="none" style={{ opacity: 0.06 }}>
                      <Path d="M100 10C100 10 165 55 165 105C165 148 135 182 100 192C65 182 35 148 35 105C35 55 100 10 100 10Z" fill="#E3F3E5" />
                    </Svg>
                  </View>

                  <Text style={styles.statEyebrow}>{card.label}</Text>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statLabel}>{card.subtitle}</Text>
                  {card.context ? <Text style={styles.statContext}>{card.context}</Text> : null}
                </View>
              );
            })}
          </ScrollView>

          {statCards.length > 1 ? (
            <View style={styles.paginationDots}>
              {statCards.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={index === activeStatIndex ? styles.paginationDotActive : styles.paginationDot}
                />
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => router.push(ACCOUNT_STATISTICS_ROUTE)}
            activeOpacity={0.78}
            style={styles.viewAllRow}
          >
            <Text style={styles.viewAllLabel}>View all statistics</Text>
            <View style={styles.viewAllRight}>
              <Text style={styles.viewAllCount}>{statCards.length} metrics</Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.35)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </View>
          </TouchableOpacity>

          {/* YOUR INTENTION */}
          <Text style={[styles.sectionEyebrow, { marginTop: 6 }]}>Your Intention</Text>
          <View style={styles.intentionCard}>
            <View style={styles.intentionEyebrowRow}>
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.4)" strokeWidth={2} strokeLinecap="round">
                <Path d="M20 4C10 4 4 10 4 20c8 0 16-6 16-16zM4 20C8 16 12 12 20 4" />
              </Svg>
              <Text style={styles.intentionEyebrowText}>Why you started</Text>
            </View>

            <Text style={styles.intentionQuote}>
              {startReason
                ? `\u201C${startReason}\u201D`
                : '\u201CPersonalize this program to add your reason.\u201D'}
            </Text>

            <Text style={styles.intentionMeta}>
              {startedDate ? `Started ${startedDate}` : ''}
            </Text>
          </View>

          {__DEV__ ? (
            <>
              <Text style={[styles.sectionEyebrow, { marginTop: 6 }]}>Dev Clock</Text>
              <View style={styles.devCard}>
                <Text style={styles.devCardTitle}>Boundary QA</Text>
                <Text style={styles.devCardText}>
                  Override app-only time checks. Native notification QA uses the real Android scheduler.
                </Text>
                <Text style={styles.devClockState}>{devClockLabel}</Text>

                <View style={styles.devButtonGrid}>
                  <TouchableOpacity
                    onPress={() => void applyDevClockPreset(0, 59)}
                    activeOpacity={0.8}
                    style={styles.devButton}
                  >
                    <Text style={styles.devButtonText}>12:59 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void applyDevClockPreset(1, 1)}
                    activeOpacity={0.8}
                    style={styles.devButton}
                  >
                    <Text style={styles.devButtonText}>1:01 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void applyDevClockPreset(4, 59)}
                    activeOpacity={0.8}
                    style={styles.devButton}
                  >
                    <Text style={styles.devButtonText}>4:59 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void applyDevClockPreset(5, 0)}
                    activeOpacity={0.8}
                    style={styles.devButton}
                  >
                    <Text style={styles.devButtonText}>5:00 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void applyDevClockPreset(19, 0)}
                    activeOpacity={0.8}
                    style={styles.devButton}
                  >
                    <Text style={styles.devButtonText}>7:00 PM</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => void handleClearDevClockOverride()}
                  activeOpacity={0.8}
                  style={styles.devClearButton}
                >
                  <Text style={styles.devClearButtonText}>Clear override</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => void handleScheduleDevNotification()}
                  activeOpacity={0.8}
                  disabled={isSchedulingDevNotification}
                  style={[styles.devClearButton, { marginTop: 10, backgroundColor: AppColors.forest }]}
                >
                  <Text style={[styles.devClearButtonText, { color: AppColors.white }]}>
                    {isSchedulingDevNotification ? 'Scheduling...' : 'Test notification in 15s'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => void handleScheduleDevNotificationLab()}
                  activeOpacity={0.8}
                  disabled={isSchedulingDevNotification}
                  style={[styles.devClearButton, { marginTop: 10, backgroundColor: 'rgba(6,41,12,0.1)' }]}
                >
                  <Text style={[styles.devClearButtonText, { color: AppColors.forest }]}>
                    Test all notification types
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <EditProfileSheet isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.forest,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ─── Header ───
  headerSafeArea: {
    backgroundColor: AppColors.forest,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 68,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(227,243,229,0.55)',
  },
  settingsButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(227,243,229,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(227,243,229,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Content ───
  contentWrap: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 146,
  },

  // ─── Identity ───
  identityCard: {
    alignItems: 'center',
    paddingBottom: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(6,41,12,0.08)',
  },
  avatarTouchable: {
    marginTop: -48,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: AppColors.surface,
    // Spec: box-shadow: 0 4px 20px rgba(6,41,12,0.13)
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    fontFamily: 'Erode-Medium',
    fontSize: 30,
    color: AppColors.forest,
  },
  identityName: {
    fontFamily: 'Erode-Medium',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.35,
    color: AppColors.forest,
    marginTop: 12,
    textAlign: 'center',
  },
  identityEmail: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(6,41,12,0.42)',
    marginTop: 4,
    textAlign: 'center',
  },
  editProfilePill: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(6,41,12,0.10)',
    backgroundColor: 'transparent',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  editProfileText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: 'rgba(6,41,12,0.62)',
  },

  // ─── Section Eyebrow ───
  sectionEyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(6,41,12,0.38)',
    marginTop: 20,
    marginBottom: 12,
  },

  // ─── Program Card ───
  programCard: {
    backgroundColor: AppColors.forest,
    borderRadius: 20,
    overflow: 'hidden',
    // Spec: box-shadow: 0 4px 20px rgba(6,41,12,0.18)
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(227,243,229,0.08)',
  },
  pressedCard: {
    opacity: 0.92,
  },
  programInner: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    position: 'relative',
    zIndex: 2,
  },
  programWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -14,
  },
  programTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  phasePill: {
    backgroundColor: 'rgba(227,243,229,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(227,243,229,0.22)',
  },
  phasePillText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: '#E3F3E5', // High contrast sage
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(227,243,229,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(227,243,229,0.28)',
    gap: 5,
    marginBottom: 8,
  },
  completedBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AppColors.sage,
  },
  completedBadgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: AppColors.sage,
  },
  programName: {
    fontFamily: 'Erode-Medium',
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: '#FFFFFF',
    maxWidth: '88%',
  },
  programMeta: {
    ...AppTypography.bodyCompact,
    color: 'rgba(227,243,229,0.5)',
    marginTop: 6,
  },
  programDayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  programDayCount: {
    fontFamily: 'Erode-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  programDayTotal: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: 'rgba(227,243,229,0.5)',
  },
  programPct: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    color: 'rgba(227,243,229,0.55)',
  },
  programProgressTrack: {
    marginTop: 16,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(227,243,229,0.15)',
    overflow: 'hidden',
  },
  programProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#E3F3E5', // Pure sage for maximum visibility
  },

  // ─── Program Library Row ───
  programLibraryRow: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,41,12,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  programLibraryIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: AppColors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programLibraryCopy: {
    flex: 1,
  },
  programLibraryTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: AppColors.forest,
  },
  programLibrarySubtitle: {
    ...AppTypography.bodyCompact,
    color: 'rgba(6,41,12,0.48)',
    marginTop: 2,
  },

  // ─── Stat Cards ───
  statsScrollWrap: {
    marginHorizontal: -20, // Break out of contentWrap padding
  },
  statsScrollContent: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    minHeight: 158,
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    position: 'relative',
  },
  statCardForest: {
    backgroundColor: AppColors.forest,
  },
  statCardSage: {
    backgroundColor: 'rgba(6,41,12,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(227,243,229,0.08)',
  },
  statAccentStripe: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: 'rgba(227,243,229,0.18)',
  },
  statWatermark: {
    position: 'absolute',
    right: -18,
    bottom: -14,
  },
  statEyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(227,243,229,0.45)',
    marginBottom: 10,
  },
  statValue: {
    fontFamily: 'Erode-Medium',
    fontSize: 38,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(227,243,229,0.65)',
    marginTop: 8,
  },
  statContext: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(227,243,229,0.38)',
    marginTop: 3,
  },

  // ─── Pagination ───
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 12,
  },
  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(6,41,12,0.14)',
  },
  paginationDotActive: {
    width: 16,
    height: 5,
    borderRadius: 999,
    backgroundColor: AppColors.forest,
  },

  // ─── View All Row ───
  viewAllRow: {
    marginTop: 6,
    paddingHorizontal: 4,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: AppColors.forest,
  },
  viewAllRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllCount: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: 'rgba(6,41,12,0.45)',
  },

  // ─── Intention Card ───
  intentionCard: {
    borderRadius: 20,
    backgroundColor: AppColors.sageSoft,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.forest,
    paddingTop: 18,
    paddingBottom: 18,
    paddingRight: 18,
    paddingLeft: 16,
    overflow: 'hidden',
    // Spec: --soft-shadow = 0 1px 2px rgba(6,41,12,0.03), 0 8px 24px rgba(6,41,12,0.06)
    // RN supports single shadow — using dominant layer
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
  },
  intentionEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  intentionEyebrowText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(6,41,12,0.45)',
  },
  intentionQuote: {
    fontFamily: 'Erode-Medium-Italic',
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: -0.2,
    color: AppColors.forest,
  },
  intentionMeta: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: 'rgba(6,41,12,0.28)',
    marginTop: 12,
  },
  devCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,41,12,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  devCardTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: AppColors.forest,
  },
  devCardText: {
    ...AppTypography.bodyCompact,
    color: 'rgba(6,41,12,0.56)',
  },
  devClockState: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(6,41,12,0.44)',
  },
  devButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  devButton: {
    borderRadius: 999,
    backgroundColor: 'rgba(6,41,12,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  devButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: AppColors.forest,
  },
  devClearButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: AppColors.forest,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  devClearButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
});
