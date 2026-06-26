import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppColors } from '@/constants/theme';
import { AppTypography } from '@/constants/typography';
import { useNotificationPermissionReviewStatus } from '@/hooks/useNotificationPermissionReviewStatus';
import { HOME_ROUTE } from '@/lib/navigation/routes';
import { requestNotificationPermissionAsync } from '@/lib/notification-permissions';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { useProfile } from '@/providers/profile';

function ReminderBenefit({
  body,
  icon,
  title,
}: {
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View className="flex-row gap-3 rounded-[24px] border border-forest/5 bg-white p-4">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-sageSoft">
        <Ionicons name={icon} size={20} color={AppColors.forest} />
      </View>
      <View className="flex-1">
        <Text className="text-forest" style={AppTypography.bodyStrong}>
          {title}
        </Text>
        <Text className="mt-1 text-forest/55" style={AppTypography.bodyCompact}>
          {body}
        </Text>
      </View>
    </View>
  );
}

export default function NotificationPermissionReviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, refreshProfile, isLoading: isProfileLoading } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const userId = user?.id ?? null;
  const notificationsEnabled = Boolean(profile?.notifications_enabled || profile?.push_opt_in);
  const {
    isLoading: isReviewLoading,
    markReviewed,
    shouldReviewNotifications,
  } = useNotificationPermissionReviewStatus({
    notificationsEnabled,
    userId,
  });

  const syncNotificationPreference = useCallback(
    async ({
      enabled,
      expoPushToken,
    }: {
      enabled: boolean;
      expoPushToken: string | null;
    }) => {
      if (!userId) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          expo_push_token: expoPushToken,
          notifications_enabled: enabled,
          push_opt_in: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      await refreshProfile();
    },
    [refreshProfile, userId]
  );

  const handleEnableReminders = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      const result = await requestNotificationPermissionAsync();
      const isEnabled = result.status === 'granted';

      await syncNotificationPreference({
        enabled: isEnabled,
        expoPushToken: result.expoPushToken,
      });
      await markReviewed();
      await Haptics.notificationAsync(
        isEnabled
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      ).catch(() => undefined);

      if (!isEnabled) {
        Alert.alert(
          'Reminders are off',
          'You can still use Recovery Compass. Turn reminders on later from Settings if you want daily nudges.'
        );
      }

      router.replace(HOME_ROUTE);
    } catch (error: any) {
      Alert.alert('Could not update reminders', error?.message ?? 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, markReviewed, router, syncNotificationPreference]);

  const handleSkip = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      await markReviewed();
      await Haptics.selectionAsync().catch(() => undefined);
      router.replace(HOME_ROUTE);
    } catch (error: any) {
      Alert.alert('Could not continue', error?.message ?? 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, markReviewed, router]);

  useEffect(() => {
    if (isProfileLoading || isReviewLoading || shouldReviewNotifications) {
      return;
    }

    router.replace(HOME_ROUTE);
  }, [isProfileLoading, isReviewLoading, router, shouldReviewNotifications]);

  if (isProfileLoading || isReviewLoading || !shouldReviewNotifications) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color={AppColors.forest} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerClassName="px-6 pt-8 pb-32"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <View className="h-[86px] w-[86px] items-center justify-center rounded-[32px] bg-forest">
            <Ionicons name="notifications-outline" size={36} color={AppColors.white} />
          </View>
        </View>

        <Text
          className="mt-8 text-center uppercase text-forest/45"
          style={[AppTypography.eyebrow, { letterSpacing: 2 }]}
        >
          Daily reminders
        </Text>
        <Text className="mt-4 text-center text-forest" style={AppTypography.displayHero}>
          Stay close to your program.
        </Text>
        <Text className="mt-4 text-center text-forest/58" style={AppTypography.bodyLarge}>
          Recovery Compass works best with gentle reminders for the right moment in your day.
        </Text>

        <View className="mt-8 gap-3">
          <ReminderBenefit
            body="Get nudged when your daily session is ready."
            icon="sunny-outline"
            title="Morning start"
          />
          <ReminderBenefit
            body="Stay on track if a card or evening routine is waiting."
            icon="leaf-outline"
            title="Timely follow-through"
          />
          <ReminderBenefit
            body="Your reminders are private and can be turned off anytime."
            icon="lock-closed-outline"
            title="You stay in control"
          />
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-forest/5 bg-surface/95 px-6 pb-8 pt-4">
        <Pressable
          accessibilityRole="button"
          className={`h-[58px] items-center justify-center rounded-full ${isSaving ? 'bg-forest/55' : 'bg-forest'}`}
          disabled={isSaving}
          onPress={() => void handleEnableReminders()}
        >
          <Text className="text-white" style={AppTypography.buttonLg}>
            {isSaving ? 'One moment...' : 'Enable reminders'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="mt-3 h-11 items-center justify-center"
          disabled={isSaving}
          onPress={() => void handleSkip()}
        >
          <Text className="text-forest/50" style={AppTypography.buttonMd}>
            Not now
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
