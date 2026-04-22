import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export interface TransportBarProps {
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  disabled?: boolean;
  prevLabel?: string;
  nextLabel?: string;

  centerIcon: React.ReactNode;
  centerLabel?: string;
  onCenterPress?: () => void;
}

/**
 * TransportBar — Spotify / Apple Music style playback controller.
 *
 * Layout (flexbox, no absolute positioning):
 *   ┌──────────────────────────────────────────────┐
 *   │  [←]     contextual label      [→]          │
 *   │  Prev    [  ● CENTER ●  ]      Next         │
 *   └──────────────────────────────────────────────┘
 *
 * The three columns are equal-width (flex: 1) so the center
 * button is always perfectly centered regardless of label width.
 */
export function TransportBar({
  onPrev,
  onNext,
  hasPrev = true,
  hasNext = true,
  disabled = false,
  prevLabel = 'PREV',
  nextLabel = 'NEXT',
  centerIcon,
  centerLabel,
  onCenterPress,
}: TransportBarProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={24} tint="dark" style={styles.pill}>
        <View style={styles.row}>

          {/* ── LEFT: Prev ────────────────────────── */}
          <View style={styles.sideColumn}>
            <Pressable
              onPress={hasPrev ? onPrev : undefined}
              style={[styles.sideBtn, hasPrev ? styles.sideBtnActive : styles.sideBtnInactive]}
              accessibilityLabel="Previous card"
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={hasPrev ? 'rgba(227,243,229,0.95)' : 'rgba(227,243,229,0.25)'}
              />
            </Pressable>
            <Text style={[styles.sideLabel, !hasPrev && styles.sideLabelInactive]}>{prevLabel}</Text>
          </View>

          {/* ── CENTER: Primary action ─────────────── */}
          <View style={styles.centerColumn}>
            <Pressable
              onPress={disabled ? undefined : onCenterPress}
              style={[styles.centerBtn, disabled && styles.centerBtnDisabled]}
              accessibilityLabel={centerLabel ?? 'Continue'}
            >
              {centerIcon}
            </Pressable>
            {centerLabel ? (
              <Text style={styles.centerLabel}>{centerLabel}</Text>
            ) : null}
          </View>

          {/* ── RIGHT: Next ───────────────────────── */}
          <View style={styles.sideColumn}>
            <Pressable
              onPress={hasNext ? onNext : undefined}
              style={[styles.sideBtn, hasNext ? styles.sideBtnActive : styles.sideBtnInactive]}
              accessibilityLabel="Next card"
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={hasNext ? 'rgba(227,243,229,0.95)' : 'rgba(227,243,229,0.25)'}
              />
            </Pressable>
            <Text style={[styles.sideLabel, !hasNext && styles.sideLabelInactive]}>{nextLabel}</Text>
          </View>

        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer wrapper — sits at the bottom of the screen
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 10,
  },

  // Frosted glass pill — no border, clean
  pill: {
    backgroundColor: 'rgba(6,41,12,0.85)',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(227,243,229,0.08)',
  },

  // The three-column row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  // ── Side columns ──────────────────────────────────────────────
  sideColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Available: a soft translucent fill
  sideBtnActive: {
    backgroundColor: 'rgba(227,243,229,0.08)',
  },
  sideBtnInactive: {
    backgroundColor: 'transparent',
    opacity: 0.3,
  },

  // ── Center column ─────────────────────────────────────────────
  centerColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  centerLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(227,243,229,0.6)',
    marginTop: 6,
  },
  sideLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(227,243,229,0.3)',
    marginTop: 4,
  },
  sideLabelInactive: {
    color: 'rgba(227,243,229,0.1)',
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Elevated shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  centerBtnDisabled: {
    opacity: 0.4,
  },
});
