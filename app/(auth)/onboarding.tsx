
import React, { useRef, useState } from 'react';
import { View, FlatList, ViewToken, Text } from 'react-native';
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
        <View className="flex-1 bg-[#F6F6F1]">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            <View className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#EEF1EA]" />
            <View className="absolute -right-24 bottom-28 h-80 w-80 rounded-full bg-[#F0F2ED]" />

            <View className="px-7 pt-14">
                <Text className="font-satoshi text-[12px] uppercase tracking-[2.4px] text-[#7D7668]">
                    Steady progress, without pressure
                </Text>
            </View>

            <View className="flex-[3.35]">
                <Animated.FlatList
                    data={ONBOARDING_DATA}
                    renderItem={({ item, index }: { item: OnboardingItem; index: number }) => (
                        <OnboardingSlide item={item} index={index} totalSlides={ONBOARDING_DATA.length} />
                    )}
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

            <View className="flex-1 justify-end px-7 pb-10">
                <View className="border-t border-[#D9DDD5] pt-5">
                    <Text className="max-w-[290px] font-satoshi text-[14px] leading-6 text-[#5E584E]">
                        Calm guidance, structured programs, and a clearer daily rhythm from your very first session.
                    </Text>
                </View>

                <View className="mt-7 flex-row items-center justify-between">
                    <Paginator data={ONBOARDING_DATA} scrollX={scrollX} />
                    <Text className="font-satoshi text-[12px] tracking-[1.3px] text-[#8A8478]">
                        Swipe or continue
                    </Text>
                </View>

                <View className="mt-6 items-end">
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
