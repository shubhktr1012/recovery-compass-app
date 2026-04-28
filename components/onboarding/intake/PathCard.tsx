import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

interface PathCardProps {
  title: string;
  description?: string;
  /** Ionicons icon name — replaces emoji for cross-platform consistency */
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}

export function PathCard({ title, description, icon, selected, onPress }: PathCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {/* Icon badge */}
      {icon ? (
        <View style={[styles.iconBadge, selected && styles.iconBadgeSelected]}>
          <Ionicons name={icon} size={18} color={selected ? '#06290C' : 'rgba(6,41,12,0.45)'} />
        </View>
      ) : null}

      {/* Body */}
      <View style={styles.body}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>

      {/* Check circle */}
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected && (
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(6,41,12,0.07)', // hairline
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    // --card-shadow
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: '#EEF6EF', // sage-soft
    borderColor: 'rgba(6,41,12,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F5F5F7', // surface
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBadgeSelected: {
    backgroundColor: 'rgba(6,41,12,0.07)',
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#06290C', // forest
    lineHeight: 15 * 1.3,
  },
  titleSelected: {
    color: '#06290C',
  },
  desc: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: 'rgba(6,41,12,0.45)', // subtle-ink
    marginTop: 4,
    lineHeight: 12 * 1.5,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(6,41,12,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkSelected: {
    backgroundColor: '#06290C',
    borderColor: '#06290C',
  },
});
