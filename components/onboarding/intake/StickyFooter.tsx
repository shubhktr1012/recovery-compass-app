import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompassCTA } from './CompassCTA';

interface StickyFooterProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function StickyFooter({ label, onPress, disabled, loading }: StickyFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 32) }]}>
      <CompassCTA
        label={label}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFFFFF', // canvas to match StepContainer
    paddingHorizontal: 24,
  },
});
