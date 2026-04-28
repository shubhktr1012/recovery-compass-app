import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { CompassCTA } from '@/components/onboarding/intake/CompassCTA';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StickyCtaFooterProps {
  ctaLabel: string;
  onPurchase: () => void;
  onRestore: () => void;
  loading: boolean;
  disabled: boolean;
  insetBottom: number;
}

// ─── Helper: open link ───────────────────────────────────────────────────────

function openLink(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Unable to open link', 'Please try again in a moment.');
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StickyCtaFooter({
  ctaLabel,
  onPurchase,
  onRestore,
  loading,
  disabled,
  insetBottom,
}: StickyCtaFooterProps) {
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insetBottom, 12) + 12 }]}>
      {/* Gradient fade at top */}
      <LinearGradient
        colors={['rgba(245,245,247,0)', 'rgba(245,245,247,1)']}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* CTA */}
      <View style={styles.content}>
        <CompassCTA
          label={ctaLabel}
          onPress={onPurchase}
          loading={loading}
          disabled={disabled}
          variant="highlight"
        />

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.onetimeRow}>
            <View style={styles.greenDot} />
            <Text style={styles.metaText}>One-time payment</Text>
          </View>
          <Pressable onPress={onRestore} disabled={loading} hitSlop={20}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </Pressable>
        </View>

        {/* Legal copy */}
        <Text style={styles.legal}>
          Continuing means you accept our{' '}
          <Text
            style={styles.legalLink}
            onPress={() => openLink('https://recoverycompass.co/terms')}
          >
            Terms
          </Text>
          {' '}and{' '}
          <Text
            style={styles.legalLink}
            onPress={() => openLink('https://recoverycompass.co/privacy')}
          >
            Privacy Policy
          </Text>
          .{'\n'}No recurring charges, ever.
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  gradient: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  content: {
    backgroundColor: '#F5F5F7', // surface
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 11,
    marginBottom: 7,
  },
  onetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3a8a4a',
  },
  metaText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: 'rgba(6,41,12,0.62)', // muted-ink
  },
  restoreText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: 'rgba(6,41,12,0.45)', // subtle-ink
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(6,41,12,0.15)',
  },
  legal: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 10,
    lineHeight: 15.5,
    color: 'rgba(6,41,12,0.28)', // faint-ink
    textAlign: 'center',
  },
  legalLink: {
    color: 'rgba(6,41,12,0.45)', // subtle-ink
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(6,41,12,0.18)',
  },
});
