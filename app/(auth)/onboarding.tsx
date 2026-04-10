import React, { useRef, useState } from 'react';
import { View, FlatList, ViewToken, Text, StyleSheet } from 'react-native';
import { Stack, useRouter, Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ONBOARDING_DATA, OnboardingItem } from '@/components/onboarding/onboardingData';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { Paginator } from '@/components/onboarding/Paginator';
import { NextButton } from '@/components/onboarding/NextButton';
import { AppStorage } from '@/lib/storage';
import { AppColors } from '@/constants/theme';

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useSharedValue(0);
    const slidesRef = useRef<FlatList<OnboardingItem>>(null);
    const router = useRouter();
    const insets = useSafeAreaInsets();

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
                router.replace('/sign-in' as Href);
            } catch (err) {
                console.log('Error @setItem: ', err);
            }
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
                <Text style={styles.headerSubtitle}>
                    Recovery Compass
                </Text>
            </View>

            <View style={styles.sliderContainer}>
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

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
                <View style={styles.bottomControls}>
                    <Paginator data={ONBOARDING_DATA} scrollX={scrollX} />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    header: {
        paddingHorizontal: 32,
        paddingTop: 56,
        paddingBottom: 24,
    },
    headerSubtitle: {
        fontFamily: 'Satoshi-Bold',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 2.4,
        color: AppColors.iconMuted,
    },
    sliderContainer: {
        flex: 1,
    },
    footer: {
        paddingHorizontal: 32,
    },
    bottomControls: {
        marginTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
