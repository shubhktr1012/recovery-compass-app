import React from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StepContainerProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBack?: boolean;
}

export function StepContainer({ 
  children, 
  footer, 
  currentStep, 
  totalSteps,
  onBack,
  showBack = true 
}: StepContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ 
          paddingTop: insets.top + 12, 
          paddingHorizontal: 24,
          paddingBottom: footer ? 120 : insets.bottom + 40
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nav row */}
        <View className="flex-row items-center justify-between">
          {showBack && onBack ? (
            <Pressable onPress={onBack} hitSlop={12}>
              <Text className="font-satoshi text-[14px] text-forest/40">
                ← Back
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Text className="font-satoshi text-[12px] tracking-[1.2px] text-forest/30">
            {currentStep + 1} of {totalSteps}
          </Text>
        </View>

        {children}
      </ScrollView>
      
      {footer && (
        <View 
          className="absolute bottom-0 w-full bg-surface px-6"
          style={{ paddingBottom: Math.max(insets.bottom, 32) }}
        >
          {footer}
        </View>
      )}
    </View>
  );
}
