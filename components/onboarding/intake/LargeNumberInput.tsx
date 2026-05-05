import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface LargeNumberInputProps {
  value: string;
  onChangeText: (text: string) => void;
  unit?: string;
  label?: string;
  autoFocus?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
  /**
   * 'age' — card styling with stepper buttons (spec .age-display)
   * 'default' — centered serif input with thin bottom rule (original behavior)
   */
  variant?: 'default' | 'age';
}

export function LargeNumberInput({
  value,
  onChangeText,
  unit,
  label,
  autoFocus = false,
  maxLength = 4,
  onSubmitEditing,
  variant = 'default',
}: LargeNumberInputProps) {
  if (variant === 'age') {
    return (
      <AgeVariant
        value={value}
        onChangeText={onChangeText}
        label={label}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
      />
    );
  }

  return (
    <View style={defaultStyles.wrap}>
      <TextInput
        keyboardType="numeric"
        inputMode="numeric"
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor="rgba(6,41,12,0.15)"
        maxLength={maxLength}
        style={defaultStyles.input}
        autoFocus={autoFocus}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={!!onSubmitEditing}
      />
      <View style={defaultStyles.rule} />
      {unit && <Text style={defaultStyles.unit}>{unit}</Text>}
    </View>
  );
}

/* ── Age variant (card-based, per spec) ──────────────────────── */

function AgeVariant({
  value,
  onChangeText,
  label,
  maxLength = 3,
  autoFocus = false,
  onSubmitEditing,
}: {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}) {
  const numValue = parseInt(value, 10) || 0;

  const increment = () => {
    const next = Math.min(numValue + 1, 120);
    onChangeText(String(next));
  };

  const decrement = () => {
    const next = Math.max(numValue - 1, 1);
    onChangeText(String(next));
  };

  return (
    <View style={ageStyles.card}>
      {/* Left side: label + editable number */}
      <View style={ageStyles.left}>
        {label && <Text style={ageStyles.label}>{label}</Text>}
        <View style={ageStyles.valueRow}>
          <TextInput
            keyboardType="numeric"
            inputMode="numeric"
            value={value}
            onChangeText={onChangeText}
            placeholder="—"
            placeholderTextColor="rgba(6,41,12,0.20)"
            maxLength={maxLength}
            style={ageStyles.number}
            autoFocus={autoFocus}
            returnKeyType="done"
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={!!onSubmitEditing}
            selectTextOnFocus
          />
          <Text style={ageStyles.unit}>years</Text>
        </View>
      </View>

      {/* Right side: stepper buttons */}
      <View style={ageStyles.stepperWrap}>
        <Pressable onPress={decrement} style={ageStyles.stepperBtn} hitSlop={6} accessibilityLabel="Decrease age">
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12h14" stroke="rgba(6,41,12,0.55)" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Pressable onPress={increment} style={ageStyles.stepperBtn} hitSlop={6} accessibilityLabel="Increase age">
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke="rgba(6,41,12,0.55)" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>
    </View>
  );
}

/* ── Default styles ────────────────────────────────────────── */

const defaultStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 32,
  },
  input: {
    fontFamily: 'Erode-Bold',
    fontSize: 56,
    lineHeight: 64,
    color: '#06290C',
    textAlign: 'center',
    minWidth: 120,
    includeFontPadding: false,
  },
  rule: {
    width: 120,
    height: 1,
    backgroundColor: 'rgba(6,41,12,0.10)',
    marginTop: 4,
  },
  unit: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: 'rgba(6,41,12,0.40)',
    textAlign: 'center',
    marginTop: 12,
  },
});

/* ── Age card styles ───────────────────────────────────────── */

const ageStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,41,12,0.07)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 10,
  },
  left: {
    flexShrink: 1,
  },
  label: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    letterSpacing: 9 * 0.18,
    color: 'rgba(6,41,12,0.35)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  number: {
    fontFamily: 'Erode-Medium',
    fontSize: 42,
    color: '#06290C',
    includeFontPadding: false,
  },
  unit: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: 'rgba(6,41,12,0.45)',
  },
  stepperWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2E5', // sage-soft
    alignItems: 'center',
    justifyContent: 'center',
  },
});
