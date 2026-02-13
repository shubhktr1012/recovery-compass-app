
import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { OnboardingItem } from './onboardingData';

interface OnboardingSlideProps {
    item: OnboardingItem;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ item }) => {
    const { width } = useWindowDimensions();

    return (
        <View style={{ width }} className="flex-1 justify-center items-center px-8">
            {/* Placeholder for Image/Illustration */}
            <View className="w-[80%] aspect-square bg-secondary rounded-full mb-12 items-center justify-center shadow-sm">
                <Text className="text-primary font-serif text-6xl opacity-20">{item.title.charAt(0)}</Text>
            </View>

            <View className="items-center space-y-4">
                <Text className="text-primary font-serif text-4xl text-center leading-tight">
                    {item.title}
                </Text>
                <Text className="text-primary/70 font-sans text-lg text-center leading-relaxed px-4">
                    {item.description}
                </Text>
            </View>
        </View>
    );
};
