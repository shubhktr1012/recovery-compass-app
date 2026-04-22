import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppColors } from '@/constants/theme';

interface MoodChipsProps {
  value: string[];
  onChange: (val: string[]) => void;
}

const MOODS = [
  'Sad',
  'Stressed',
  'Anxious',
  'Tired',
  'Restless',
  'Okay',
  'Calm',
  'Content',
  'Hopeful',
  'Grateful',
  'Motivated',
  'Happy',
];

export function MoodChips({ value, onChange }: MoodChipsProps) {
  const toggleMood = (mood: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value.includes(mood)) {
      onChange(value.filter((m) => m !== mood));
    } else {
      onChange([...value, mood]);
    }
  };

  return (
    <View>
      <Text
        style={{
          fontFamily: 'Satoshi-SemiBold',
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: 'rgba(6,41,12,0.45)',
          marginBottom: 8,
        }}
      >
        Mood
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {MOODS.map((mood) => {
          const isSelected = value.includes(mood);
          return (
            <MoodChip
              key={mood}
              mood={mood}
              isSelected={isSelected}
              onSelect={() => toggleMood(mood)}
            />
          );
        })}
      </View>
    </View>
  );
}

function MoodChip({
  mood,
  isSelected,
  onSelect,
}: {
  mood: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.92, { duration: 100, easing: Easing.out(Easing.cubic) });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onSelect}
      hitSlop={4}
    >
      <Animated.View
        style={[
          animStyle,
          {
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: isSelected ? AppColors.sage : AppColors.surface,
            borderWidth: 1,
            borderColor: isSelected ? 'rgba(6,41,12,0.12)' : AppColors.hairline,
          },
        ]}
      >
        <Text
          style={{
            fontFamily: 'Satoshi-Medium',
            fontSize: 12,
            color: isSelected ? AppColors.forest : 'rgba(6,41,12,0.62)',
            letterSpacing: 0.2,
          }}
        >
          {mood}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
