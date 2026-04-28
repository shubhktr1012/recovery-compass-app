import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Brand tokens ────────────────────────────────────────────────────────────
const F = {
  forest: '#06290C',
  sage: '#E3F3E5',
  sageAlpha14: 'rgba(227,243,229,0.14)',
  sageAlpha22: 'rgba(227,243,229,0.22)',
  sageAlpha80: 'rgba(227,243,229,0.80)',
  sageAlpha45: 'rgba(227,243,229,0.45)',
  sageAlpha42: 'rgba(227,243,229,0.42)',
  sageAlpha12: 'rgba(227,243,229,0.12)',
  sageAlpha50: 'rgba(227,243,229,0.50)',
  sageAlpha20: 'rgba(227,243,229,0.20)',
  sageAlpha30: 'rgba(227,243,229,0.30)',
};

// ─── Botanical watermark SVG ─────────────────────────────────────────────────
function BotanicalWatermark() {
  return (
    <Svg
      style={styles.botanical}
      width={160}
      height={160}
      viewBox="0 0 200 200"
      fill="none"
    >
      <Path
        d="M100 10C100 10 165 55 165 105C165 148 135 182 100 192C65 182 35 148 35 105C35 55 100 10 100 10Z"
        fill={F.sage}
      />
      <Path d="M100 98L100 192" stroke={F.sage} strokeWidth={1.5} />
      <Path d="M100 120C80 110 65 125 60 140" stroke={F.sage} strokeWidth={1} />
      <Path d="M100 140C120 130 135 145 140 160" stroke={F.sage} strokeWidth={1} />
    </Svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PreviewCardProps {
  totalDays: number;
  dailyMinutes: string;
  phaseCount: number;
}

// ─── Stat column ──────────────────────────────────────────────────────────────
function StatColumn({
  value,
  label,
  isLast,
}: {
  value: string | number;
  label: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.stat,
        !isLast && styles.statBorder,
      ]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PreviewCard({ totalDays, dailyMinutes, phaseCount }: PreviewCardProps) {
  return (
    <View style={styles.card}>
      <BotanicalWatermark />
      <View style={styles.inner}>
        {/* Top row: phase pill + status */}
        <View style={styles.topRow}>
          <View style={styles.phasePill}>
            <Text style={styles.phaseText}>Phase 1 · Foundation</Text>
          </View>
          <Text style={styles.readyText}>Ready to begin</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatColumn value={totalDays} label="Days" />
          <StatColumn value={dailyMinutes} label="Min / day" />
          <StatColumn value={phaseCount} label="Phases" isLast />
        </View>

        {/* Progress track */}
        <View style={styles.track}>
          <View style={[styles.fill, { width: '0%' }]} />
        </View>
        <View style={styles.trackLabelRow}>
          <Text style={styles.trackLabel}>Not yet started</Text>
          <Text style={styles.trackLabel}>{totalDays} days</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 22,
    backgroundColor: F.forest,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    // lift-shadow
    shadowColor: F.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  botanical: {
    position: 'absolute',
    right: -14,
    bottom: -14,
    opacity: 0.07,
  },
  inner: {
    padding: 16,
    paddingHorizontal: 18,
    paddingBottom: 14,
    position: 'relative',
    zIndex: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  phasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: F.sageAlpha14,
    borderWidth: 1,
    borderColor: F.sageAlpha22,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  phaseText: {
    fontFamily: 'Satoshi-SemiBold',
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: F.sageAlpha80,
  },
  readyText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 10,
    letterSpacing: 0.4,
    color: F.sageAlpha45,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statBorder: {
    paddingRight: 16,
    marginRight: 16,
    borderRightWidth: 1,
    borderRightColor: F.sageAlpha12,
  },
  statValue: {
    fontFamily: 'Erode-Medium',
    fontSize: 26,
    letterSpacing: -0.52,
    lineHeight: 28,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: 'Satoshi-SemiBold',
    fontSize: 8,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
    color: F.sageAlpha42,
  },
  track: {
    height: 2,
    backgroundColor: F.sageAlpha14,
    borderRadius: 999,
  },
  fill: {
    height: 2,
    borderRadius: 999,
    // Can't do CSS linear-gradient in RN — we approximate with a single color
    backgroundColor: F.sageAlpha50,
  },
  trackLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  trackLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 8,
    letterSpacing: 0.32,
    color: F.sageAlpha30,
  },
});
