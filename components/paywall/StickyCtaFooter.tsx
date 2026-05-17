import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Alert } from 'react-native';

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
  const footerBottomPadding = Math.max(insetBottom, 12) + 12;

  return (
    <View style={styles.container}>

      {/* CTA */}
      <View style={[styles.content, { paddingBottom: footerBottomPadding }]}>
        <CompassCTA
          label={ctaLabel}
          onPress={onPurchase}
          loading={loading}
          disabled={disabled}
          variant="white"
        />

        {/* Meta row */}
        <View style={styles.metaRow}>
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
          .
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
    backgroundColor: '#06290C', // forest
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    // Shadow so it lifts off the page content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 9,
    marginBottom: 7,
  },
  restoreText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.40)',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.18)',
  },
  legal: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 10,
    lineHeight: 15.5,
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'center',
  },
  legalLink: {
    color: 'rgba(255,255,255,0.50)',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.20)',
  },
});
