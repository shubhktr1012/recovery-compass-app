import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/providers/auth';
import { useProfile } from '@/providers/profile';
import { Button } from '@/components/ui/Button';
import Purchases from 'react-native-purchases';

export default function SettingsScreen() {
  const router = useRouter();
  const { deleteAccount, signOut } = useAuth();
  const { refreshAccess } = useProfile();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

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

  const performDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await deleteAccount();
      Alert.alert('Account deleted', 'Your Recovery Compass account and app data have been permanently deleted.');
    } catch (error: any) {
      Alert.alert('Delete account failed', error?.message ?? 'Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This starts permanent account deletion. You will lose access to your Recovery Compass data on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'This cannot be undone',
              'Deleting your account permanently removes your profile, onboarding answers, journal entries, and program progress.',
              [
                { text: 'Keep Account', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: () => {
                    void performDeleteAccount();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

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
          <Text className="font-erode-bold text-3xl text-forest">Settings</Text>
        </View>

        {/* Restore Purchases */}
        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-sage items-center justify-center mr-3">
              <Ionicons name="refresh-outline" size={20} color={AppColors.forest} />
            </View>
            <View className="flex-1">
              <Text className="font-satoshi-bold text-forest text-base">Restore Purchases</Text>
              <Text className="font-satoshi text-gray-500 text-sm">
                Refresh access from the App Store or Play Store
              </Text>
            </View>
          </View>
          <Button
            label="Restore Purchases"
            variant="outline"
            onPress={() => void handleRestorePurchases()}
            loading={isRestoring}
          />
        </View>

        {/* Sign Out */}
        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-sage items-center justify-center mr-3">
              <Ionicons name="log-out-outline" size={20} color={AppColors.forest} />
            </View>
            <View className="flex-1">
              <Text className="font-satoshi-bold text-forest text-base">Sign Out</Text>
              <Text className="font-satoshi text-gray-500 text-sm">
                Sign out of your account on this device
              </Text>
            </View>
          </View>
          <Button
            label="Sign Out"
            variant="outline"
            onPress={() => void handleSignOut()}
            loading={isSigningOut}
          />
        </View>

        {/* Delete Account */}
        <View className="rounded-3xl bg-white border border-red-200 p-5 mb-4">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-3">
              <Ionicons name="trash-outline" size={20} color={AppColors.danger} />
            </View>
            <View className="flex-1">
              <Text className="font-satoshi-bold text-forest text-base">Delete Account</Text>
              <Text className="font-satoshi text-gray-500 text-sm leading-5">
                Permanently delete your Recovery Compass account, questionnaire data, journal entries, and program progress
              </Text>
            </View>
          </View>
          <Button
            label="Delete Account"
            variant="destructive"
            onPress={handleDeleteAccount}
            loading={isDeletingAccount}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
