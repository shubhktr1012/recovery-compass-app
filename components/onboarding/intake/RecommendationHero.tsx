import React from 'react';
import { Text, View } from 'react-native';

interface RecommendationHeroProps {
  title: string;
  subtitle: string;
}

export function RecommendationHero({ title, subtitle }: RecommendationHeroProps) {
  return (
    <View className="bg-forest rounded-3xl px-7 py-8 mx-[-2px]">
      <Text className="font-erode-bold text-[34px] leading-[40px] text-white">
        {title}
      </Text>
      <Text className="font-satoshi text-[15px] leading-[24px] text-white/75 mt-4">
        {subtitle}
      </Text>
    </View>
  );
}
