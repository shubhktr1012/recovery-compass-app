import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '@/constants/theme';
import { useTabBarScrollMetrics } from '@/components/navigation/TabBarMetricsProvider';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';

const CANVAS_FADE = AppColors.canvas;

export function TabBarScrollFade() {
  const { overlayHeight } = useTabBarScrollMetrics();
  const keyboardVisible = useKeyboardVisible();

  if (keyboardVisible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.overlay, { height: overlayHeight }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)', CANVAS_FADE]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 49,
  },
});
