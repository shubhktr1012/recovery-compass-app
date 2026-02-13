
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

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
            style={[{ height: 8, borderRadius: 4 }, animatedDotStyle]}
            className="bg-primary"
        />
    );
}

export const Paginator: React.FC<PaginatorProps> = ({ data, scrollX }) => {
    return (
        <View className="flex-row h-16 justify-center items-center space-x-2">
            {data.map((_, i) => {
                return (
                    <PaginatorDot key={i.toString()} index={i} scrollX={scrollX} />
                );
            })}
        </View>
    );
};
