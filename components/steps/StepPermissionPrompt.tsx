import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppColors } from '@/constants/theme';
import type { DailyStepSummary } from '@/lib/steps';
import { useAuth } from '@/providers/auth';

const PROMPT_DISMISSED_KEY_PREFIX = 'rc_step_permission_prompt_dismissed';

interface StepPermissionPromptProps {
  enableStepTracking: () => Promise<DailyStepSummary>;
  isEnabling: boolean;
  isLoading: boolean;
  summary: DailyStepSummary | null;
}

function getDismissedKey(userId: string) {
  return `${PROMPT_DISMISSED_KEY_PREFIX}:${userId}`;
}

export function StepPermissionPrompt({
  enableStepTracking,
  isEnabling,
  isLoading,
  summary,
}: StepPermissionPromptProps) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [dismissed, setDismissed] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDismissedState = async () => {
      if (!userId) {
        if (isMounted) {
          setDismissed(true);
          setIsReady(true);
        }
        return;
      }

      try {
        const value = await AsyncStorage.getItem(getDismissedKey(userId));
        if (isMounted) {
          setDismissed(value === '1');
          setIsReady(true);
        }
      } catch {
        if (isMounted) {
          setDismissed(true);
          setIsReady(true);
        }
      }
    };

    setIsReady(false);
    void loadDismissedState();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const shouldShow = useMemo(() => {
    if (!userId || !isReady || dismissed || isLoading || !summary) {
      return false;
    }

    return (
      summary.permissionState !== 'ready' &&
      summary.permissionState !== 'unavailable' &&
      summary.canAskAgain
    );
  }, [dismissed, isLoading, isReady, summary, userId]);

  const dismiss = async () => {
    if (userId) {
      await AsyncStorage.setItem(getDismissedKey(userId), '1');
    }
    setDismissed(true);
  };

  const handleEnable = async () => {
    try {
      const result = await enableStepTracking();

      if (result.permissionState === 'ready') {
        await dismiss();
        return;
      }

      await dismiss();
      Alert.alert(
        'Step tracking unavailable',
        result.canAskAgain
          ? 'Permission was not granted. You can enable step tracking later from Statistics.'
          : 'Step access is disabled for Recovery Compass. You can update this in device settings.'
      );
    } catch (error: any) {
      Alert.alert('Step tracking failed', error?.message ?? 'Please try again.');
    }
  };

  return (
    <Modal visible={shouldShow} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={() => void dismiss()} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.iconWrap}>
            <Ionicons name="walk-outline" size={24} color={AppColors.forest} />
          </View>

          <Text style={styles.title}>Track daily movement</Text>
          <Text style={styles.body}>
            {Platform.OS === 'ios'
              ? 'Recovery Compass can use Motion & Fitness to show your current program-day steps.'
              : 'Recovery Compass can use the best available device step source to show your current program-day steps.'}
          </Text>
          <Text style={styles.caption}>Your step day resets at 5:00 AM local time.</Text>

          <Pressable
            onPress={() => void handleEnable()}
            disabled={isEnabling}
            style={[styles.primaryButton, isEnabling && styles.disabledButton]}
          >
            {isEnabling ? (
              <ActivityIndicator color={AppColors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Enable step tracking</Text>
            )}
          </Pressable>

          <Pressable onPress={() => void dismiss()} hitSlop={12} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,41,12,0.34)',
  },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 34,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(6,41,12,0.14)',
    borderRadius: 999,
    height: 4,
    marginBottom: 20,
    width: 44,
  },
  iconWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: AppColors.sageSoft,
    borderColor: AppColors.hairline,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginBottom: 16,
    width: 48,
  },
  title: {
    color: AppColors.forest,
    fontFamily: 'Erode-Bold',
    fontSize: 25,
    lineHeight: 30,
    textAlign: 'center',
  },
  body: {
    color: AppColors.mutedInk,
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
  caption: {
    color: AppColors.subtleInk,
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: AppColors.forest,
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 52,
    paddingHorizontal: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: AppColors.white,
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: AppColors.subtleInk,
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
  },
});
