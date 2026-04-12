import { View, Text, Pressable } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppColors } from '@/constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

interface DailyActionCardProps {
    dayNumber?: number;
    title?: string;
    description?: string;
    duration?: string;
    ctaLabel?: string;
    route?: Href;
}

export function DailyActionCard({
    dayNumber = 1,
    title = 'The Physiology of Addiction',
    description = 'Understand exactly what is happening in your brain right now, and why the cravings feel so intense. Knowledge is your first weapon.',
    duration = '5 min read',
    ctaLabel = 'Start Session',
    route = '/program',
}: DailyActionCardProps) {
    const router = useRouter();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.97, { duration: 180, easing: Easing.inOut(Easing.cubic) });
    };
    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 240, easing: Easing.inOut(Easing.cubic) });
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => router.push(route)}
            className="mb-6"
        >
            <Animated.View
                style={animatedStyle}
                className="overflow-hidden rounded-2xl border border-forest/8 bg-white p-5"
            >
                <View className="mb-4 flex-row items-start justify-between">
                    <View className="rounded-lg bg-sage px-3 py-1">
                        <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.5px] text-forest">
                            Day {dayNumber}
                        </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={AppColors.forest} style={{ opacity: 0.3 }} />
                </View>

                <Text className="mb-2 font-erode-semibold text-[22px] leading-[28px] text-forest">
                    {title}
                </Text>

                <Text className="mb-5 font-satoshi text-[15px] leading-6 text-forest/45" numberOfLines={3}>
                    {description}
                </Text>

                <View className="flex-row items-center">
                    <IconSymbol name="play.circle.fill" size={18} color={AppColors.success} />
                    <Text className="ml-2 font-satoshi-bold text-[14px] text-success">
                        {ctaLabel}
                    </Text>
                    <Text className="ml-2 text-forest/15">·</Text>
                    <Text className="ml-2 font-satoshi text-[13px] text-forest/35">
                        {duration}
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
}
