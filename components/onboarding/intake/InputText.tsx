import React from 'react';
import { View, TextInput } from 'react-native';

interface InputTextProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
}

export function InputText({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoFocus = false,
  maxLength = 120,
  onSubmitEditing,
}: InputTextProps) {
  return (
    <View 
      className={`mt-6 border-b border-forest/15 pb-2 ${
        multiline ? 'min-h-[120px] items-start' : ''
      }`}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(45, 62, 53, 0.25)"
        multiline={multiline}
        maxLength={maxLength}
        className="font-satoshi text-[18px] text-forest w-full"
        textAlignVertical={multiline ? 'top' : 'center'}
        autoFocus={autoFocus}
        returnKeyType={multiline ? 'default' : 'next'}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={!multiline}
      />
    </View>
  );
}
