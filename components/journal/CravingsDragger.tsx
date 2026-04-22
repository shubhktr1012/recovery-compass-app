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
 * Cravings Level selector — rectangular numbered segments.
 *
 * Matches spec: flex-distributed row of tappable segments,
 * each showing its number. Selected segment fills forest green.
 */
export function CravingsDragger({ value, onChange }: CravingsDraggerProps) {
    const selectedVal = value ?? null;

    const handleSelect = (level: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(level);
    };

    return (
        <View>
            {/* Label */}
            <Text
                style={{
                    fontFamily: 'Satoshi-SemiBold',
                    fontSize: 10,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    color: 'rgba(6,41,12,0.45)',
                    marginBottom: 8,
                }}
            >
                Cravings
            </Text>

            {/* Segment row */}
            <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
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

            {/* Scale labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                <Text
                    style={{
                        fontFamily: 'Satoshi-SemiBold',
                        fontSize: 8,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        color: 'rgba(6,41,12,0.28)',
                    }}
                >
                    Calm
                </Text>
                <Text
                    style={{
                        fontFamily: 'Satoshi-SemiBold',
                        fontSize: 8,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        color: 'rgba(6,41,12,0.28)',
                    }}
                >
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
        scale.value = withTiming(0.9, { duration: 100, easing: Easing.out(Easing.cubic) });
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
            style={{ flex: 1 }}
        >
            <Animated.View
                style={[
                    animStyle,
                    {
                        height: 30,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? AppColors.forest : AppColors.surface,
                        borderWidth: 1,
                        borderColor: isSelected ? AppColors.forest : AppColors.hairline,
                    },
                ]}
            >
                <Text
                    style={{
                        fontFamily: 'Satoshi-Medium',
                        fontSize: 10,
                        color: isSelected ? '#FFFFFF' : 'rgba(6,41,12,0.28)',
                    }}
                >
                    {level}
                </Text>
            </Animated.View>
        </Pressable>
    );
}
