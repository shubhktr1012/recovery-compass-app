import "../global.css";
import { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useSegments, Href, useGlobalSearchParams, useRootNavigationState, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../providers/auth';
import { ProfileProvider, UserProfile, useProfile } from '../providers/profile';
import { AppQueryProvider } from '../providers/query';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { LogBox, Platform, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { AppPreloader } from '@/components/ui/AppPreloader';
import { useProgramQueueReviewStatus } from '@/hooks/useProgramQueueReviewStatus';
import { getPublicEnvState } from '@/lib/env';
import { installGlobalErrorHandler } from '@/lib/monitoring';
import { hasOnboardingContextMismatch } from '@/lib/onboarding.realignment';
import { logEvent } from '@/lib/analytics';
import { canAccessProgramContent } from '@/lib/access/entitlements';
import { getNavigationGuardTarget } from '@/lib/navigation/route-guard';
import { PAYWALL_ROUTE, buildDayDetailRoute } from '@/lib/navigation/routes';
import { NotificationService, type ProgramNotificationTarget } from '@/lib/notifications';
import type { ProgramAccessSnapshot } from '@/lib/programs/types';
import { Session } from '@supabase/supabase-js';
import ErodeRegular from '@/assets/fonts/Erode-Regular.otf';
import ErodeItalic from '@/assets/fonts/Erode-Italic.otf';
import ErodeLight from '@/assets/fonts/Erode-Light.otf';
import ErodeLightItalic from '@/assets/fonts/Erode-LightItalic.otf';
import ErodeMedium from '@/assets/fonts/Erode-Medium.otf';
import ErodeMediumItalic from '@/assets/fonts/Erode-MediumItalic.otf';
import ErodeSemibold from '@/assets/fonts/Erode-Semibold.otf';
import ErodeSemiboldItalic from '@/assets/fonts/Erode-SemiboldItalic.otf';
import ErodeBold from '@/assets/fonts/Erode-Bold.otf';
import ErodeBoldItalic from '@/assets/fonts/Erode-BoldItalic.otf';
import SatoshiRegular from '@/assets/fonts/Satoshi-Regular.otf';
import SatoshiMedium from '@/assets/fonts/Satoshi-Medium.otf';
import SatoshiBold from '@/assets/fonts/Satoshi-Bold.otf';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Ignore dependency warnings and expected store responses that are handled in app code.
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'BillingWrapper purchases failed to update',
  'PurchasesError(code=ProductAlreadyPurchasedError',
]);

const publicEnvState = getPublicEnvState();
const publicEnv = publicEnvState.env;
const uninstallGlobalErrorHandler = installGlobalErrorHandler();
const enablePurchaseQaLogs = process.env.EXPO_PUBLIC_ENABLE_PURCHASE_QA_LOGS === 'true';

function ProgramNotificationTapRouter({
  access,
  enabled,
  userId,
}: {
  access: ProgramAccessSnapshot;
  enabled: boolean;
  userId?: string | null;
}) {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const lastHandledTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !rootNavigationState?.key) {
      return;
    }

    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    const handleTarget = (target: ProgramNotificationTarget) => {
      const targetKey = target.planId ?? `${target.programSlug}:${target.dayNumber}:${target.notificationType ?? 'unknown'}`;
      if (lastHandledTargetRef.current === targetKey) {
        return;
      }

      lastHandledTargetRef.current = targetKey;
      const accessDecision = canAccessProgramContent(access, target.programSlug);

      if (!accessDecision.allowed) {
        void logEvent({
          dayNumber: target.dayNumber,
          eventData: {
            notificationTier: target.notificationTier,
            notificationType: target.notificationType,
            ownedProgram: access.ownedProgram,
            planId: target.planId,
            platform: Platform.OS,
            requestedProgram: target.programSlug,
            targetKey,
          },
          eventType: 'premium_route_blocked',
          programSlug: target.programSlug,
          userId,
        });
        router.replace(PAYWALL_ROUTE);
        return;
      }

      void logEvent({
        dayNumber: target.dayNumber,
        eventData: {
          cardIndex: target.cardIndex,
          notificationTier: target.notificationTier,
          notificationType: target.notificationType,
          planId: target.planId,
          platform: Platform.OS,
          targetKey,
          timeSlot: target.timeSlot,
        },
        eventType: 'notification_tap',
        programSlug: target.programSlug,
        userId,
      });
      router.push(buildDayDetailRoute({
        programSlug: target.programSlug,
        dayNumber: target.dayNumber,
      }));
    };

    void NotificationService.addProgramNotificationResponseListener(handleTarget)
      .then((nextSubscription) => {
        if (!isMounted) {
          nextSubscription?.remove();
          return;
        }

        subscription = nextSubscription;
      })
      .catch((error) => {
        console.warn('Failed to attach program notification tap listener', error);
      });

    void NotificationService.getLastProgramNotificationResponseTarget()
      .then((target) => {
        if (isMounted && target) {
          handleTarget(target);
        }
      })
      .catch((error) => {
        console.warn('Failed to read latest program notification response', error);
      });

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [access, enabled, rootNavigationState?.key, router, userId]);

  return null;
}

