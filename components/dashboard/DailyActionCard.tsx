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
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6"
        >
            <View className="flex-row justify-between items-start mb-4">
                <View className="bg-sage px-3 py-1 rounded-full">
                    <Text className="text-forest font-satoshi-bold text-xs uppercase">
                        Day {dayNumber}
                    </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={AppColors.forest} />
            </View>

            <Text className="font-erode-bold text-2xl text-forest mb-2 leading-tight">
                {title}
            </Text>

            <Text className="font-satoshi text-gray-500 mb-4 leading-6" numberOfLines={3}>
                {description}
            </Text>

            <View className="flex-row items-center">
                <IconSymbol name="play.circle.fill" size={20} color={AppColors.success} />
                <Text className="ml-2 font-satoshi-bold text-success">
                    {ctaLabel}
                </Text>
                <Text className="ml-2 text-gray-300">•</Text>
                <Text className="ml-2 text-gray-400 font-satoshi text-sm">
                    {duration}
                </Text>
            </View>
        </TouchableOpacity>
    );
}
