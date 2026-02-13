import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/providers/profile';

export default function Paywall() {
    const router = useRouter();
    const { setSubscriptionStatus } = useProfile();
    const [loading, setLoading] = useState(false);

    const handleMockPurchase = async (plan: '6-day' | '90-day') => {
        setLoading(true);
        // Simulate network delay
        setTimeout(() => {
            setLoading(false);
            if (plan === '6-day') {
                Alert.alert('Mock Purchase', 'You selected the 6-Day Plan. Unlocking app...');
            } else {
                Alert.alert('Mock Purchase', 'You selected the 90-Day Plan. Unlocking app...');
            }

            // Grant "subscription"
            setSubscriptionStatus(true);
            // Navigate
            router.replace('/(tabs)' as Href);
        }, 1500);
    };

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <StatusBar style="dark" />
            <ScrollView contentContainerClassName="p-6 pb-20">
                <View className="items-center mb-10 mt-4">
                    <Text className="font-erode-bold text-3xl text-forest text-center mb-2">
                        Commit to Your Freedom
                    </Text>
                    <Text className="font-satoshi text-gray-500 text-center text-lg">
                        Choose the plan that fits your journey.
                    </Text>
                </View>

                {/* 6-Day Plan */}
                <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="font-erode-bold text-2xl text-forest">
                            6-Day Reset
                        </Text>
                        <View className="bg-sage px-3 py-1 rounded-full">
                            <Text className="text-forest font-satoshi-bold text-xs uppercase">
                                Fast Track
                            </Text>
                        </View>
                    </View>
                    <Text className="font-satoshi text-gray-500 mb-6 leading-6">
                        A specialized protocol to break the physical addiction loop and reset your environment.
                    </Text>
                    <View className="mb-6">
                        <Text className="font-satoshi-bold text-3xl text-forest">$9.99</Text>
                        <Text className="font-satoshi text-gray-400 text-sm">One-time payment</Text>
                    </View>
                    <Button
                        label="Start 6-Day Reset"
                        onPress={() => handleMockPurchase('6-day')}
                        loading={loading}
                    />
                </View>

                {/* 90-Day Plan */}
                <View className="bg-forest rounded-3xl p-6 mb-8 shadow-md">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="font-erode-bold text-2xl text-white">
                            90-Day Transform
                        </Text>
                        <View className="bg-white/20 px-3 py-1 rounded-full">
                            <Text className="text-white font-satoshi-bold text-xs uppercase">
                                Most Popular
                            </Text>
                        </View>
                    </View>
                    <Text className="font-satoshi text-gray-300 mb-6 leading-6">
                        Complete rewiring of habits, emotional regulation, and identity. The full protocol.
                    </Text>
                    <View className="mb-6">
                        <Text className="font-satoshi-bold text-3xl text-white">$49.99</Text>
                        <Text className="font-satoshi text-gray-400 text-sm">One-time payment</Text>
                    </View>
                    <Button
                        label="Start Full Journey"
                        variant="secondary"
                        onPress={() => handleMockPurchase('90-day')}
                        loading={loading}
                    />
                </View>

                {/* Dev Bypass */}
                <View className="items-center">
                    <Text className="text-gray-400 text-xs text-center mb-2">Development Mode</Text>
                    <Button
                        label="[DEV] Bypass Paywall"
                        variant="ghost"
                        size="sm"
                        onPress={() => handleMockPurchase('90-day')}
                    />
                </View>

                <Text className="text-center text-gray-400 text-xs mt-8">
                    Secured by RevenueCat (Mocked)
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}
