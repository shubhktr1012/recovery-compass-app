import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/theme';
import { useProfile } from '@/providers/profile';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { formatInr, getOnboardingProjection } from '@/lib/onboarding-metrics';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import type { ProgramSlug } from '@/types/content';

export default function StatisticsScreen() {
  const router = useRouter();
  const { access, profile, progress } = useProfile();
  const onboardingQuery = useOnboardingResponse();

  const stats = useMemo(() => {
    const projection = getOnboardingProjection(onboardingQuery.data ?? null);
    const joinedDays = profile?.created_at
      ? Math.floor(Math.max(0, Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      avoidedUnits90Days: projection.avoidedUnits90Days,
      dailyAmount: projection.dailyAmount,
      dailyCost: projection.dailyCost,
      joinedDays,
      monthlySpend: projection.monthlySpend,
      projectedSavings90Days: projection.projectedSavings90Days,
      targetSelection: projection.targetSelection,
      yearlySpend: projection.yearlySpend,
    };
  }, [onboardingQuery.data, profile?.created_at]);

  const unitsLabel = stats.targetSelection === 'Quit Alcohol'
    ? 'Daily drinks'
    : stats.targetSelection === 'Quit Smoking'
      ? 'Daily cigarettes'
      : 'Daily vices';

  const activeProgram = access.ownedProgram ? PROGRAM_METADATA[access.ownedProgram as ProgramSlug] : null;

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
          <Text style={styles.heroValue}>{stats.joinedDays}</Text>
          <Text style={styles.heroSubtitle}>
            since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'joining'}
          </Text>
        </View>

        {/* Projection Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Projection Overview</Text>
          <View style={styles.splitRow}>
            <View style={styles.splitLeft}>
              <Text style={styles.splitLabel}>90-day savings</Text>
              <Text style={styles.splitValue}>{formatInr(stats.projectedSavings90Days)}</Text>
            </View>
            <View style={styles.splitRight}>
              <Text style={styles.splitLabel}>90-day units avoided</Text>
              <Text style={styles.splitValue}>{stats.avoidedUnits90Days}</Text>
            </View>
          </View>
        </View>

        {/* Spending Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending Breakdown</Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{unitsLabel}</Text>
            <Text style={styles.breakdownValue}>{stats.dailyAmount || 'Not set'}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Daily spend</Text>
            <Text style={styles.breakdownValue}>{stats.dailyCost ? formatInr(stats.dailyCost) : 'Not set'}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Monthly spend</Text>
            <Text style={styles.breakdownValue}>{stats.monthlySpend ? formatInr(stats.monthlySpend) : 'Not set'}</Text>
          </View>
          <View style={styles.breakdownRowLast}>
            <Text style={styles.breakdownLabel}>Yearly spend</Text>
            <Text style={styles.breakdownValue}>{stats.yearlySpend ? formatInr(stats.yearlySpend) : 'Not set'}</Text>
          </View>
        </View>

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