function NavigationGate({
    needsOnboardingRealignment,
    needsProgramQueueReview,
    needsProgramSetup,
    isNavigationReady,
    isRecoveringPassword,
    isSubscribed,
    profile,
    session,
}: {
    needsOnboardingRealignment: boolean;
    needsProgramQueueReview: boolean;
    needsProgramSetup: boolean;
    isNavigationReady: boolean;
    isRecoveringPassword: boolean;
    isSubscribed: boolean;
    profile: UserProfile | null;
    session: Session | null;
}) {
  const router = useRouter();
  const segments = useSegments() as string[];
  const searchParams = useGlobalSearchParams<{ mode?: string | string[] }>();
  const rootNavigationState = useRootNavigationState();
  const pendingRedirectRef = useRef<Href | null>(null);
  const modeParam = Array.isArray(searchParams.mode) ? searchParams.mode[0] : searchParams.mode;

  useEffect(() => {
    if (!isNavigationReady || !rootNavigationState?.key) return;

    const checkRouting = () => {
      try {
        if (!isNavigationReady || !rootNavigationState?.key) return;

        const target = getNavigationGuardTarget({
          freeTierActivatedAt: profile?.free_tier_activated_at ?? null,
          hasSession: Boolean(session),
          isRecoveringPassword,
          isSubscribed,
          modeParam,
          needsOnboardingRealignment,
          needsProgramQueueReview,
          needsProgramSetup,
          onboardingComplete: profile?.onboarding_complete ?? null,
          segments,
        });

        if (!target) {
          pendingRedirectRef.current = null;
          return;
        }

        if (pendingRedirectRef.current === target) return;
        pendingRedirectRef.current = target;
        router.replace(target);
      } catch (routingError) {
        pendingRedirectRef.current = null;
        console.warn('Route guard skipped due to navigation not being ready yet.', routingError);
      }
    };

    checkRouting();
  }, [
    isNavigationReady,
    modeParam,
    needsOnboardingRealignment,
    needsProgramQueueReview,
    needsProgramSetup,
    rootNavigationState?.key,
    session,
    profile,
    isSubscribed,
    isRecoveringPassword,
    router,
    segments,
  ]);

  return null;
}

