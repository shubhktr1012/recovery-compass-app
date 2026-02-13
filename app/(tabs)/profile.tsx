import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/providers/auth';
import { useProfile } from '@/providers/profile';
import { Button } from '@/components/ui/Button';

const COST_PER_PACK = 12;
const CIGS_PER_PACK = 20;
const COST_PER_CIG = COST_PER_PACK / CIGS_PER_PACK;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const stats = useMemo(() => {
    if (!profile?.quit_date) {
      return { smokeFreeDays: 0, cigsAvoided: 0, moneySaved: 0 };
    }

    const diffMs = Math.max(0, Date.now() - new Date(profile.quit_date).getTime());
    const smokeFreeDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const cigsAvoided = Math.floor((profile.cigarettes_per_day ?? 0) * (diffMs / (1000 * 60 * 60 * 24)));
    const moneySaved = Math.floor(cigsAvoided * COST_PER_CIG);

    return { smokeFreeDays, cigsAvoided, moneySaved };
  }, [profile?.cigarettes_per_day, profile?.quit_date]);

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
          <Text className="font-satoshi-bold text-white/80 text-xs uppercase mb-3">Stats Overview</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="font-erode-bold text-white text-3xl">{stats.smokeFreeDays}</Text>
              <Text className="font-satoshi text-white/80 text-sm">Smoke-free days</Text>
            </View>
            <View>
              <Text className="font-erode-bold text-white text-3xl">{stats.cigsAvoided}</Text>
              <Text className="font-satoshi text-white/80 text-sm">Cigs avoided</Text>
            </View>
          </View>
          <View className="mt-4 border-t border-white/20 pt-3">
            <Text className="font-satoshi text-white/80 text-sm">Estimated saved</Text>
            <Text className="font-erode-semibold text-white text-2xl">${stats.moneySaved.toLocaleString()}</Text>
          </View>
        </View>

        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-6">
          <Text className="font-erode-semibold text-2xl text-forest mb-2">Program Settings</Text>
          <Text className="font-satoshi text-gray-600 mb-1">
            Quit date: {profile?.quit_date ? new Date(profile.quit_date).toLocaleDateString() : 'Not set'}
          </Text>
          <Text className="font-satoshi text-gray-600 mb-1">
            Cigarettes/day: {profile?.cigarettes_per_day ?? 'Not set'}
          </Text>
          <Text className="font-satoshi text-gray-600">
            Triggers: {profile?.triggers?.length ? profile.triggers.join(', ') : 'Not set'}
          </Text>
        </View>

        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-8">
          <Text className="font-erode-semibold text-2xl text-forest mb-2">Subscription</Text>
          <Text className="font-satoshi text-gray-600 mb-4">
            RevenueCat integration placeholder. Entitlements and manage-subscription actions will be added next.
          </Text>
          <Button label="Manage Subscription (Coming Soon)" variant="outline" disabled />
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
