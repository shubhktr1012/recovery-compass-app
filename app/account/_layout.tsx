import { Stack } from 'expo-router';
import React from 'react';

export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="programs" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="statistics" />
    </Stack>
  );
}
