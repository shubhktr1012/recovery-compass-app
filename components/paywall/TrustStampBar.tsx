import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Polyline } from 'react-native-svg';

// ─── SVG icons (matching spec exactly) ───────────────────────────────────────

function LockIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3" y="11" width="18" height="11" rx={2}
        stroke="#06290C" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke="#06290C" strokeWidth={2} strokeLinecap="round"
      />
    </Svg>
  );
}

function LeafIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 4C10 4 4 10 4 20c8 0 16-6 16-16zM4 20C8 16 12 12 20 4"
        stroke="#06290C" strokeWidth={2} strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="20,6 9,17 4,12"
        stroke="#06290C" strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Single trust item ───────────────────────────────────────────────────────

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.item}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrustStampBar() {
  return (
    <View style={styles.bar}>
      <TrustItem icon={<LockIcon />} label="Private" />
      <Separator />
      <TrustItem icon={<LeafIcon />} label="Evidence-based" />
      <Separator />
      <TrustItem icon={<CheckIcon />} label="One-time" />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    // card-shadow
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E3F3E5', // sage
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    color: 'rgba(6,41,12,0.62)', // muted-ink
    lineHeight: 12,
  },
  sep: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(6,41,12,0.07)', // hairline
  },
});
