import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppColors } from '@/constants/theme';

interface CravingsDraggerProps {
    value: number | null;
    onChange: (val: number) => void;
}

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/**
 * Impeccable Cravings Level selector.
 *
 * Instead of a continuous slider (which fights ScrollView and feels
 * like a dashboard widget), this uses a row of tappable discrete
 * segments — each one a calm, printed-artifact-style label.
 *
 * Per .impeccable.md:
 * - "cards should feel like premium printed artifacts or quiet gallery labels"
 * - "favor fewer, better-composed elements over dense utility packing"
 * - "surfaces that feel like printed cards, not generic software panels"
 */
export function CravingsDragger({ value, onChange }: CravingsDraggerProps) {
    const selectedVal = value ?? null;

    const handleSelect = (level: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(level);
    };

    return (
        <View className="mb-2">
            {/* Label row */}
            <View className="flex-row justify-between items-end mb-4">
                <Text className="text-forest font-satoshi-medium text-sm ml-1">
                    Cravings Level
                </Text>
                {selectedVal !== null && (
                    <Text className="font-erode-semibold text-[22px] text-forest mr-1">
                        {selectedVal}
                    </Text>
                )}
            </View>

            {/* Discrete segment row */}
            <View className="flex-row items-center justify-between">
                {LEVELS.map((level) => {
                    const isSelected = selectedVal === level;
                    return (
                        <CravingsSegment
                            key={level}
                            level={level}
                            isSelected={isSelected}
                            onSelect={handleSelect}
                        />
                    );
                })}
            </View>

            {/* Scale context */}
            <View className="flex-row justify-between px-0.5 mt-3">
                <Text className="font-satoshi text-[10px] uppercase tracking-[1.5px] text-forest/20">
                    Calm
                </Text>
                <Text className="font-satoshi text-[10px] uppercase tracking-[1.5px] text-forest/20">
                    Intense
                </Text>
            </View>
        </View>
    );
}

function CravingsSegment({
    level,
    isSelected,
    onSelect,
}: {
    level: number;
    isSelected: boolean;
    onSelect: (level: number) => void;
}) {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.85, { duration: 100, easing: Easing.out(Easing.cubic) });
    };
    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => onSelect(level)}
            hitSlop={4}
        >
            <Animated.View
                style={[
                    animStyle,
                    {
                        width: 30,
                        height: 40,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? AppColors.forest : 'transparent',
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: isSelected ? 'transparent' : 'rgba(6, 41, 12, 0.06)',
                    },
                ]}
            >
                <Text
                    style={{
                        fontFamily: isSelected ? 'Satoshi-Bold' : 'Satoshi-Medium',
                        fontSize: 14,
                        color: isSelected ? '#FFFFFF' : 'rgba(6, 41, 12, 0.35)',
                    }}
                >
                    {level}
                </Text>
            </Animated.View>
        </Pressable>
    );
}
