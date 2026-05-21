
import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade_from_bottom' }} />
            <Stack.Screen name="reset-password" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="sign-in" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="sign-up" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="personalization" options={{ animation: 'fade_from_bottom' }} />
        </Stack>
    );
}
