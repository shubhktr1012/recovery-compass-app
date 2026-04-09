import React from 'react';
import { Text } from 'react-native';

interface StepPillProps {
  label: string;
}

export function StepPill({ label }: StepPillProps) {
  return (
    <Text 
      className="font-satoshi-bold text-[10px] uppercase tracking-[2.4px] text-forest/35"
      style={{ includeFontPadding: false }}
    >
      {label}
    </Text>
  );
}