function RootLayoutContent() {
  const { session, isLoading: isAuthLoading, isRecoveringPassword } = useAuth();
  const { access, profile, isSubscribed, isLoading: isProfileLoading } = useProfile();
  const { isLoading: isQueueReviewLoading, shouldReviewQueue } = useProgramQueueReviewStatus();
  const [fontsLoaded] = useFonts({
    'Erode': ErodeRegular,
    'Erode-Regular': ErodeRegular,
    'Erode-Italic': ErodeItalic,
    'Erode-Light': ErodeLight,
    'Erode-LightItalic': ErodeLightItalic,
    'Erode-Medium': ErodeMedium,
    'Erode-Medium-Italic': ErodeMediumItalic,
    'Erode-MediumItalic': ErodeMediumItalic,
    'Erode-SemiBold': ErodeSemibold,
    'Erode-Semibold': ErodeSemibold,
    'Erode-SemiboldItalic': ErodeSemiboldItalic,
    'Erode-Bold': ErodeBold,
    'Erode-BoldItalic': ErodeBoldItalic,
    'Satoshi': SatoshiRegular,
    'Satoshi-Regular': SatoshiRegular,
    'Satoshi-Medium': SatoshiMedium,
    'Satoshi-SemiBold': SatoshiBold,
    'Satoshi-Bold': SatoshiBold,
  });

  const isLoading = isAuthLoading || (session ? isProfileLoading || isQueueReviewLoading : false);
  const needsOnboardingRealignment = hasOnboardingContextMismatch({
    onboardingComplete: profile?.onboarding_complete,
    ownedProgram: access.ownedProgram,
    questionnaireAnswers: profile?.questionnaire_answers ?? null,
    recommendedProgram: profile?.recommended_program ?? null,
  });
  const needsProgramSetup = Boolean(
    access.ownedProgram && access.programState === 'purchased'
  );
  const isNavigationReady = fontsLoaded && !isLoading;
  const hasConfiguredPurchasesRef = useRef(false);
  const revenueCatLoginInFlightRef = useRef<string | null>(null);
  const lastRevenueCatUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isNavigationReady) return;
    void SplashScreen.hideAsync();
  }, [isNavigationReady]);

  // Initialize RevenueCat once.
  useEffect(() => {
    if (isAuthLoading) return;
    if (hasConfiguredPurchasesRef.current) return;

    Purchases.setLogLevel(__DEV__ || enablePurchaseQaLogs ? LOG_LEVEL.VERBOSE : LOG_LEVEL.WARN);

    const iosApiKey = publicEnv.revenueCatAppleKey;
    const androidApiKey = publicEnv.revenueCatGoogleKey;
    const revenueCatUserId = session?.user?.id;
    const revenueCatConfiguration = {
      appUserID: revenueCatUserId,
      shouldShowInAppMessagesAutomatically: false,
    };

    if (Platform.OS === 'ios' && iosApiKey) {
      Purchases.configure({ apiKey: iosApiKey, ...revenueCatConfiguration });
      hasConfiguredPurchasesRef.current = true;
    } else if (Platform.OS === 'android' && androidApiKey) {
      Purchases.configure({ apiKey: androidApiKey, ...revenueCatConfiguration });
      hasConfiguredPurchasesRef.current = true;
    } else {
      console.warn('RevenueCat API key missing for current platform.');
    }
  }, [isAuthLoading, session?.user?.id]);

  // Log in RevenueCat user after SDK is configured.
  useEffect(() => {
    if (!session?.user?.id) {
      revenueCatLoginInFlightRef.current = null;
      lastRevenueCatUserIdRef.current = null;
      return;
    }

    if (!hasConfiguredPurchasesRef.current) return;
    if (revenueCatLoginInFlightRef.current === session.user.id) return;
    if (lastRevenueCatUserIdRef.current === session.user.id) return;

    const loginToRevenueCat = async () => {
      revenueCatLoginInFlightRef.current = session.user.id;

      try {
        await Purchases.logIn(session.user.id);
        lastRevenueCatUserIdRef.current = session.user.id;
      } catch (e) {
        console.error('Error logging into RevenueCat:', e);
      } finally {
        if (revenueCatLoginInFlightRef.current === session.user.id) {
          revenueCatLoginInFlightRef.current = null;
        }
      }
    };

    void loginToRevenueCat();
  }, [session?.user?.id]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="day-detail" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="program-start" options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="program-queue-review" options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="program-complete" options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
      </Stack>
      <NavigationGate
        isNavigationReady={isNavigationReady}
        isRecoveringPassword={isRecoveringPassword}
        isSubscribed={isSubscribed}
        needsOnboardingRealignment={needsOnboardingRealignment}
        needsProgramQueueReview={shouldReviewQueue}
        needsProgramSetup={needsProgramSetup}
        profile={profile}
        session={session}
      />
      <ProgramNotificationTapRouter
        access={access}
        enabled={isNavigationReady && Boolean(session)}
        userId={session?.user?.id ?? null}
      />
      <AppPreloader isNavigationReady={isNavigationReady} isAuthenticated={!!session} />
    </>
  );
}

export default function RootLayout() {
  const [boundaryResetCount, setBoundaryResetCount] = useState(0);

  useEffect(() => () => {
    uninstallGlobalErrorHandler();
  }, []);

  useEffect(() => {
    if (!publicEnvState.isValid) {
      void SplashScreen.hideAsync();
    }
  }, []);

  if (!publicEnvState.isValid) {
    return (
      <View className="flex-1 bg-white px-6 py-16 items-center justify-center">
        <Text className="font-erode-bold text-3xl text-center text-forest mb-4">App Configuration Missing</Text>
        <Text className="font-satoshi text-base leading-6 text-center text-gray-600 max-w-sm">
          This build is missing required public runtime environment variables and cannot start correctly.
        </Text>
        <Text className="font-satoshi-medium text-sm leading-6 text-center text-gray-800 mt-6 max-w-sm">
          {publicEnvState.errorMessage}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppQueryProvider>
        <AuthProvider>
          <ProfileProvider>
            <AppErrorBoundary
              key={boundaryResetCount}
              onReset={() => setBoundaryResetCount((count) => count + 1)}
              resetKeys={[boundaryResetCount]}
            >
              <RootLayoutContent key={`root-layout-${boundaryResetCount}`} />
              <StatusBar style="auto" />
            </AppErrorBoundary>
          </ProfileProvider>
        </AuthProvider>
      </AppQueryProvider>
    </GestureHandlerRootView>
  );
}
