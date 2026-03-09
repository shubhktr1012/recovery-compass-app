import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/auth';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { formatInr, getOnboardingProjection } from '@/lib/onboarding-metrics';
import { useProfile } from '@/providers/profile';
import { Button } from '@/components/ui/Button';
import Purchases from 'react-native-purchases';
import { ProgramRepository } from '@/lib/programs/repository';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { access, profile, progress, refreshAccess } = useProfile();
  const onboardingQuery = useOnboardingResponse();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

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

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error: any) {
      Alert.alert('Sign out failed', error?.message ?? 'Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsRestoring(true);
      await Purchases.restorePurchases();
      await refreshAccess();
      Alert.alert('Restore complete', 'Your purchases have been refreshed.');
    } catch (error: any) {
      Alert.alert('Restore failed', error?.message ?? 'Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const activeProgram = access.ownedProgram ? ProgramRepository.getProgram(access.ownedProgram) : null;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="p-6 pb-32">
        <View className="mb-8">
          <Text className="font-erode-bold text-4xl text-forest mb-2">Profile</Text>
          <Text className="font-satoshi text-base text-gray-500">
            {user?.email ?? 'Signed in'}
          </Text>
        </View>

        <View className="rounded-3xl bg-forest p-5 mb-6">
          <Text className="font-satoshi-bold text-white/80 text-xs uppercase mb-3">Projection Overview</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="font-erode-bold text-white text-3xl">{stats.joinedDays}</Text>
              <Text className="font-satoshi text-white/80 text-sm">Days in motion</Text>
            </View>
            <View>
              <Text className="font-erode-bold text-white text-3xl">{stats.avoidedUnits90Days}</Text>
              <Text className="font-satoshi text-white/80 text-sm">90-day units avoided</Text>
            </View>
          </View>
          <View className="mt-4 border-t border-white/20 pt-3">
            <Text className="font-satoshi text-white/80 text-sm">Projected 90-day savings</Text>
            <Text className="font-erode-semibold text-white text-2xl">{formatInr(stats.projectedSavings90Days)}</Text>
          </View>
        </View>

        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-6">
          <Text className="font-erode-semibold text-2xl text-forest mb-2">Questionnaire Snapshot</Text>
          <Text className="font-satoshi text-gray-600 mb-1">
            Joined: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
          </Text>
          <Text className="font-satoshi text-gray-600 mb-1">
            Target: {onboardingQuery.data?.target_selection ?? 'Not set'}
          </Text>
          <Text className="font-satoshi text-gray-600">
            Triggers: {onboardingQuery.data?.triggers?.length ? onboardingQuery.data.triggers.join(', ') : 'Not set'}
          </Text>
        </View>

        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-6">
          <Text className="font-erode-semibold text-2xl text-forest mb-2">Daily Reality</Text>
          <Text className="font-satoshi text-gray-600 mb-1">
            {unitsLabel}: {stats.dailyAmount || 'Not set'}
          </Text>
          <Text className="font-satoshi text-gray-600 mb-1">
            Daily spend: {stats.dailyCost ? formatInr(stats.dailyCost) : 'Not set'}
          </Text>
          <Text className="font-satoshi text-gray-600 mb-1">
            Monthly spend: {stats.monthlySpend ? formatInr(stats.monthlySpend) : 'Not set'}
          </Text>
          <Text className="font-satoshi text-gray-600">
            Yearly spend: {stats.yearlySpend ? formatInr(stats.yearlySpend) : 'Not set'}
          </Text>
        </View>

        <View className="rounded-3xl bg-sage border border-gray-200 p-5 mb-8">
          <Text className="font-erode-semibold text-2xl text-forest mb-2">Why You Started</Text>
          <Text className="font-satoshi text-gray-700 leading-7">
            {onboardingQuery.data?.primary_goal ?? 'Finish onboarding to generate your personal reason and projection.'}
          </Text>
        </View>

        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-8">
          <Text className="font-erode-semibold text-2xl text-forest mb-2">Access Status</Text>
          <Text className="font-satoshi text-gray-600 mb-4">
            {activeProgram
              ? `Current program: ${activeProgram.title}`
              : 'No program is currently unlocked on this account.'}
          </Text>
          <Text className="font-satoshi text-gray-600 mb-1">
            State: {access.purchaseState.replace(/_/g, ' ')}
          </Text>
          <Text className="font-satoshi text-gray-600 mb-4">
            Progress: {progress?.completedDays.length ?? 0}/{activeProgram?.totalDays ?? 0} days completed
          </Text>
          <Text className="font-satoshi text-gray-600 mb-4">
            Manage purchases from the App Store or Play Store account that was used to buy the program.
          </Text>
          <Button
            label="Restore Purchases"
            variant="outline"
            onPress={() => void handleRestorePurchases()}
            loading={isRestoring}
          />
          {access.eligibleProducts.includes('ninety_day_transform') && access.ownedProgram !== 'ninety_day_transform' ? (
            <Button
              label="View Upgrade Options"
              variant="ghost"
              className="mt-3"
              onPress={() => router.push('/paywall')}
            />
          ) : null}
        </View>

        <Button
          label="Sign Out"
          variant="destructive"
          onPress={handleSignOut}
          loading={isSigningOut}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
