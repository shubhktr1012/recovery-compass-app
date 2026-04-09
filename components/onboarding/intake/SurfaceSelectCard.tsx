import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface SurfaceSelectCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

export function SurfaceSelectCard({ title, description, selected, onPress }: SurfaceSelectCardProps) {
  return (
    <Pressable onPress={onPress} className="mb-3">
      <View
        className={`relative overflow-hidden rounded-3xl px-6 py-5 ${
          selected 
            ? 'bg-[#F9FAF9] border border-forest/15' 
            : 'bg-white shadow-[0_2px_8px_-4px_rgba(6,41,12,0.05)] border border-forest/5'
        }`}
      >
        {/* Left accent bar when selected */}
        {selected && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-forest"
          />
        )}

        <Text className="font-satoshi-bold text-[16px] text-forest">
          {title}
        </Text>
        {description ? (
          <Text className="font-satoshi text-[14px] text-forest/50 mt-1.5">
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
