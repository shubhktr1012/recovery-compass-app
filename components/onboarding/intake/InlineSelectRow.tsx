import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface InlineSelectRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
}

export function InlineSelectRow({ label, selected, onPress, isLast }: InlineSelectRowProps) {
  return (
    <Pressable 
      onPress={onPress}
      className={`relative w-full py-4 flex-row items-center ${!isLast ? 'border-b border-forest/5' : ''}`}
    >
      <View 
        className={`h-5 w-5 rounded-full border-[1.5px] items-center justify-center mr-4 ${
          selected ? 'border-forest' : 'border-forest/20'
        }`}
      >
        {selected && (
          <Animated.View 
            entering={FadeIn.duration(150)} 
            className="h-2.5 w-2.5 rounded-full bg-forest" 
          />
        )}
      </View>
      
      <Text 
        className={`flex-1 font-satoshi text-[16px] leading-[24px] ${
          selected ? 'font-satoshi-bold text-forest' : 'text-forest/55'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
