import { StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppColors } from '@/constants/theme';

export default function JournalScreen() {
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: AppColors.sage, dark: AppColors.darkNeutralSurface }}
            headerImage={
                <IconSymbol
                    size={310}
                    color={AppColors.parallaxIcon}
                    name="book.fill"
                    style={styles.headerImage}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Journal</ThemedText>
            </ThemedView>
            <ThemedText>Trace your emotional landscape.</ThemedText>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    headerImage: {
        color: AppColors.parallaxIcon,
        bottom: -90,
        left: -35,
        position: 'absolute',
    },
    titleContainer: {
        flexDirection: 'row',
        gap: 8,
    },
});
