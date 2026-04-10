import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
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
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Restore Purchases */}
        <View style={styles.settingCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: AppColors.sage }]}>
              <Ionicons name="refresh-outline" size={20} color={AppColors.forest} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Restore Purchases</Text>
              <Text style={styles.cardDescription}>
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
        <View style={styles.settingCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: AppColors.sage }]}>
              <Ionicons name="log-out-outline" size={20} color={AppColors.forest} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Sign Out</Text>
              <Text style={styles.cardDescription}>
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
        <View style={styles.dangerCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trash-outline" size={20} color={AppColors.danger} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Delete Account</Text>
              <Text style={[styles.cardDescription, { lineHeight: 20 }]}>
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
  settingCard: {
    borderRadius: 24,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 20,
    marginBottom: 16,
  },
  dangerCard: {
    borderRadius: 24,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: AppColors.forest,
    marginBottom: 2,
  },
  cardDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: AppColors.iconMuted,
  },
});
