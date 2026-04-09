import React from 'react';
import { View, Text } from 'react-native';

interface StepHeadlineProps {
  title: string;
  description?: string;
}

export function StepHeadline({ title, description }: StepHeadlineProps) {
  return (
    <View className="mt-6">
      <Text 
        className="font-erode-semibold text-[28px] leading-[34px] tracking-tight text-forest"
      >
        {title}
      </Text>
      {description ? (
        <Text 
          className="mt-3 font-satoshi text-[15px] leading-[24px] text-forest/50"
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}
