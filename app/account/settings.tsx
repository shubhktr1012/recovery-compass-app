import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, Pressable, Platform, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Svg, Path, Line, Polyline } from 'react-native-svg';
import { AppColors } from '@/constants/theme';
import { AppTypography } from '@/constants/typography';
import { useAuth } from '@/providers/auth';
import { useProfile } from '@/providers/profile';
import Purchases from 'react-native-purchases';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Constants from 'expo-constants';

// ─── Shared Components for Settings ───

const SectionEye = ({ children }: { children: string }) => (
  <Text style={{ 
    fontFamily: 'Satoshi-Bold', 
    fontSize: 9, 
    letterSpacing: 1.8, 
    textTransform: 'uppercase', 
    color: 'rgba(6,41,12,0.35)', 
    marginBottom: 10,
    paddingLeft: 4
  }}>
    {children}
  </Text>
);

const SettingsCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[{
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
    marginBottom: 24
  }, style]}>
    {children}
  </View>
);

interface SettingsRowProps {
  icon: IconSymbolName;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress: () => void;
  isLast?: boolean;
  danger?: boolean;
}

const SettingsRow = ({ icon, label, sub, right, onPress, isLast, danger }: SettingsRowProps) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: scale.value < 1 ? 'rgba(6,41,12,0.02)' : 'transparent'
  }));

  return (
    <Pressable
      onPressIn={() => scale.value = withTiming(0.98, { duration: 150 })}
      onPressOut={() => scale.value = withTiming(1, { duration: 200 })}
      onPress={onPress}
    >
      <Animated.View style={[{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(6,41,12,0.06)'
      }, animatedStyle]}>
        <View style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: danger ? 'rgba(185,58,43,0.06)' : AppColors.sageSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12
        }}>
          <IconSymbol name={icon} size={15} color={danger ? '#B93A2B' : 'rgba(6,41,12,0.55)'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontFamily: 'Satoshi-Medium',
            fontSize: 14,
            color: danger ? '#B93A2B' : AppColors.forest,
            lineHeight: 16.8
          }}>{label}</Text>
          {sub && (
          <Text style={{
              ...AppTypography.bodyCompact,
              color: danger ? 'rgba(185,58,43,0.6)' : 'rgba(6,41,12,0.45)',
              marginTop: 2,
            }}>{sub}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {right}
          <IconSymbol name="chevron.right" size={14} color={danger ? 'rgba(185,58,43,0.3)' : 'rgba(6,41,12,0.25)'} />
        </View>
      </Animated.View>
    </Pressable>
  );
};

