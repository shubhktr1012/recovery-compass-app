import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppColors } from '@/constants/theme';
import { AppTypography } from '@/constants/typography';
import { HOME_ROUTE } from '@/lib/navigation/routes';

type RouteStateScreenProps = {
  actionHref?: Href;
  actionLabel?: string;
  message: string;
  title: string;
};

export function RouteLoadingState({
  message = 'Preparing your recovery space.',
  title = 'Loading',
}: Partial<Pick<RouteStateScreenProps, 'message' | 'title'>>) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ActivityIndicator color={AppColors.forest} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

export function RouteErrorState({
  actionHref = HOME_ROUTE,
  actionLabel = 'Go Home',
  message,
  title,
}: RouteStateScreenProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.notice}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(actionHref)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    backgroundColor: AppColors.forest,
    borderRadius: 999,
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  buttonText: {
    ...AppTypography.buttonSm,
    color: AppColors.white,
  },
  container: {
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  message: {
    ...AppTypography.bodyCompact,
    color: AppColors.mutedInk,
    marginTop: 8,
    maxWidth: 300,
    textAlign: 'center',
  },
  notice: {
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderColor: AppColors.hairline,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  title: {
    ...AppTypography.bodyStrong,
    color: AppColors.forest,
    marginTop: 16,
    textAlign: 'center',
  },
});
