import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';

interface InputTextProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
  keyboardType?: KeyboardTypeOptions;
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
}

export function InputText({
  value,
  onChangeText,
  label,
  placeholder,
  multiline = false,
  autoFocus = false,
  maxLength = 120,
  onSubmitEditing,
  keyboardType,
  inputMode,
}: InputTextProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.card, focused && styles.cardFocused, multiline && styles.cardMultiline]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(6,41,12,0.25)"
        multiline={multiline}
        maxLength={maxLength}
        style={[styles.input, multiline && styles.inputMultiline]}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoFocus={autoFocus}
        returnKeyType={multiline ? 'default' : 'next'}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={!multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType={keyboardType}
        inputMode={inputMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,41,12,0.07)', // hairline
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    // --card-shadow
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 10,
  },
  cardFocused: {
    borderColor: 'rgba(6,41,12,0.2)',
  },
  cardMultiline: {
    minHeight: 130,
  },
  label: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    letterSpacing: 9 * 0.18,
    color: 'rgba(6,41,12,0.35)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 17,
    color: '#06290C', // forest
    padding: 0,
    margin: 0,
  },
  inputMultiline: {
    minHeight: 80,
  },
});
