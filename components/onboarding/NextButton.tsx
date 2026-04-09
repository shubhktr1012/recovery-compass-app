
import React, { useEffect } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

interface NextButtonProps {
    scrollTo: () => void;
    currentIndex: number;
    totalSlides: number;
}

export const NextButton: React.FC<NextButtonProps> = ({ scrollTo, currentIndex, totalSlides }) => {
    const isLastSlide = currentIndex === totalSlides - 1;

    const width = useSharedValue(174);

    useEffect(() => {
        if (isLastSlide) {
            width.value = withSpring(194, { damping: 14 });
        } else {
            width.value = withSpring(174, { damping: 14 });
        }
    }, [isLastSlide, width]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            width: width.value,
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(1),
            transform: [{ translateX: withTiming(0) }]
        };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(1),
            transform: [{ translateX: isLastSlide ? withTiming(2) : withTiming(0) }]
        };
    });

    return (
        <View className="items-center justify-center">
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={scrollTo}
            >
                <Animated.View
                    style={[animatedContainerStyle]}
                    className="h-[56px] flex-row items-center justify-between overflow-hidden rounded-full border border-[#193126] bg-[#173428] px-4.5"
                >
                    <Animated.View style={[animatedTextStyle, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                        <Text className="font-satoshi-bold text-[14px] tracking-[0.2px] text-[#F5F0E4]">
                            {isLastSlide ? 'Begin your plan' : 'Continue'}
                        </Text>
                    </Animated.View>

                    <Animated.View style={[animatedIconStyle]}>
                        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#F5F2E9]">
                            <Feather name={isLastSlide ? 'check' : 'arrow-right'} size={16} color="#173428" />
                        </View>
                    </Animated.View>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};
