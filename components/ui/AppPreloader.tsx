import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { AppColors } from '@/constants/theme';
import { markFirstLaunchComplete } from '@/lib/preloader-state';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Module-level flag — persists across hot-reloads within the same JS session.
let hasSeenPreloader = false;

interface AppPreloaderProps {
  isNavigationReady: boolean;
  isAuthenticated: boolean;
}

export function AppPreloader({ isNavigationReady, isAuthenticated }: AppPreloaderProps) {
  const [isVisible, setIsVisible] = useState(!hasSeenPreloader);
  const animationStarted = useRef(false);

  // Shared values — always declared unconditionally (Rules of Hooks).
  const opacity = useSharedValue(1);
  const logoScale = useSharedValue(1);
  const logoOpacity = useSharedValue(1);
  const textWidth = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const curtainTranslateY = useSharedValue(0);

  // ─── Step 1: Hide the native splash immediately on mount ─────────────────
  useEffect(() => {
    if (hasSeenPreloader) return;
    void SplashScreen.hideAsync();
  }, []);

  // ─── Step 2: Start the animation once fonts + auth are ready ─────────────
  useEffect(() => {
    if (!isNavigationReady || hasSeenPreloader || animationStarted.current) return;
    animationStarted.current = true;

    const completePreloader = () => {
      hasSeenPreloader = true;
      markFirstLaunchComplete();
      setIsVisible(false);
    };

    // Logo: breathe in (scale up) → settle back to 1
    logoScale.value = withSequence(
      withTiming(1.4, { duration: 2100, easing: Easing.bezier(0.76, 0, 0.24, 1) }),
      withTiming(1, { duration: 1400, easing: Easing.bezier(0.76, 0, 0.24, 1) })
    );

    // Text: reveal after the logo peaks
    textWidth.value = withDelay(
      2100,
      withTiming(1, { duration: 1400, easing: Easing.bezier(0.76, 0, 0.24, 1) })
    );
    textOpacity.value = withDelay(
      2100,
      withTiming(1, { duration: 1400, easing: Easing.bezier(0.76, 0, 0.24, 1) })
    );

    // ─── Exit animation ────────────────────────────────────────────────────
    if (!isAuthenticated) {
      // "Curtain slide" — the green screen lifts upward to reveal the welcome screen.
      curtainTranslateY.value = withDelay(
        4000,
        withTiming(-SCREEN_HEIGHT, {
          duration: 900,
          easing: Easing.bezier(0.76, 0, 0.24, 1),
        }, (finished) => {
          if (finished) runOnJS(completePreloader)();
        })
      );
    } else {
      // Simple dissolve for authenticated users heading to the dashboard.
      opacity.value = withDelay(
        4500,
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }, (finished) => {
          if (finished) runOnJS(completePreloader)();
        })
      );
    }
  }, [
    curtainTranslateY,
    isAuthenticated,
    isNavigationReady,
    logoScale,
    opacity,
    textOpacity,
    textWidth,
  ]);

  // ─── Animated styles — always computed, never conditional ────────────────
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: curtainTranslateY.value }],
    // Rounded bottom edge appears as the curtain starts lifting
    borderBottomLeftRadius: interpolate(
      curtainTranslateY.value,
      [0, -120],
      [0, 28],
      'clamp'
    ),
    borderBottomRightRadius: interpolate(
      curtainTranslateY.value,
      [0, -120],
      [0, 28],
      'clamp'
    ),
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    width: textWidth.value * 280,
    opacity: textOpacity.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('@/assets/images/rc-logo-white.svg')}
            style={styles.logo}
            contentFit="contain"
            priority="high"
          />
        </Animated.View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Animated.Text style={styles.text} numberOfLines={1}>
            Recovery Compass
          </Animated.Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.forest,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Erode-Medium',
    fontSize: 32,
    color: '#ffffff',
    paddingLeft: 16,
    paddingTop: 4,
    includeFontPadding: false,
  },
});
