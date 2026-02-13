
import React, { useRef, useState } from 'react';
import { View, FlatList, ViewToken } from 'react-native';
import { Stack, useRouter, Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { ONBOARDING_DATA, OnboardingItem } from '@/components/onboarding/onboardingData';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { Paginator } from '@/components/onboarding/Paginator';
import { NextButton } from '@/components/onboarding/NextButton';
import { AppStorage } from '@/lib/storage';

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useSharedValue(0);
    const slidesRef = useRef<FlatList<OnboardingItem>>(null);
    const router = useRouter();
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems[0] && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollTo = async () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            try {
                await AppStorage.setItem('hasSeenOnboarding', 'true');
                router.replace('/sign-in' as Href); // Or wherever Auth starts
            } catch (err) {
                console.log('Error @setItem: ', err);
            }
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-background">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            <View className="flex-[3]">
                <Animated.FlatList
                    data={ONBOARDING_DATA}
                    renderItem={({ item }: { item: OnboardingItem }) => <OnboardingSlide item={item} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                />
            </View>

            <View className="flex-1 justify-center items-center w-full">
                <Paginator data={ONBOARDING_DATA} scrollX={scrollX} />
                <View className="mt-8">
                    <NextButton
                        scrollTo={scrollTo}
                        currentIndex={currentIndex}
                        totalSlides={ONBOARDING_DATA.length}
                    />
                </View>
            </View>
        </View>
    );
}
