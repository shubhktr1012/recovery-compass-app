import { View, Text } from 'react-native';
import { useMemo } from 'react';

export function Greeting() {
    // TODO: Get first name from profile data if available, or just use generic greeting
    // We didn't ask for name in onboarding yet.

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning,';
        if (hour < 18) return 'Good Afternoon,';
        return 'Good Evening,';
    }, []);

    return (
        <View className="mb-6 mt-4">
            <Text className="font-satoshi text-gray-400 text-lg">
                {greeting}
            </Text>
            <Text className="font-erode-bold text-3xl text-forest">
                Recovery Warrior
            </Text>
        </View>
    );
}
