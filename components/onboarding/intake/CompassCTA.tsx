import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface CompassCTAProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'highlight';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CompassCTA({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: CompassCTAProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(disabled ? 0.4 : 1, { duration: 200 }),
  }));

  const isPrimary = variant === 'primary' || variant === 'highlight';

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        animatedStyle,
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        variant === 'highlight' && styles.highlight,
        disabled && isPrimary && styles.primaryDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? 'white' : '#06290C'} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.textPrimary : styles.textSecondary,
            disabled && isPrimary && styles.textPrimaryDisabled,
          ]}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: '#06290C', // forest
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  secondary: {
    backgroundColor: '#F5F5F7', // surface
    borderWidth: 1,
    borderColor: 'rgba(6,41,12,0.10)',
  },
  highlight: {
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 20,
  },
  primaryDisabled: {
    backgroundColor: 'rgba(6,41,12,0.12)',
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    letterSpacing: -0.005 * 15,
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: '#06290C',
  },
  textPrimaryDisabled: {
    color: 'rgba(6,41,12,0.30)',
  },
});
