import React from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { twMerge } from 'tailwind-merge';
import { getPasswordStrength, PASSWORD_REQUIREMENTS_HINT } from '@/lib/password';

interface Props {
    password?: string;
}

const STRENGTH_LABELS = ['None', 'Weak', 'Fair', 'Good', 'Secure'];

function StrengthBar({ active }: { active: boolean }) {
    const barStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(
                active ? '#1e382d' : 'rgba(30,56,45,0.1)',
                { duration: 300, easing: Easing.out(Easing.ease) }
            ),
        };
    }, [active]);

    return <Animated.View style={barStyle} className="flex-1 rounded-full" />;
}

export function PasswordStrength({ password = '' }: Props) {
    const score = getPasswordStrength(password);
    
    // We only show the dynamic indicator if they've started typing, 
    // otherwise just the hint.
    const hasInput = password.length > 0;

    return (
        <View className="mt-2.5 flex-col space-y-2">
            <View className="flex-row space-x-1.5 h-1">
                {[1, 2, 3, 4].map((idx) => (
                    <StrengthBar key={idx} active={score >= idx} />
                ))}
            </View>

            <View className="flex-row justify-between items-start">
                <Text className="text-forest/50 text-xs font-satoshi leading-tigher flex-1 pr-4">
                    {PASSWORD_REQUIREMENTS_HINT}
                </Text>

                {hasInput && (
                    <Text className={twMerge(
                        "text-[11px] uppercase tracking-widest font-satoshi",
                        score === 4 ? "text-forest font-bold" : "text-forest/40 font-medium"
                    )}>
                        {STRENGTH_LABELS[score]}
                    </Text>
                )}
            </View>
        </View>
    );
}
