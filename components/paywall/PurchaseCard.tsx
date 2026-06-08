import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { PressableScale } from '@/components/motion/PressableScale';
import { MotionScale } from '@/lib/motion/tokens';

// ─── Brand tokens ────────────────────────────────────────────────────────────
const F = {
  forest: '#06290C',
  sage: '#E3F3E5',
  canvas: '#FFFFFF',
};

// ─── Check circle for multi-option cards ─────────────────────────────────────

function CheckCircle({ isSelected }: { isSelected: boolean }) {
  return (
    <View
      style={[
        styles.check,
        isSelected && styles.checkOn,
      ]}
    >
      {isSelected && (
        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
          <Polyline
            points="20,6 9,17 4,12"
            stroke="#FFFFFF" strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseCardProps {
  programName: string;
  description: string;
  priceString: string;
  isSelected: boolean;
  showCheckCircle: boolean;
  onPress: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PurchaseCard({
  programName,
  description,
  priceString,
  isSelected,
  showCheckCircle,
  onPress,
}: PurchaseCardProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      pressScale={MotionScale.pressLarge}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
    >
      {/* Upper body */}
      <View style={styles.body} collapsable={false}>
        <View style={styles.topRow} collapsable={false}>
          <View style={styles.nameRow} collapsable={false}>
            <Text style={styles.name}>{programName}</Text>
          </View>
          {showCheckCircle && <CheckCircle isSelected={isSelected} />}
        </View>
        <Text style={styles.desc}>{description}</Text>
      </View>

      {/* Price strip */}
      <View style={[styles.priceStrip, isSelected && styles.priceStripSelected]} collapsable={false}>
        <Text style={styles.price}>{priceString}</Text>
        <View style={styles.priceRight}>
          <Text style={styles.priceMetaText}>One-time, no subscription</Text>
        </View>
      </View>
    </PressableScale>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: F.canvas,
    borderWidth: 1.5,
    borderColor: 'rgba(6,41,12,0.08)',
    borderRadius: 20,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: 'rgba(6,41,12,0.18)',
    borderLeftWidth: 3,
    borderLeftColor: F.forest,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginRight: 8,
  },
  name: {
    fontFamily: 'Satoshi-SemiBold',
    fontSize: 15,
    color: F.forest,
    lineHeight: 18,
    letterSpacing: -0.15,
    marginRight: 8,
  },

  desc: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 18.6,
    color: 'rgba(6,41,12,0.45)', // subtle-ink
  },

  // ── Price strip ──
  priceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6,41,12,0.05)',
    backgroundColor: 'rgba(6,41,12,0.015)',
  },
  priceStripSelected: {
    backgroundColor: 'rgba(6,41,12,0.025)',
  },
  price: {
    fontFamily: 'Erode-Medium',
    fontSize: 26,
    letterSpacing: -0.65,
    lineHeight: 28,
    color: F.forest,
  },
  priceRight: {
    alignItems: 'flex-end',
  },
  priceMetaText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    color: 'rgba(6,41,12,0.45)', // subtle-ink
  },

  // ── Check circle ──
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(6,41,12,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginTop: 1,
  },
  checkOn: {
    backgroundColor: F.forest,
    borderColor: F.forest,
  },
});
