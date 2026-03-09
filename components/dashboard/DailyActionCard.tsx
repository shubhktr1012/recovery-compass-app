import { View, Text, TouchableOpacity } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppColors } from '@/constants/theme';

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
    route = '/(tabs)/program',
}: DailyActionCardProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(route)}
            className="relative mb-6 overflow-hidden rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm"
        >
            <View className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sage/80" />
            <View className="mb-4 flex-row items-start justify-between">
                <View className="rounded-full bg-sage px-3 py-1">
                    <Text className="font-satoshi-bold text-xs uppercase text-forest">
                        Day {dayNumber}
                    </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={AppColors.forest} />
            </View>

            <Text className="mb-2 font-erode-bold text-2xl leading-tight text-forest">
                {title}
            </Text>

            <Text className="mb-5 font-satoshi leading-6 text-gray-500" numberOfLines={3}>
                {description}
            </Text>

            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <IconSymbol name="play.circle.fill" size={20} color={AppColors.success} />
                    <Text className="ml-2 font-satoshi-bold text-success">
                        {ctaLabel}
                    </Text>
                    <Text className="ml-2 text-gray-300">•</Text>
                    <Text className="ml-2 font-satoshi text-sm text-gray-400">
                        {duration}
                    </Text>
                </View>
                <View className="rounded-full border border-forest/10 px-3 py-1">
                    <Text className="font-satoshi-bold text-xs uppercase tracking-[1.6px] text-forest/75">
                        Continue
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}
