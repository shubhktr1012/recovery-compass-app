import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PressableScale } from '@/components/motion/PressableScale';
import { MotionScale } from '@/lib/motion/tokens';

interface FreeDetoxOfferCardProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function FreeDetoxOfferCard({ onPress, disabled = false, loading = false }: FreeDetoxOfferCardProps) {
  return (
    <View style={styles.footnote}>
      <Text style={styles.note}>
        Every program includes the Free Detox Program as a bonus.
      </Text>
      <PressableScale
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel="Try the Free Detox Program"
        pressScale={MotionScale.press}
        style={[styles.linkRow, (disabled || loading) && styles.linkRowDisabled]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="rgba(6, 41, 12, 0.45)" />
        ) : (
          <>
            <Text style={styles.linkLabel}>Try the Free Detox Program</Text>
            <Ionicons name="chevron-forward" size={12} color="rgba(6, 41, 12, 0.45)" />
          </>
        )}
      </PressableScale>
    </View>
  );
}

export function FreeDetoxHeaderCta({
  onPress,
  disabled = false,
  loading = false,
}: FreeDetoxOfferCardProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel="Try the Free Detox Program"
      pressScale={MotionScale.press}
      style={[styles.headerCta, (disabled || loading) && styles.headerCtaDisabled]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#06290C" />
      ) : (
        <>
          <Ionicons name="leaf" size={12} color="#06290C" style={styles.headerIcon} />
          <Text style={styles.headerLabel}>Try Free</Text>
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  footnote: {
    marginTop: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  note: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(6, 41, 12, 0.38)',
    textAlign: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  linkRowDisabled: {
    opacity: 0.55,
  },
  linkLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: 'rgba(6, 41, 12, 0.52)',
  },
  headerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: '#E3F3E5',
    borderWidth: 1,
    borderColor: 'rgba(6, 41, 12, 0.14)',
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCtaDisabled: {
    opacity: 0.58,
  },
  headerIcon: {
    marginRight: 5,
  },
  headerLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    color: '#06290C',
    letterSpacing: -0.06,
  },
});
