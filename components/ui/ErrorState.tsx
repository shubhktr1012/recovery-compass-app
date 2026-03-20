import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="items-center gap-4">
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color="rgba(5, 41, 12, 0.4)"
        />
        <Text className="text-center font-satoshi text-base leading-7 text-gray-600">
          {message}
        </Text>
        {onRetry ? <Button label={retryLabel} onPress={onRetry} variant="primary" /> : null}
      </View>
    </View>
  );
}

export default ErrorState;
