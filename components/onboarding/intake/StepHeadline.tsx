import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StepHeadlineProps {
  title: string;
  description?: string;
  /** 'serif' for emotional / deep questions, 'sans' for utility steps */
  variant?: 'serif' | 'sans';
}

export function StepHeadline({ title, description, variant = 'serif' }: StepHeadlineProps) {
  return (
    <View style={styles.wrap}>
      <Text style={variant === 'serif' ? styles.titleSerif : styles.titleSans}>
        {title}
      </Text>
      {description ? (
        <Text style={styles.support}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    marginBottom: 24,
  },
  titleSerif: {
    fontFamily: 'Erode-Medium',
    fontSize: 30,
    lineHeight: 30 * 1.15,
    letterSpacing: -0.02 * 30,
    color: '#06290C', // forest
  },
  titleSans: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 24,
    lineHeight: 24 * 1.2,
    letterSpacing: -0.02 * 24,
    color: '#06290C', // forest
  },
  support: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 14 * 1.55,
    color: 'rgba(6,41,12,0.45)', // subtle-ink
    marginTop: 10,
  },
});
