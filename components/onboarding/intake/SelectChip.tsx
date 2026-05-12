import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function SelectChip({ label, selected, onPress }: SelectChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(6,41,12,0.08)',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chipSelected: {
    backgroundColor: '#E3F3E5', // sage
    borderColor: 'rgba(6,41,12,0.15)',
  },
  text: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: 'rgba(6,41,12,0.60)',
  },
  textSelected: {
    fontFamily: 'Satoshi-Medium',
    color: '#06290C', // forest
  },
});
