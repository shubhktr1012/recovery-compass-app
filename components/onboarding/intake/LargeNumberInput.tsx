import React from 'react';
import { View, TextInput, Text } from 'react-native';

interface LargeNumberInputProps {
  value: string;
  onChangeText: (text: string) => void;
  unit?: string;
  autoFocus?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
}

export function LargeNumberInput({
  value,
  onChangeText,
  unit,
  autoFocus = false,
  maxLength = 4,
  onSubmitEditing,
}: LargeNumberInputProps) {
  return (
    <View className="items-center mt-8">
      <TextInput
        keyboardType="numeric"
        inputMode="numeric"
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor="rgba(6, 41, 12, 0.15)"
        maxLength={maxLength}
        className="font-erode-bold text-[56px] leading-[64px] text-forest text-center min-w-[120px]"
        style={{ includeFontPadding: false }}
        autoFocus={autoFocus}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={!!onSubmitEditing}
      />
      {/* Thin bottom rule */}
      <View className="w-[120px] h-[1px] bg-forest/10 mt-1" />
      {unit && (
        <Text className="font-satoshi text-[14px] text-forest/40 text-center mt-3">
          {unit}
        </Text>
      )}
    </View>
  );
}
