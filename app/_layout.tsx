import "../global.css";
import { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, Href, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../providers/auth';
import { ProfileProvider, useProfile } from '../providers/profile';
import { AppQueryProvider } from '../providers/query';
import { AppStorage } from '../lib/storage';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
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

import { LogBox } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Ignore the SafeAreaView deprecation warning as it comes from dependencies
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

function RootLayoutContent() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const { profile, isSubscribed, isLoading: isProfileLoading } = useProfile();
  const segments = useSegments();
  const router = useRouter();
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
  const isNavigationReady = fontsLoaded && !isLoading;
  const rootNavigationState = useRootNavigationState();
  const pendingRedirectRef = useRef<Href | null>(null);

  useEffect(() => {
    if (!isNavigationReady || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inPaywall = (segments[0] as string) === 'paywall';

    const checkRouting = async () => {
      let target: Href | null = null;

      // 1. If NOT logged in
      if (!session) {
        // If not in auth group, force redirect to Sign In or Intro
        // But wait, Intro is in Auth group too? 
        // Let's assume:
        // /onboarding -> Intro
        // /sign-in -> Login
        // /sign-up -> Signup

        // If user hasn't seen onboarding, show that first.
        const hasSeenIntro = await AppStorage.getItem('hasSeenOnboarding');

        if (!inAuthGroup) {
          target = (!hasSeenIntro ? '/onboarding' : '/sign-in') as Href;
        }
      } else if (!profile || !profile.onboarding_complete) {
        // 2. If Logged In, checking Profile
        // Redirect to Personalization if not there
        if ((segments[1] as string) !== 'personalization') {
          target = '/(auth)/personalization' as Href;
        }
      } else if (!isSubscribed) {
        // 3. User is Logged In + Profile Complete -> Check Subscription
        if (!inPaywall) {
          target = '/paywall' as Href;
        }
      } else if (!inTabsGroup) {
        // 4. Everything Good -> Go to Home
        target = '/(tabs)' as Href;
      }

      if (!target) {
        pendingRedirectRef.current = null;
        return;
      }

      // Avoid queuing repeated identical redirects while navigation state updates.
      if (pendingRedirectRef.current === target) return;
      pendingRedirectRef.current = target;
      router.navigate(target);
    };

    void checkRouting();

    // Hide Splash Screen once we start processing logic
    void SplashScreen.hideAsync();
  }, [isNavigationReady, rootNavigationState?.key, session, profile, isSubscribed, segments, router]);

// Initialize RevenueCat
useEffect(() => {
  const initRevenueCat = async () => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    // Platform-specific API keys
    const iosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;
    const androidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;

    if (Platform.OS === 'ios' && iosApiKey) {
       Purchases.configure({apiKey: iosApiKey});
    } else if (Platform.OS === 'android' && androidApiKey) {
       Purchases.configure({apiKey: androidApiKey});
    }
    
    // If we have a logged in user, tell RevenueCat who they are!
    if (session?.user?.id) {
      try {
        await Purchases.logIn(session.user.id);
      } catch (e) {
        console.error("Error logging into RevenueCat:", e);
      }
    }
  };
  
  initRevenueCat();
}, [session?.user?.id]);

  if (!fontsLoaded || isLoading) {
    return null; // Keep Splash Screen visible
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [boundaryResetCount, setBoundaryResetCount] = useState(0);

  return (
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
  );
}
