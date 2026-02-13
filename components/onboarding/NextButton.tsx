
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

    // Animation specific
    const width = useSharedValue(60);

    useEffect(() => {
        if (isLastSlide) {
            width.value = withSpring(160, { damping: 12 });
        } else {
            width.value = withSpring(60, { damping: 12 });
        }
    }, [isLastSlide, width]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            width: width.value,
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: isLastSlide ? withTiming(1) : withTiming(0),
            transform: [{ translateX: isLastSlide ? withTiming(0) : withTiming(20) }]
        };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            opacity: isLastSlide ? withTiming(0) : withTiming(1),
            transform: [{ scale: isLastSlide ? withTiming(0) : withTiming(1) }]
        }
    })

    return (
        <View className="items-center justify-center">
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={scrollTo}
            >
                <Animated.View
                    style={[animatedContainerStyle]}
                    className="h-[60px] bg-primary rounded-full items-center justify-center flex-row overflow-hidden relative"
                >
                    {/* Icon for non-last slides */}
                    <Animated.View style={[animatedIconStyle, { position: 'absolute' }]}>
                        <Feather name="arrow-right" size={24} color="white" />
                    </Animated.View>

                    {/* Text for last slide */}
                    <Animated.View style={[animatedTextStyle, { flexDirection: 'row', alignItems: 'center' }]}>
                        <Text className="text-white font-sans font-bold text-lg mr-2">Get Started</Text>
                        <Feather name="check" size={20} color="white" />
                    </Animated.View>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};
