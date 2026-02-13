import "../global.css";
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../providers/auth';
import { ProfileProvider, useProfile } from '../providers/profile';
import { AppQueryProvider } from '../providers/query';
import { AppStorage } from '../lib/storage';
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

  useEffect(() => {
    if (!isNavigationReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    // const inTabsGroup = segments[0] === '(tabs)'; // Not used yet
    const inPaywall = (segments[0] as string) === 'paywall';

    const checkRouting = async () => {
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
          if (!hasSeenIntro) {
            router.replace('/onboarding' as Href);
          } else {
            router.replace('/sign-in' as Href);
          }
        }
        return;
      }

      // 2. If Logged In, checking Profile
      // If no profile loaded yet (but session exists), wait? 
      // The isLoading flag handles the initial fetch, so profile 'should' be there if created.
      // But if user just signed up, trigger might verify it.

      if (!profile || !profile.onboarding_complete) {
        // Redirect to Personalization if not there
        if ((segments[1] as string) !== 'personalization') {
          router.replace('/personalization' as Href);
        }
        return;
      }

      // 3. User is Logged In + Profile Complete -> Check Subscription
      if (!isSubscribed) {
        if (!inPaywall) {
          router.replace('/paywall' as Href);
        }
        return;
      }

      // 4. Everything Good -> Go to Home
      // Only redirect if currently in auth or paywall
      if (inAuthGroup || inPaywall) {
        router.replace('/(tabs)' as Href);
      }
    };

    checkRouting();

    // Hide Splash Screen once we start processing logic
    SplashScreen.hideAsync();

  }, [isNavigationReady, session, profile, isSubscribed, segments, router]);

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
