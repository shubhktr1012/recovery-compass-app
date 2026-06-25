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
const LOGO_REVEAL_DURATION = 1050;
const TEXT_REVEAL_DURATION = 700;
const GUEST_EXIT_DELAY = 1800;
const AUTHENTICATED_EXIT_DELAY = 1950;

// Module-level guard: once a preloader run starts, remounts in the same JS session should not replay it.
let hasPreloaderRun = false;

interface AppPreloaderProps {
  isNavigationReady: boolean;
  isAuthenticated: boolean;
  onHidden?: () => void;
}

export function AppPreloader({ isNavigationReady, isAuthenticated, onHidden }: AppPreloaderProps) {
  const [isVisible, setIsVisible] = useState(!hasPreloaderRun);
  const animationStarted = useRef(false);
  const hasReportedHidden = useRef(false);

  // Shared values — always declared unconditionally (Rules of Hooks).
  const opacity = useSharedValue(1);
  const logoScale = useSharedValue(1);
  const logoOpacity = useSharedValue(1);
  const textWidth = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const curtainTranslateY = useSharedValue(0);

  // ─── Step 1: Hide the native splash immediately on mount ─────────────────
  useEffect(() => {
    if (hasPreloaderRun) return;
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (isVisible || hasReportedHidden.current) return;
    hasReportedHidden.current = true;
    onHidden?.();
  }, [isVisible, onHidden]);

  // ─── Step 2: Start the animation once fonts + auth are ready ─────────────
  useEffect(() => {
    if (!isNavigationReady || hasPreloaderRun || animationStarted.current) return;
    animationStarted.current = true;
    hasPreloaderRun = true;

    const completePreloader = () => {
      markFirstLaunchComplete();
      setIsVisible(false);
    };

    // Logo: breathe in (scale up) → settle back to 1
    logoScale.value = withSequence(
      withTiming(1.4, { duration: LOGO_REVEAL_DURATION, easing: Easing.bezier(0.76, 0, 0.24, 1) }),
      withTiming(1, { duration: TEXT_REVEAL_DURATION, easing: Easing.bezier(0.76, 0, 0.24, 1) })
    );

    // Text: reveal after the logo peaks
    textWidth.value = withDelay(
      LOGO_REVEAL_DURATION,
      withTiming(1, { duration: TEXT_REVEAL_DURATION, easing: Easing.bezier(0.76, 0, 0.24, 1) })
    );
    textOpacity.value = withDelay(
      LOGO_REVEAL_DURATION,
      withTiming(1, { duration: TEXT_REVEAL_DURATION, easing: Easing.bezier(0.76, 0, 0.24, 1) })
    );

    // ─── Exit animation ────────────────────────────────────────────────────
    if (!isAuthenticated) {
      // "Curtain slide" — the green screen lifts upward to reveal the welcome screen.
      curtainTranslateY.value = withDelay(
        GUEST_EXIT_DELAY,
        withTiming(-SCREEN_HEIGHT, {
          duration: 450,
          easing: Easing.bezier(0.76, 0, 0.24, 1),
        }, (finished) => {
          if (finished) runOnJS(completePreloader)();
        })
      );
    } else {
      // Simple dissolve for authenticated users heading to the dashboard.
      opacity.value = withDelay(
        AUTHENTICATED_EXIT_DELAY,
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }, (finished) => {
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
