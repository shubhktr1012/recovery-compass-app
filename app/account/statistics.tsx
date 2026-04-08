import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="p-6 pb-32">
        {/* Header */}
        <View className="flex-row items-center mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={AppColors.forest} />
          </TouchableOpacity>
          <Text className="font-erode-bold text-3xl text-forest">Statistics</Text>
        </View>

        {/* Days in Motion Card */}
        <View className="rounded-3xl bg-forest p-6 mb-4">
          <Text className="font-satoshi-bold text-white/70 text-xs uppercase tracking-wider mb-2">Days in Motion</Text>
          <Text className="font-erode-bold text-white text-5xl">{stats.joinedDays}</Text>
          <Text className="font-satoshi text-white/70 text-sm mt-1">
            since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'joining'}
          </Text>
        </View>

        {/* Projection Overview */}
        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
          <Text className="font-erode-semibold text-xl text-forest mb-4">Projection Overview</Text>
          <View className="flex-row justify-between mb-3">
            <View className="flex-1">
              <Text className="font-satoshi text-gray-500 text-sm">90-day savings</Text>
              <Text className="font-erode-bold text-forest text-2xl">{formatInr(stats.projectedSavings90Days)}</Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="font-satoshi text-gray-500 text-sm">90-day units avoided</Text>
              <Text className="font-erode-bold text-forest text-2xl">{stats.avoidedUnits90Days}</Text>
            </View>
          </View>
        </View>

        {/* Spending Breakdown */}
        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
          <Text className="font-erode-semibold text-xl text-forest mb-4">Spending Breakdown</Text>

          <View className="flex-row justify-between py-3 border-b border-gray-100">
            <Text className="font-satoshi text-gray-600">{unitsLabel}</Text>
            <Text className="font-satoshi-bold text-forest">{stats.dailyAmount || 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between py-3 border-b border-gray-100">
            <Text className="font-satoshi text-gray-600">Daily spend</Text>
            <Text className="font-satoshi-bold text-forest">{stats.dailyCost ? formatInr(stats.dailyCost) : 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between py-3 border-b border-gray-100">
            <Text className="font-satoshi text-gray-600">Monthly spend</Text>
            <Text className="font-satoshi-bold text-forest">{stats.monthlySpend ? formatInr(stats.monthlySpend) : 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between py-3">
            <Text className="font-satoshi text-gray-600">Yearly spend</Text>
            <Text className="font-satoshi-bold text-forest">{stats.yearlySpend ? formatInr(stats.yearlySpend) : 'Not set'}</Text>
          </View>
        </View>

        {/* Program Progress */}
        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
          <Text className="font-erode-semibold text-xl text-forest mb-4">Program Progress</Text>
          {activeProgram ? (
            <>
              <Text className="font-satoshi-bold text-forest text-base mb-1">{activeProgram.name}</Text>
              <Text className="font-satoshi text-gray-600 mb-3">
                {progress?.completedDays.length ?? 0} of {activeProgram.totalDays} days completed
              </Text>
              <View className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <View
                  className="h-full rounded-full bg-forest"
                  style={{ width: `${Math.round(((progress?.completedDays.length ?? 0) / activeProgram.totalDays) * 100)}%` }}
                />
              </View>
            </>
          ) : (
            <Text className="font-satoshi text-gray-500">No active program</Text>
          )}
        </View>

        {/* Questionnaire Snapshot */}
        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
          <Text className="font-erode-semibold text-xl text-forest mb-4">Questionnaire Snapshot</Text>

          <View className="flex-row justify-between py-3 border-b border-gray-100">
            <Text className="font-satoshi text-gray-600">Target</Text>
            <Text className="font-satoshi-bold text-forest">{onboardingQuery.data?.target_selection ?? 'Not set'}</Text>
          </View>
          <View className="flex-row justify-between py-3 border-b border-gray-100">
            <Text className="font-satoshi text-gray-600">Joined</Text>
            <Text className="font-satoshi-bold text-forest">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
          <View className="py-3">
            <Text className="font-satoshi text-gray-600 mb-1">Triggers</Text>
            <Text className="font-satoshi-bold text-forest">
              {onboardingQuery.data?.triggers?.length ? onboardingQuery.data.triggers.join(', ') : 'Not set'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
