import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { ProgressLine } from './ProgressLine';

interface StepContainerProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBack?: boolean;
  /** Hide progress region entirely (e.g. recommendation step) */
  showProgress?: boolean;
}

export function StepContainer({
  children,
  footer,
  currentStep,
  totalSteps,
  onBack,
  showBack = true,
  showProgress = true,
}: StepContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* ── Progress region ────────────────────────────────── */}
      {showProgress && (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          {/* Single row: back · track · step count */}
          <View style={styles.navRow}>
            {showBack && onBack ? (
              <Pressable
                onPress={onBack}
                hitSlop={12}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18l-6-6 6-6" stroke="rgba(6,41,12,0.35)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Pressable>
            ) : (
              <View style={styles.backPlaceholder} />
            )}

            <View style={styles.trackWrap}>
              <ProgressLine currentStep={currentStep} totalSteps={totalSteps} />
            </View>

            <Text style={styles.stepCount}>
              {currentStep + 1} of {totalSteps}
            </Text>
          </View>
        </View>
      )}

      {/* Spacer when progress is hidden (still need safe area) */}
      {!showProgress && (
        <View style={{ height: insets.top + 16 }} />
      )}

      {/* ── Scrollable content ─────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: footer ? 120 : insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {/* ── Sticky footer with gradient fade ───────────────── */}
      {footer && (
        <View style={[styles.footerWrap, { paddingBottom: Math.max(insets.bottom, 28) }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
            style={styles.footerGradient}
            pointerEvents="none"
          />
          <View style={styles.footerInner}>
            {footer}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF', // canvas white per spec
  },

  /* ── Header / progress region ── */
  header: {
    paddingHorizontal: 24,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E3F2E5', // sage-soft
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backPlaceholder: {
    width: 30,
    height: 30,
    flexShrink: 0,
  },
  trackWrap: {
    flex: 1,
  },
  stepCount: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: 'rgba(6,41,12,0.32)', // faint-ink
    letterSpacing: 11 * 0.03,
    flexShrink: 0,
  },

  /* ── Scroll ── */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },

  /* ── Footer ── */
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerGradient: {
    height: 40,
  },
  footerInner: {
    paddingHorizontal: 24,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
  },
});