const DangerCard = ({ 
  warningText, 
  label, 
  sub, 
  onPress 
}: { 
  warningText: string; 
  label: string; 
  sub: string; 
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: scale.value < 1 ? 'rgba(6,41,12,0.02)' : 'transparent'
  }));

  return (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#06290C',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 4,
      marginBottom: 12
    }}>
      {/* Warning Strip */}
      <View style={{
        backgroundColor: 'rgba(185,58,43,0.06)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(185,58,43,0.08)'
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingVertical: 2,
          paddingHorizontal: 8,
          borderRadius: 999,
          backgroundColor: 'rgba(185,58,43,0.1)',
          borderWidth: 1,
          borderColor: 'rgba(185,58,43,0.15)'
        }}>
          <Svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#B93A2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <Line x1="12" y1="9" x2="12" y2="13"/>
            <Line x1="12" y1="17" x2="12.01" y2="17"/>
          </Svg>
          <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: '#B93A2B' }}>Irreversible</Text>
        </View>
        <Text style={{ flex: 1, ...AppTypography.bodyCompact, color: 'rgba(185,58,43,0.75)' }}>
          {warningText}
        </Text>
      </View>

      {/* Row */}
      <Pressable
        onPressIn={() => scale.value = withTiming(0.98, { duration: 150 })}
        onPressOut={() => scale.value = withTiming(1, { duration: 200 })}
        onPress={onPress}
      >
        <Animated.View style={[{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16
        }, animatedStyle]}>
          <View style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: 'rgba(185,58,43,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12
          }}>
            <IconSymbol name="trash" size={15} color="rgba(185,58,43,0.7)" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 14, color: '#B93A2B', lineHeight: 16.8 }}>{label}</Text>
            <Text style={{ ...AppTypography.bodyCompact, color: 'rgba(185,58,43,0.6)', marginTop: 2 }}>{sub}</Text>
          </View>
          <IconSymbol name="chevron.right" size={14} color="rgba(185,58,43,0.3)" />
        </Animated.View>
      </Pressable>
    </View>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { deleteAccount, signOut } = useAuth();
  const { refreshAccess, access } = useProfile();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSigningOut, setIsSigningOut] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isRestoring, setIsRestoring] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const appPackageName = Constants.expoConfig?.android?.package ?? 'com.recoverycompass.app';

  const handleOpenSystemNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error: any) {
      Alert.alert('Could not open settings', error?.message ?? 'Please open your device settings and manage notifications there.');
    }
  };

  const handleOpenSupport = async () => {
    try {
      await Linking.openURL('https://recoverycompass.co/support');
    } catch (error: any) {
      Alert.alert('Could not open support', error?.message ?? 'Please try again.');
    }
  };

  const handleManageSubscription = async () => {
    const subscriptionUrl =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : `https://play.google.com/store/account/subscriptions?package=${appPackageName}`;

    try {
      await Linking.openURL(subscriptionUrl);
    } catch (error: any) {
      Alert.alert('Could not open subscriptions', error?.message ?? 'Please try again.');
    }
  };

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
      setShowDeleteSheet(false);
      Alert.alert('Account deleted', 'Your Recovery Compass account and app data have been permanently deleted.');
    } catch (error: any) {
      Alert.alert('Delete account failed', error?.message ?? 'Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleRequestDataDeletion = async () => {
    try {
      await Linking.openURL('https://recoverycompass.co/delete-account');
    } catch (error: any) {
      Alert.alert('Could not open link', error?.message ?? 'Please try again.');
    }
  };

  const isSubscribed = access.ownedProgram !== null;

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.forest }}>
      <StatusBar style="light" />
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ─── Forest Header ─── */}
        <SafeAreaView edges={['top']} style={{ backgroundColor: AppColors.forest }}>
          <View style={{ 
            paddingHorizontal: 20, 
            paddingTop: 12, 
            paddingBottom: 52, 
            overflow: 'hidden', 
            position: 'relative' 
          }}>
            {/* Botanical Watermark */}
            <Svg 
              style={{ position: 'absolute', right: -10, top: -10, opacity: 0.06 }} 
              width={180} 
              height={180} 
              viewBox="0 0 200 200" 
              fill="none"
            >
              <Path d="M100 10C100 10 165 55 165 105C165 148 135 182 100 192C65 182 35 148 35 105C35 55 100 10 100 10Z" fill="#E3F3E5"/>
              <Path d="M100 98L100 192" stroke="#E3F3E5" strokeWidth="1.5"/>
              <Path d="M100 120C80 110 65 125 60 140" stroke="#E3F3E5" strokeWidth="1"/>
            </Svg>

            {/* Back Button */}
            <TouchableOpacity 
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(227,243,229,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(227,243,229,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14
              }}
            >
              <IconSymbol name="arrow.left" size={12} color="rgba(227,243,229,0.75)" />
            </TouchableOpacity>

            <Text style={{ 
              fontFamily: 'Satoshi-Medium', 
              fontSize: 10, 
              letterSpacing: 1.2, 
              textTransform: 'uppercase', 
              color: 'rgba(227,243,229,0.5)' 
            }}>
              Account & System
            </Text>
            <Text style={{ 
              fontFamily: 'Erode-Medium', 
              fontSize: 30, 
              color: '#FFFFFF', 
              lineHeight: 32.4, 
              letterSpacing: -0.6,
              marginTop: 4
            }}>
              Settings
            </Text>
          </View>
        </SafeAreaView>

        {/* ─── Content Area ─── */}
        <View style={{ 
          flex: 1,
          backgroundColor: AppColors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          marginTop: -28,
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 60
        }}>
          
          {/* Subscription */}
          <SectionEye>Subscription</SectionEye>
          <SettingsCard>
            <SettingsRow 
              icon="arrow.clockwise"
              label="Restore Purchases"
              sub="Sync your access from the App Store"
              right={isSubscribed ? (
                <View style={{ 
                  backgroundColor: AppColors.sage, 
                  paddingHorizontal: 9, 
                  paddingVertical: 3, 
                  borderRadius: 999 
                }}>
                  <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 9, letterSpacing: 0.54, textTransform: 'uppercase', color: AppColors.forest }}>Active</Text>
                </View>
              ) : null}
              onPress={handleRestorePurchases}
            />
            <SettingsRow 
              icon="creditcard"
              label="Manage Subscription"
              sub={Platform.OS === 'ios' ? 'View or cancel in App Store' : 'View or cancel in Google Play'}
              onPress={handleManageSubscription}
              isLast={true}
            />
          </SettingsCard>

          {/* Session */}
          <SectionEye>Session</SectionEye>
          <SettingsCard>
            <SettingsRow 
              icon="bell"
              label="Notifications"
              sub="Manage reminder permission in device settings"
              onPress={handleOpenSystemNotificationSettings}
            />
            <SettingsRow 
              icon="arrow.right.to.line"
              label="Sign Out"
              sub="Securely disconnect from this device"
              onPress={handleSignOut}
              isLast={true}
            />
          </SettingsCard>

          {/* Legal & Support */}
          <SectionEye>Legal & Support</SectionEye>
          <SettingsCard>
            <SettingsRow 
              icon="questionmark.circle"
              label="Help & Support"
              sub="Contact us, FAQs"
              onPress={handleOpenSupport}
            />
            <SettingsRow 
              icon="doc.text"
              label="Medical Disclaimer & Sources"
              sub="View the wellness disclaimer and supporting references"
              onPress={() => router.push('/account/citations')}
            />
            <SettingsRow 
              icon="doc.text"
              label="Privacy Policy"
              onPress={() => Linking.openURL('https://recoverycompass.co/privacy')}
            />
            <SettingsRow 
              icon="doc.text"
              label="Terms of Use"
              onPress={() => Linking.openURL('https://recoverycompass.co/terms')}
              isLast={true}
            />
          </SettingsCard>

          {/* Data & Privacy */}
          <SectionEye>Data & Privacy</SectionEye>
          <SettingsCard style={{ marginBottom: 12 }}>
            <SettingsRow 
              icon="trash"
              label="Request Data Deletion"
              sub="Submit a request to erase your data"
              isLast={true}
              onPress={handleRequestDataDeletion}
            />
          </SettingsCard>

          {/* Delete account — isolated danger card */}
          <DangerCard
            warningText="This will permanently remove your account and all recovery data."
            label="Permanently Delete Account"
            sub="Cannot be undone"
            onPress={() => setShowDeleteSheet(true)}
          />

          {/* App Version Footer */}
          <View style={{ marginTop: 8, paddingBottom: 4, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Satoshi-Regular', fontSize: 10, color: 'rgba(6,41,12,0.28)', letterSpacing: 0.4 }}>
              Recovery Compass · v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
            <Text style={{ fontFamily: 'Satoshi-Regular', fontSize: 9, color: 'rgba(6,41,12,0.18)', marginTop: 3, letterSpacing: 0.54 }}>
              Build {Constants.expoConfig?.ios?.buildNumber ?? '1'} · {Platform.OS === 'ios' ? 'iOS' : 'Android'} {Platform.Version}
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* ─── Delete Account Bottom Sheet ─── */}
      <DeleteAccountSheet 
        visible={showDeleteSheet}
        onClose={() => setShowDeleteSheet(false)} 
        onConfirm={performDeleteAccount}
        isDeleting={isDeletingAccount}
      />
    </View>
  );
}

