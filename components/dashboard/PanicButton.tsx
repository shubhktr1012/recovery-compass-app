import { Pressable, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppColors } from '@/constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

export function PanicButton() {
    const router = useRouter();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.92, { duration: 180, easing: Easing.inOut(Easing.cubic) });
    };
    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 240, easing: Easing.inOut(Easing.cubic) });
    };

    return (
        <View className="absolute bottom-24 right-6 items-center z-50">
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => router.push('/modal' as Href)}
            >
                <Animated.View
                    style={[
                        animatedStyle,
                        {
                            shadowColor: AppColors.forest,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 16,
                            elevation: 6,
                        },
                    ]}
                    className="w-14 h-14 rounded-full items-center justify-center bg-forest"
                >
                    <IconSymbol name="leaf.fill" size={24} color={AppColors.sage} />
                </Animated.View>
            </Pressable>
        </View>
    );
}
