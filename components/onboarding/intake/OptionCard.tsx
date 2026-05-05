import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface OptionCardProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionCard({ label, sublabel, selected, onPress }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {/* Check circle */}
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected && (
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(6,41,12,0.07)', // hairline
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // --card-shadow dominant layer
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: '#E3F2E5', // sage-soft
    borderColor: 'rgba(6,41,12,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(6,41,12,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  checkSelected: {
    backgroundColor: '#06290C', // forest
    borderColor: '#06290C',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: 'rgba(6,41,12,0.62)', // muted-ink
    lineHeight: 14 * 1.3,
  },
  labelSelected: {
    fontFamily: 'Satoshi-Medium',
    color: '#06290C', // forest
  },
  sublabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: 'rgba(6,41,12,0.45)', // subtle-ink
    marginTop: 3,
    lineHeight: 11 * 1.4,
  },
});
