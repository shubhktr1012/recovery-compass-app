import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FocusPillProps {
  text: string;
}

export function FocusPill({ text }: FocusPillProps) {
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#E3F2E5', // sage-soft
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: 'rgba(6,41,12,0.62)', // muted-ink
    lineHeight: 11 * 1.4,
  },
});
