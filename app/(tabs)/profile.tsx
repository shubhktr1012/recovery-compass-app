import { StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppColors } from '@/constants/theme';

export default function ProfileScreen() {
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: AppColors.sage, dark: AppColors.darkNeutralSurface }}
            headerImage={
                <IconSymbol
                    size={310}
                    color={AppColors.parallaxIcon}
                    name="person.fill"
                    style={styles.headerImage}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Profile</ThemedText>
            </ThemedView>
            <ThemedText>Manage your settings and account.</ThemedText>
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
