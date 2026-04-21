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
                size={18}
                color={hasPrev ? 'rgba(227,243,229,0.95)' : 'rgba(227,243,229,0.25)'}
              />
            </Pressable>
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
                size={18}
                color={hasNext ? 'rgba(227,243,229,0.95)' : 'rgba(227,243,229,0.25)'}
              />
            </Pressable>
          </View>

        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer wrapper — sits at the bottom of the screen
  container: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 10,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 10,
  },

  // Frosted glass pill — no border, clean
  pill: {
    backgroundColor: 'rgba(6,41,12,0.75)',
    borderRadius: 999,
    overflow: 'hidden',
  },

  // The three-column row — this is the key to perfect centering.
  // Each column is flex: 1, so the center column is always at 50%.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // ── Side columns ──────────────────────────────────────────────
  sideColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Available: a soft translucent fill with a faint ring
  sideBtnActive: {
    backgroundColor: 'rgba(227,243,229,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(227,243,229,0.22)',
  },
  // Boundary reached: nearly invisible — the icon also dims
  sideBtnInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(227,243,229,0.08)',
  },

  // ── Center column ─────────────────────────────────────────────
  centerColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    // No flex: 1 — the center button has a fixed size; the side
    // columns expand equally to push it to the exact center.
  },
  centerLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(227,243,229,0.7)',
    marginTop: 8,
  },
  centerBtn: {
    width: 80,
    height: 80,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Elevated shadow — the button "floats" above the pill
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  centerBtnDisabled: {
    opacity: 0.4,
  },
});
