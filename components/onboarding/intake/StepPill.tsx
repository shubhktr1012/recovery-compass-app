import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface StepPillProps {
  label: string;
}

export function StepPill({ label }: StepPillProps) {
  return (
    <Text style={styles.eyebrow}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    letterSpacing: 9 * 0.22,
    color: 'rgba(6,41,12,0.32)',
    textTransform: 'uppercase',
    marginBottom: 10,
    includeFontPadding: false,
  },
});
