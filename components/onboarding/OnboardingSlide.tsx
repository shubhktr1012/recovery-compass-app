import React from 'react';
import { View, Text, useWindowDimensions, StyleSheet } from 'react-native';
import { OnboardingItem } from './onboardingData';
import { AppColors } from '@/constants/theme';

interface OnboardingSlideProps {
    item: OnboardingItem;
    index: number;
    totalSlides: number;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ item, index, totalSlides }) => {
    const { width } = useWindowDimensions();

    return (
        <View style={[styles.slideContainer, { width }]}>
            <View style={styles.upperContent}>
                <Text style={styles.eyebrowText}>{item.eyebrow}</Text>
                <Text style={styles.titleText}>{item.title}</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>
            </View>

            <View style={styles.lowerVisual}>
                {/* Cinematic, minimal, typography-driven visual instead of heavy generic shapes */}
                <Text style={styles.watermarkNumber}>{String(index + 1).padStart(2, '0')}</Text>
                <View style={styles.quoteContainer}>
                    <Text style={styles.quoteText}>{item.accent}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    slideContainer: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 8,
        justifyContent: 'space-between',
    },
    upperContent: {
        marginTop: 24,
    },
    eyebrowText: {
        fontFamily: 'Satoshi-Bold',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 2.4,
        color: AppColors.iconMuted,
        marginBottom: 20,
    },
    titleText: {
        fontFamily: 'Erode-Bold',
        fontSize: 48,
        lineHeight: 56,
        color: AppColors.forest,
        marginBottom: 24,
    },
    descriptionText: {
        fontFamily: 'Satoshi-Regular',
        fontSize: 16,
        lineHeight: 28,
        color: AppColors.forest,
        opacity: 0.8,
        maxWidth: '90%',
    },
    lowerVisual: {
        height: 260,
        position: 'relative',
        justifyContent: 'center',
        paddingLeft: 16,
    },
    watermarkNumber: {
        position: 'absolute',
        top: 20,
        left: -8,
        fontFamily: 'Erode-Regular',
        fontSize: 160,
        color: AppColors.sage,
        opacity: 0.25,
        letterSpacing: -6,
    },
    quoteContainer: {
        borderLeftWidth: 1,
        borderLeftColor: AppColors.forest,
        paddingLeft: 24,
        zIndex: 2, // Keeps text strictly above the watermark
    },
    quoteText: {
        fontFamily: 'Erode-Regular',
        fontSize: 22,
        lineHeight: 32,
        color: AppColors.forest,
    },
});
