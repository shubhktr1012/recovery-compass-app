import "../global.css";
import { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useSegments, Href, useRootNavigationState, useRouter } from 'expo-router';
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
import { getPublicEnvState } from '@/lib/env';
import { installGlobalErrorHandler } from '@/lib/monitoring';
import { hasOnboardingContextMismatch } from '@/lib/onboarding.realignment';
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

// Ignore the SafeAreaView deprecation warning as it comes from dependencies
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

const publicEnvState = getPublicEnvState();
const publicEnv = publicEnvState.env;
const uninstallGlobalErrorHandler = installGlobalErrorHandler();

function NavigationGate({
    needsOnboardingRealignment,
    isNavigationReady,
    isRecoveringPassword,
    isSubscribed,
    profile,
    session,
}: {
    needsOnboardingRealignment: boolean;
    isNavigationReady: boolean;
    isRecoveringPassword: boolean;
    isSubscribed: boolean;
    profile: UserProfile | null;
    session: Session | null;
}) {
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const pendingRedirectRef = useRef<Href | null>(null);

  useEffect(() => {
    if (!isNavigationReady || !rootNavigationState?.key) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inTabsGroup = segments[0] === '(tabs)';
        const inPaywall = inAuthGroup && (segments[1] as string) === 'paywall';
        const inDayDetail = (segments[0] as string) === 'day-detail';
        const inResetPassword = inAuthGroup && (segments[1] as string) === 'reset-password';
        const inPersonalization = inAuthGroup && (segments[1] as string) === 'personalization';
        const inAccountStack = (segments[0] as string) === 'account';

        const checkRouting = async () => {
            try {
                if (!isNavigationReady || !rootNavigationState?.key) return;

                let target: Href | null = null;

                if (isRecoveringPassword) {
                    if (!inResetPassword) {
                        target = '/reset-password' as Href;
                    }
                } else if (!session) {
                    if (!inAuthGroup) {
                        target = '/welcome' as Href;
                    }
                } else if (isSubscribed) {
                    if (needsOnboardingRealignment) {
                        if (!inPersonalization) {
                            target = '/personalization?mode=realign' as Href;
                        }
                    } else if (!inTabsGroup && !inDayDetail && !inAccountStack) {
                        target = '/' as Href;
                    }
                } else if (!profile || !profile.onboarding_complete) {
                    if ((segments[1] as string) !== 'personalization') {
                        target = '/personalization' as Href;
                    }
                } else if (!inPaywall) {
                    target = '/paywall' as Href;
                }

        if (!target) {
          pendingRedirectRef.current = null;
          return;
        }

        if (pendingRedirectRef.current === target) return;
        pendingRedirectRef.current = target;
        router.navigate(target);
      } catch (routingError) {
        pendingRedirectRef.current = null;
        console.warn('Route guard skipped due to navigation not being ready yet.', routingError);
      }
    };

    void checkRouting();
    }, [isNavigationReady, needsOnboardingRealignment, rootNavigationState?.key, session, profile, isSubscribed, isRecoveringPassword, router, segments]);

  return null;
}

function RootLayoutContent() {
  const { session, isLoading: isAuthLoading, isRecoveringPassword } = useAuth();
  const { access, profile, isSubscribed, isLoading: isProfileLoading } = useProfile();
  const [fontsLoaded] = useFonts({
    'Erode-Regular': ErodeRegular,
    'Erode-Italic': ErodeItalic,
    'Erode-Light': ErodeLight,
    'Erode-LightItalic': ErodeLightItalic,
    'Erode-Medium': ErodeMedium,
    'Erode-MediumItalic': ErodeMediumItalic,
    'Erode-Semibold': ErodeSemibold,
    'Erode-SemiboldItalic': ErodeSemiboldItalic,
    'Erode-Bold': ErodeBold,
    'Erode-BoldItalic': ErodeBoldItalic,
    'Satoshi-Regular': SatoshiRegular,
    'Satoshi-Medium': SatoshiMedium,
    'Satoshi-Bold': SatoshiBold,
  });

  const isLoading = isAuthLoading || (session ? isProfileLoading : false);
  const needsOnboardingRealignment = hasOnboardingContextMismatch({
    onboardingComplete: profile?.onboarding_complete,
    ownedProgram: access.ownedProgram,
    questionnaireAnswers: profile?.questionnaire_answers ?? null,
    recommendedProgram: profile?.recommended_program ?? null,
  });
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

    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="account" />
        <Stack.Screen name="day-detail" />
      </Stack>
      <NavigationGate
        isNavigationReady={isNavigationReady}
        isRecoveringPassword={isRecoveringPassword}
        isSubscribed={isSubscribed}
        needsOnboardingRealignment={needsOnboardingRealignment}
        profile={profile}
        session={session}
      />
    </>
  );
}

export default function RootLayout() {
  const [boundaryResetCount, setBoundaryResetCount] = useState(0);

  useEffect(() => () => {
    uninstallGlobalErrorHandler();
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
