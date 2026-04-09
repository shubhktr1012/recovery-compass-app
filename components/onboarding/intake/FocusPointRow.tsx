import React from 'react';
import { View, Text } from 'react-native';

interface FocusPointRowProps {
  text: string;
}

export function FocusPointRow({ text }: FocusPointRowProps) {
  return (
    <View className="flex-row items-start">
      {/* 5×5 hollow circle indicator */}
      <View className="h-[5px] w-[5px] rounded-full border border-forest/25 mt-2 mr-3" />
      <Text className="flex-1 font-satoshi text-[14px] leading-[22px] text-forest/65">
        {text}
      </Text>
    </View>
  );
}
