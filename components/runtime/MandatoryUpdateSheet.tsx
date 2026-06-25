import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppColors } from '@/constants/theme';
import { AppTypography } from '@/constants/typography';
import { buildStoreUrlCandidates, getHttpsStoreUrl, type MandatoryUpdateState } from '@/lib/mandatory-update';
import { captureError } from '@/lib/monitoring';
import { useReducedMotionPreference } from '@/lib/motion/accessibility';

interface MandatoryUpdateSheetProps extends MandatoryUpdateState {
  isLoading?: boolean;
}

export function MandatoryUpdateSheet({
  body = 'Please update the app for the best experience.',
  ctaLabel = 'Update Now',
  isLoading = false,
  storeUrl,
  title = 'Update required',
  visible,
}: MandatoryUpdateSheetProps) {
  const insets = useSafeAreaInsets();
  const isReducedMotionEnabled = useReducedMotionPreference();
  const bottomPadding = Math.max(insets.bottom, 16) + 14;
  const sheetProgress = useSharedValue(visible ? 1 : 0);
  const [isOpeningStore, setIsOpeningStore] = useState(false);
  const storeUrlCandidates = useMemo(
    () => buildStoreUrlCandidates(storeUrl, Platform.OS),
    [storeUrl]
  );
  const httpsStoreUrl = useMemo(
    () => getHttpsStoreUrl(storeUrl, Platform.OS),
    [storeUrl]
  );

  useEffect(() => {
    sheetProgress.value = withTiming(visible ? 1 : 0, {
      duration: isReducedMotionEnabled ? 0 : 220,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
    });
  }, [isReducedMotionEnabled, sheetProgress, visible]);

  useEffect(() => {
    if (visible) {
      setIsOpeningStore(false);
    }
  }, [visible]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isReducedMotionEnabled ? Number(visible) : sheetProgress.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isReducedMotionEnabled ? 1 : 0.9 + sheetProgress.value * 0.1,
    transform: [
      {
        translateY: isReducedMotionEnabled ? 0 : (1 - sheetProgress.value) * 28,
      },
    ],
  }));

  const openStore = async () => {
    if (storeUrlCandidates.length === 0 || isOpeningStore) {
      return;
    }

    setIsOpeningStore(true);

    try {
      for (const candidate of storeUrlCandidates) {
        try {
          const isNativeScheme =
            candidate.startsWith('itms-apps:') || candidate.startsWith('market:');
          if (isNativeScheme) {
            const canOpen = await Linking.canOpenURL(candidate);
            if (!canOpen) {
              continue;
            }
          }

          await Linking.openURL(candidate);
          return;
        } catch {
          // Try the next candidate. iOS Simulator, for example, cannot open the App Store app.
        }
      }

      if (Platform.OS === 'ios' && !Device.isDevice) {
        console.info('Native App Store handoff is unavailable on iOS Simulator.');
        return;
      }

      void captureError(new Error('Unable to open app store update URL'), {
        source: 'mandatory_update',
        metadata: {
          platform: Platform.OS,
          httpsStoreUrl,
          candidateCount: storeUrlCandidates.length,
        },
      });

      Alert.alert(
        "Couldn't open the store",
        'We could not open the store automatically. You can open the update page in your browser instead.',
        [
          { style: 'cancel', text: 'Cancel' },
          {
            text: 'Open in browser',
            onPress: () => {
              void Linking.openURL(httpsStoreUrl);
            },
          },
        ]
      );
    } finally {
      setIsOpeningStore(false);
    }
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={() => undefined}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Animated.View pointerEvents="none" style={[styles.backdrop, backdropAnimatedStyle]} />
        <Animated.View style={[styles.sheet, sheetAnimatedStyle, { paddingBottom: bottomPadding }]}>
          <View style={styles.handle} />
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons name="cloud-download-outline" size={26} color={AppColors.forest} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              disabled={isLoading || isOpeningStore || storeUrlCandidates.length === 0}
              onPress={() => void openStore()}
              style={[
                styles.cta,
                (isLoading || isOpeningStore || storeUrlCandidates.length === 0) ? styles.ctaDisabled : null,
              ]}
            >
              {isLoading || isOpeningStore ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <Text style={styles.ctaText}>{ctaLabel}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
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
    backgroundColor: 'rgba(6, 41, 12, 0.32)',
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 18,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 18,
  },
  content: {
    alignItems: 'center',
    gap: 10,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(6,41,12,0.12)',
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 36,
  },
  iconWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: AppColors.sageSoft,
    borderColor: AppColors.hairline,
    borderRadius: 26,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    marginBottom: 16,
    width: 52,
  },
  title: {
    color: AppColors.forest,
    marginBottom: 10,
    textAlign: 'center',
    ...AppTypography.displayPrompt,
  },
  body: {
    color: AppColors.mutedInk,
    textAlign: 'center',
    ...AppTypography.bodyCompact,
  },
  footer: {
    paddingTop: 4,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: AppColors.forest,
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  ctaDisabled: {
    backgroundColor: 'rgba(6,41,12,0.45)',
  },
  ctaText: {
    color: AppColors.white,
    textAlign: 'center',
    ...AppTypography.buttonMd,
  },
});