// ─── Custom Bottom Sheet Component ───

function DeleteAccountSheet({ visible, onClose, onConfirm, isDeleting }: { visible: boolean; onClose: () => void; onConfirm: () => void; isDeleting: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,41,12,0.32)' }} onPress={onClose} />
        
        <View style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        }}>
          {/* Handle */}
          <View style={{ 
            width: 36, 
            height: 4, 
            backgroundColor: 'rgba(6,41,12,0.12)', 
            borderRadius: 2, 
            alignSelf: 'center', 
            marginBottom: 24 
          }} />

          <View style={{ paddingHorizontal: 24 }}>
            {/* Warning Icon */}
            <View style={{ 
              width: 52, 
              height: 52, 
              borderRadius: 26, 
              backgroundColor: 'rgba(185,58,43,0.06)', 
              borderWidth: 1,
              borderColor: 'rgba(185,58,43,0.12)',
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 16
            }}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(185,58,43,0.7)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="3 6 5 6 21 6" />
                <Path d="M19 6l-1 14H6L5 6" />
                <Path d="M10 11v6M14 11v6" />
                <Path d="M9 6V4h6v2" />
              </Svg>
            </View>

            <Text style={{ 
              fontFamily: 'Erode-Medium', 
              fontSize: 24, 
              color: AppColors.forest, 
              lineHeight: 27.6,
              letterSpacing: -0.36,
              marginBottom: 10 
            }}>
              Delete your <Text style={{ fontStyle: 'italic' }}>account?</Text>
            </Text>

            <Text style={{ 
              ...AppTypography.bodyCompact,
              color: AppColors.mutedInk, 
              marginBottom: 24
            }}>
              This action is permanent and cannot be undone. Your recovery progress, journal entries, and personal data will be erased.
            </Text>

            {/* Consequences List */}
            <View style={{ 
              backgroundColor: AppColors.surface,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 24 
            }}>
              {[
                'All program progress and completed days removed',
                'Journal entries and reflections permanently deleted',
                'Active subscription must be cancelled separately via App Store'
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: i === 2 ? 0 : 10 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(185,58,43,0.45)', marginTop: 6, marginRight: 10 }} />
                  <Text style={{ flex: 1, ...AppTypography.bodyCompact, color: AppColors.mutedInk }}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 10 }}>
              <TouchableOpacity 
                onPress={onConfirm}
                disabled={isDeleting}
                activeOpacity={0.8}
                style={{ 
                  backgroundColor: '#B93A2B', 
                  width: '100%',
                  paddingVertical: 15, 
                  borderRadius: 999, 
                  alignItems: 'center', 
                }}
              >
                <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.075 }}>
                  {isDeleting ? 'Deleting...' : 'Delete my account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={onClose}
                disabled={isDeleting}
                activeOpacity={0.7}
                style={{ 
                  backgroundColor: AppColors.surface,
                  width: '100%',
                  paddingVertical: 15, 
                  borderRadius: 999, 
                  alignItems: 'center', 
                }}
              >
                <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 15, color: AppColors.mutedInk }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
