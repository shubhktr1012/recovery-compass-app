import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface GenderSegmentProps {
  options: readonly string[];
  selected: string;
  onSelect: (value: string) => void;
}

export function GenderSegment({ options, selected, onSelect }: GenderSegmentProps) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <Pressable
            key={option}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#F5F5F7', // surface
    borderRadius: 999,
    padding: 3,
    flexDirection: 'row',
    gap: 0,
    marginBottom: 10,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 44,
    borderRadius: 999,
  },
  optionSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  optionText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: 'rgba(6,41,12,0.45)', // subtle-ink
    letterSpacing: -0.005 * 13,
  },
  optionTextSelected: {
    color: '#06290C', // forest
  },
});
