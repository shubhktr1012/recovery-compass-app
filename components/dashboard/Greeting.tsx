import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';

export function Greeting() {
    const onboardingQuery = useOnboardingResponse();

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning,';
        if (hour < 18) return 'Good Afternoon,';
        return 'Good Evening,';
    }, []);
    const todayLabel = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            }).format(new Date()),
        []
    );

    const firstName = onboardingQuery.data?.full_name?.trim().split(/\s+/)[0] ?? 'Recovery Warrior';

    return (
        <View className="mb-6 mt-4 rounded-[28px] border border-gray-200 bg-white px-5 py-5 shadow-sm">
            <View className="mb-4 flex-row items-center justify-between">
                <View className="rounded-full border border-forest/10 bg-sage px-3 py-1">
                    <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.6px] text-forest/80">
                        Recovery Compass
                    </Text>
                </View>
                <Text className="font-satoshi text-sm text-gray-400">
                    {todayLabel}
                </Text>
            </View>
            <Text className="font-satoshi text-base text-gray-400">
                {greeting}
            </Text>
            <Text className="font-erode-bold text-4xl text-forest">
                {firstName}
            </Text>
            <Text className="mt-2 font-satoshi text-sm leading-6 text-gray-500">
                Stay with today&apos;s step. Consistency matters more than intensity.
            </Text>
        </View>
    );
}
