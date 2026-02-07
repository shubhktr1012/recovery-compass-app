import "../global.css";
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../providers/auth';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Load local fonts to match the "Warm Luxury" design system
    'Erode-Regular': require('@/assets/fonts/Erode-Regular.woff2'),
    'Erode-Medium': require('@/assets/fonts/Erode-Medium.woff2'),
    'Erode-SemiBold': require('@/assets/fonts/Erode-SemiBold.woff2'),
    'Erode-Bold': require('@/assets/fonts/Erode-Bold.woff2'),
    'Satoshi-Regular': require('@/assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('@/assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('@/assets/fonts/Satoshi-Bold.otf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
