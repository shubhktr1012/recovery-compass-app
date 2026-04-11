import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/providers/auth';
import { useProfile } from '@/providers/profile';
import Purchases from 'react-native-purchases';
import { SettingRow } from '@/components/account/SettingRow';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PaperGrain } from '@/components/ui/PaperGrain';

export default function SettingsScreen() {
  const router = useRouter();
  const { deleteAccount, signOut } = useAuth();
  const { refreshAccess, access } = useProfile();
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

  const handleRequestDataDeletion = async () => {
    try {
      await Linking.openURL('https://recoverycompass.co/delete-account');
    } catch (error: any) {
      Alert.alert('Could not open link', error?.message ?? 'Please try again.');
    }
  };

  const activeProgramStatus = access.ownedProgram ? 'Active' : 'Free Tier';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <PaperGrain />
      <StatusBar style="dark" />
      
      <ScrollView 
        contentContainerClassName="p-6 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="mb-10 pt-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center"
              hitSlop={12}
            >
              <IconSymbol name="chevron.left" size={20} color={AppColors.forest} />
            </TouchableOpacity>
          </View>
          
          <Text className="font-satoshi text-[11px] uppercase tracking-[3px] text-forest/35 mb-1">
            Account & System
          </Text>
          <Text className="font-erode-medium text-[40px] leading-[48px] tracking-tight text-forest">
            Settings
          </Text>
        </View>

        {/* Subscription Section */}
        <View className="mb-8">
          <Text className="font-satoshi-bold text-[11px] uppercase tracking-[2px] text-forest/30 mb-4 px-1">
            Subscription
          </Text>
          <SettingRow
            label="Restore Purchases"
            description="Sync your access from the App Store"
            icon="arrow.clockwise"
            onPress={() => void handleRestorePurchases()}
            loading={isRestoring}
            value={activeProgramStatus}
          />
        </View>

        {/* Account Section */}
        <View className="mb-12">
          <Text className="font-satoshi-bold text-[11px] uppercase tracking-[2px] text-forest/30 mb-4 px-1">
            Session
          </Text>
          <SettingRow
            label="Sign Out"
            description="Securely disconnect from this device"
            icon="arrow.right.to.line"
            onPress={() => void handleSignOut()}
            loading={isSigningOut}
          />
        </View>

        {/* Danger Zone - Refined Text Link */}
        <View className="mt-8 pt-8 border-t border-forest/5 items-center">
            <Pressable
                onPress={() => void handleRequestDataDeletion()}
                className="flex-row items-center opacity-70 active:opacity-100 mb-5"
                hitSlop={12}
            >
                <IconSymbol name="link" size={14} color={AppColors.forest} />
                <Text className="ml-2 font-satoshi-medium text-[13px] text-forest">
                    Request Data Deletion
                </Text>
            </Pressable>
            <Pressable
                onPress={handleDeleteAccount}
                className="flex-row items-center opacity-40 active:opacity-100"
                disabled={isDeletingAccount}
            >
                <IconSymbol name="exclamationmark.triangle.fill" size={14} color={AppColors.danger} />
                <Text className="ml-2 font-satoshi-medium text-[13px] text-danger">
                    Permanently Delete Account
                </Text>
            </Pressable>
            <Text className="mt-3 font-satoshi text-[11px] text-forest/20 text-center max-w-[240px]">
                This action is irreversible and will remove all your recovery data.
            </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
