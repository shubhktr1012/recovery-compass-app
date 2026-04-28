import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WhyFitsCardProps {
  text: string;
}

export function WhyFitsCard({ text }: WhyFitsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>WHY THIS FITS</Text>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F7', // surface
    borderRadius: 20,
    padding: 18,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(6,41,12,0.12)',
  },
  eyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    letterSpacing: 9 * 0.22,
    color: 'rgba(6,41,12,0.35)',
    marginBottom: 8,
  },
  body: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: 'rgba(6,41,12,0.62)', // muted-ink
    lineHeight: 13 * 1.65,
  },
});
