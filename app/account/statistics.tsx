import React, { useMemo } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/theme';
import { useProfile } from '@/providers/profile';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { useDailySteps } from '@/hooks/useDailySteps';
import { getProgramStatisticsSummary } from '@/lib/program-statistics';
import { formatStepCount } from '@/lib/steps';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import type { ProgramSlug } from '@/types/content';

export default function StatisticsScreen() {
  const router = useRouter();
  const { access, profile, progress } = useProfile();
  const onboardingQuery = useOnboardingResponse();
  const dailySteps = useDailySteps();

  const joinedDays = profile?.created_at
    ? Math.floor(Math.max(0, Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const activeProgram = access.ownedProgram ? PROGRAM_METADATA[access.ownedProgram as ProgramSlug] : null;
  const stepSummary = dailySteps.summary;

  const handleEnableStepTracking = async () => {
    try {
      const summary = await dailySteps.enableStepTracking();
      if (summary.permissionState !== 'ready') {
        Alert.alert(
          'Step tracking unavailable',
          summary.canAskAgain
            ? 'Permission was not granted. You can try again when you are ready.'
            : 'Permission is disabled for Recovery Compass. Enable step access for Recovery Compass in device settings.'
        );
      }
    } catch (error: any) {
      Alert.alert('Step tracking failed', error?.message ?? 'Please try again.');
    }
  };

  const summary = useMemo(() => {
    return getProgramStatisticsSummary(
      access.ownedProgram as ProgramSlug | null,
      onboardingQuery.data ?? null,
      profile?.questionnaire_answers ?? null
    );
  }, [access.ownedProgram, onboardingQuery.data, profile?.questionnaire_answers]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={AppColors.forest} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statistics</Text>
        </View>

        {/* Days in Motion Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Days in Motion</Text>
          <Text style={styles.heroValue}>{joinedDays}</Text>
          <Text style={styles.heroSubtitle}>
            since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'joining'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Daily Movement</Text>
              <Text style={styles.cardSubtitle}>
                {stepSummary?.permissionState === 'ready'
                  ? stepSummary.providerLabel
                  : 'Connect your device step source'}
              </Text>
            </View>
            <View style={styles.stepBadge}>
              <Ionicons name="walk-outline" size={16} color={AppColors.forest} />
            </View>
          </View>

          <Text style={styles.stepValue}>
            {stepSummary?.permissionState === 'ready'
              ? formatStepCount(stepSummary.steps)
              : 'Not enabled'}
          </Text>
          <Text style={styles.stepContext}>
            {stepSummary?.permissionState === 'ready'
              ? `Current program day · Resets at 5:00 AM local time`
              : 'Resets at 5:00 AM local time. iPhone uses Motion & Fitness. Android uses the best available device source.'}
          </Text>

          {stepSummary?.permissionState !== 'ready' ? (
            <TouchableOpacity
              onPress={() => void handleEnableStepTracking()}
              activeOpacity={0.82}
              style={styles.enableStepsButton}
              disabled={dailySteps.isEnabling}
            >
              <Text style={styles.enableStepsText}>
                {dailySteps.isEnabling ? 'Enabling...' : 'Enable step tracking'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => void dailySteps.refresh()}
              activeOpacity={0.82}
              style={styles.refreshStepsButton}
              disabled={dailySteps.isRefreshing}
            >
              <Text style={styles.refreshStepsText}>
                {dailySteps.isRefreshing ? 'Refreshing...' : 'Refresh steps'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Program Statistics */}
        {summary && summary.cards.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Program Statistics</Text>
            {summary.cards.map((card, idx) => {
              const isLast = idx === summary.cards.length - 1;
              return (
                <View key={card.id} style={isLast ? styles.breakdownRowLast : styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{card.label}</Text>
                  <Text style={styles.breakdownValue}>{card.value}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Program Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Program Progress</Text>
          {activeProgram ? (
            <>
              <Text style={styles.progressProgramName}>{activeProgram.name}</Text>
              <Text style={styles.progressText}>
                {progress?.completedDays.length ?? 0} of {activeProgram.totalDays} days completed
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round(((progress?.completedDays.length ?? 0) / activeProgram.totalDays) * 100)}%` }
                  ]}
                />
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>No active program</Text>
          )}
        </View>

        {/* Questionnaire Snapshot */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Questionnaire Snapshot</Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Target</Text>
            <Text style={styles.breakdownValue}>{onboardingQuery.data?.target_selection ?? 'Not set'}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Joined</Text>
            <Text style={styles.breakdownValue}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
          <View style={styles.breakdownRowLastVertical}>
            <Text style={styles.breakdownLabelVertical}>Triggers</Text>
            <Text style={styles.breakdownValueVertical}>
              {onboardingQuery.data?.triggers?.length ? onboardingQuery.data.triggers.join(', ') : 'Not set'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: 'Erode-Bold',
    fontSize: 28,
    color: AppColors.forest,
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: AppColors.forest,
    padding: 24,
    marginBottom: 16,
  },
  heroEyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroValue: {
    fontFamily: 'Erode-Bold',
    fontSize: 48,
    color: AppColors.white,
  },
  heroSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  card: {
    borderRadius: 24,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'Erode-SemiBold',
    fontSize: 20,
    color: AppColors.forest,
    marginBottom: 16,
  },
  cardHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardSubtitle: {
    color: AppColors.subtleInk,
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    marginTop: -8,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: AppColors.sageSoft,
    borderColor: AppColors.hairline,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepValue: {
    color: AppColors.forest,
    fontFamily: 'Erode-Bold',
    fontSize: 40,
    lineHeight: 44,
  },
  stepContext: {
    color: AppColors.subtleInk,
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  enableStepsButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: AppColors.forest,
    borderRadius: 999,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  enableStepsText: {
    color: AppColors.white,
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
  },
  refreshStepsButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: AppColors.sageSoft,
    borderColor: AppColors.hairline,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  refreshStepsText: {
    color: AppColors.forest,
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  splitLeft: {
    flex: 1,
  },
  splitRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  splitLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: AppColors.iconMuted,
  },
  splitValue: {
    fontFamily: 'Erode-Bold',
    fontSize: 24,
    color: AppColors.forest,
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  breakdownRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 4,
  },
  breakdownLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  breakdownValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: AppColors.forest,
  },
  progressProgramName: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: AppColors.forest,
    marginBottom: 4,
  },
  progressText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3F4F6', // gray-100
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: AppColors.forest,
  },
  emptyText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: AppColors.iconMuted,
  },
  breakdownRowLastVertical: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  breakdownLabelVertical: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  breakdownValueVertical: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: AppColors.forest,
  },
});
