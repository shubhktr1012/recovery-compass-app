import { View, Text, Image, Pressable } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Href } from 'expo-router';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { useProfile } from '@/providers/profile';
import { AppColors } from '@/constants/theme';

function getMotivationalLine(accountAgeDays: number, isReturningUser: boolean, hour: number): string {
    // Late night / early morning — softer, more empathetic
    if (hour >= 22 || hour < 5) {
        const lateNightLines = [
            'Still here. That says everything.',
            'Rest is part of the work. Be gentle tonight.',
            'You don\u2019t need to solve everything right now.',
        ];
        return lateNightLines[accountAgeDays % lateNightLines.length]!;
    }

    // Returning after 3+ day gap
    if (isReturningUser) {
        return 'No judgement. Just pick up where you left off.';
    }

    // Early days (< 7 days)
    if (accountAgeDays < 7) {
        const earlyLines = [
            'Every day you show up matters.',
            'Small steps build real momentum.',
            'You\u2019re doing this. One day at a time.',
        ];
        return earlyLines[accountAgeDays % earlyLines.length]!;
    }

    // Building phase (7-30 days)
    if (accountAgeDays < 30) {
        const buildingLines = [
            'You\u2019re building something real.',
            'Consistency matters more than intensity.',
            'The hardest part was starting. You did that.',
        ];
        return buildingLines[accountAgeDays % buildingLines.length]!;
    }

    // Veteran (30+ days)
    const veteranLines = [
        'This is who you are now.',
        'Your future self will thank you for today.',
        'Steady progress, without pressure.',
    ];
    return veteranLines[accountAgeDays % veteranLines.length]!;
}

export function Greeting() {
    const router = useRouter();
    const { profile, progress } = useProfile();
    const onboardingQuery = useOnboardingResponse();

    const hour = new Date().getHours();

    const greeting = useMemo(() => {
        if (hour < 12) return 'Good Morning,';
        if (hour < 18) return 'Good Afternoon,';
        return 'Good Evening,';
    }, [hour]);

    const todayLabel = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            }).format(new Date()),
        []
    );

    const firstName = profile?.display_name?.trim().split(/\s+/)[0]
        ?? onboardingQuery.data?.full_name?.trim().split(/\s+/)[0]
        ?? 'Recovery Warrior';

    const avatarUrl = profile?.avatar_url ?? null;
    const avatarInitial = firstName.charAt(0).toUpperCase();

    // Calculate account age
    const accountAgeDays = useMemo(() => {
        if (!profile?.created_at) return 0;
        return Math.floor(Math.max(0, Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
    }, [profile?.created_at]);

    // Returning user detection (72h gap)
    const isReturningUser = useMemo(() => {
        if (!progress?.updatedAt) return false;
        const hoursSince = (Date.now() - new Date(progress.updatedAt).getTime()) / (1000 * 60 * 60);
        return hoursSince >= 72;
    }, [progress?.updatedAt]);

    const motivationalLine = useMemo(
        () => getMotivationalLine(accountAgeDays, isReturningUser, hour),
        [accountAgeDays, isReturningUser, hour]
    );

    return (
        <View className="mb-6 mt-4">
            {/* Top row: Avatar + Date */}
            <View className="mb-5 flex-row items-center justify-between">
                <Pressable
                    onPress={() => router.push('/(tabs)/profile' as Href)}
                    hitSlop={8}
                >
                    <View
                        className="h-11 w-11 items-center justify-center rounded-full overflow-hidden"
                        style={{ backgroundColor: avatarUrl ? 'transparent' : AppColors.forest }}
                    >
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                className="h-11 w-11 rounded-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text className="font-satoshi-bold text-lg text-white">
                                {avatarInitial}
                            </Text>
                        )}
                    </View>
                </Pressable>
                <Text className="font-satoshi text-sm text-gray-400">
                    {todayLabel}
                </Text>
            </View>

            {/* Greeting + Name */}
            <Text className="font-satoshi text-base text-gray-400">
                {greeting}
            </Text>
            <Text className="font-erode-medium text-[40px] leading-[48px] tracking-tight text-forest">
                {firstName}
            </Text>

            {/* Dynamic motivational line */}
            <Text className="mt-2 font-satoshi text-[15px] leading-6 text-forest/50">
                {motivationalLine}
            </Text>
        </View>
    );
}
