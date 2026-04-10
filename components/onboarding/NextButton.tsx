import React, { useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { AppColors } from '@/constants/theme';

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
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={scrollTo}
            >
                <Animated.View style={[styles.buttonContainer, animatedContainerStyle]}>
                    <Animated.View style={[styles.textContainer, animatedTextStyle]}>
                        <Text style={styles.buttonText}>
                            {isLastSlide ? 'Begin your plan' : 'Continue'}
                        </Text>
                    </Animated.View>

                    <Animated.View style={[animatedIconStyle]}>
                        <View style={styles.iconContainer}>
                            <Feather name={isLastSlide ? 'check' : 'arrow-right'} size={16} color={AppColors.forest} />
                        </View>
                    </Animated.View>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContainer: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        borderRadius: 9999,
        backgroundColor: AppColors.forest,
        paddingLeft: 22,
        paddingRight: 8,
    },
    textContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        fontFamily: 'Satoshi-Medium',
        fontSize: 14,
        letterSpacing: 0.2,
        color: AppColors.white,
    },
    iconContainer: {
        height: 36,
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        backgroundColor: AppColors.surface,
    },
});
