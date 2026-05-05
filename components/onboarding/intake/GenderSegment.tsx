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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  option: {
    minWidth: 96,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: 'rgba(6,41,12,0.07)',
  },
  optionSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(6,41,12,0.16)',
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  optionText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: 'rgba(6,41,12,0.45)', // subtle-ink
    lineHeight: 18,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#06290C', // forest
  },
});
