import React from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { AppColors } from '@/constants/theme';

interface PaginatorProps {
    data: any[];
    scrollX: SharedValue<number>;
}

interface PaginatorDotProps {
    index: number;
    scrollX: SharedValue<number>;
}

function PaginatorDot({ index, scrollX }: PaginatorDotProps) {
    const { width } = useWindowDimensions();
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const animatedDotStyle = useAnimatedStyle(() => {
        const dotWidth = interpolate(
            scrollX.value,
            inputRange,
            [8, 24, 8],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.3, 1, 0.3],
            Extrapolation.CLAMP
        );

        return {
            width: dotWidth,
            opacity,
        };
    });

    return (
        <Animated.View
            style={[styles.dot, animatedDotStyle]}
        />
    );
}

export const Paginator: React.FC<PaginatorProps> = ({ data, scrollX }) => {
    return (
        <View style={styles.container}>
            {data.map((_, i) => {
                return (
                    <PaginatorDot key={i.toString()} index={i} scrollX={scrollX} />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        height: 6,
        borderRadius: 999,
        backgroundColor: AppColors.forest,
    },
});
