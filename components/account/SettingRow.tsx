import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { AppColors } from '@/constants/theme';

interface SettingRowProps {
  label: string;
  description?: string;
  icon: IconSymbolName;
  onPress: () => void;
  variant?: 'default' | 'danger';
  value?: string;
  loading?: boolean;
}

export function SettingRow({
  label,
  description,
  icon,
  onPress,
  variant = 'default',
  value,
  loading = false,
}: SettingRowProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, {
      duration: 180,
      easing: Easing.inOut(Easing.cubic),
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: 240,
      easing: Easing.inOut(Easing.cubic),
    });
  };

  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={loading}
      className="mb-1"
    >
      <Animated.View
        style={animatedStyle}
        className="flex-row items-center py-4 px-1"
      >
        {/* Icon Container */}
        <View
          className={`h-10 w-10 items-center justify-center rounded-2xl ${
            isDanger ? 'bg-danger/10' : 'bg-sage/40'
          }`}
        >
          <IconSymbol
            name={icon}
            size={20}
            color={isDanger ? AppColors.danger : AppColors.forest}
          />
        </View>

        {/* Text Content */}
        <View className="flex-1 px-4">
          <Text
            className={`font-satoshi-medium text-[16px] ${
              isDanger ? 'text-danger' : 'text-forest'
            }`}
          >
            {label}
          </Text>
          {description && (
            <Text className="font-satoshi text-[13px] text-forest/40 mt-0.5">
              {description}
            </Text>
          )}
        </View>

        {/* Right Action / Value */}
        <View className="flex-row items-center">
          {value && (
            <Text className="mr-2 font-satoshi-medium text-[13px] text-forest/30">
              {value}
            </Text>
          )}
          <IconSymbol
            name="chevron.right"
            size={14}
            color={isDanger ? AppColors.danger : AppColors.forest}
            style={{ opacity: 0.2 }}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}
