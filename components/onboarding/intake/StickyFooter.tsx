import React from 'react';
import { View } from 'react-native';
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
    <View 
      className="absolute bottom-0 w-full bg-surface px-6"
      style={{ paddingBottom: Math.max(insets.bottom, 32) }}
    >
      <CompassCTA 
        label={label}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
      />
    </View>
  );
}
