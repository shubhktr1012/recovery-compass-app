import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const signInSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: SignInFormData) => {
        setLoading(true);
        try {
            const { error, data: sessionData } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) throw error;

            if (sessionData.user) {
                // Successful login
                // TODO: Check if personalization is complete, else redirect there
                // For now, assume if they log in, they might need to go to Home or check profile
                // Let's rely on _layout checking the profile status.
                // But since _layout check runs on mount, we might need to manually push.
                // We'll redirect to a loading state or just refresh? 
                // Actually, supabase auth state change should trigger context updates if we have a provider.
                // For now, let's just push to Home and let the layout guard handle redirection if needed.
                router.replace('/(tabs)' as Href);
            }

        } catch (error: any) {
            Alert.alert('Sign In Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = (provider: 'google' | 'apple') => {
        Alert.alert('Coming Soon', `${provider} login is not yet configured.`);
    };

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerClassName="flex-grow justify-center px-6 pb-10"
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="items-center mb-10">
                        <Text className="font-erode-bold text-4xl text-forest mb-2 text-center">
                            Welcome Back
                        </Text>
                        <Text className="font-satoshi text-gray-500 text-center text-lg">
                            Continue your progress.
                        </Text>
                    </View>

                    <View className="space-y-5">
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <Input
                                    label="Email"
                                    placeholder="hello@example.com"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    error={errors.email?.message}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="password"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <Input
                                    label="Password"
                                    placeholder="••••••••"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    secureTextEntry
                                    error={errors.password?.message}
                                />
                            )}
                        />

                        <Text className="text-right text-forest font-satoshi-medium text-sm">
                            Forgot Password?
                        </Text>

                        <Button
                            label="Sign In"
                            onPress={handleSubmit(onSubmit)}
                            loading={loading}
                            className="mt-4"
                            size="lg"
                        />
                    </View>

                    <View className="mt-8 flex-row items-center justify-between">
                        <View className="h-px bg-gray-200 flex-1" />
                        <Text className="mx-4 text-gray-400 font-satoshi text-sm">or continue with</Text>
                        <View className="h-px bg-gray-200 flex-1" />
                    </View>

                    <View className="mt-8 space-y-4">
                        <Button
                            label="Google"
                            variant="secondary"
                            onPress={() => handleOAuthLogin('google')}
                        />
                        <Button
                            label="Apple"
                            variant="secondary"
                            onPress={() => handleOAuthLogin('apple')}
                        />
                    </View>

                    <View className="mt-10 flex-row justify-center">
                        <Text className="text-gray-500 font-satoshi">Don&apos;t have an account? </Text>
                        <Text
                            className="text-forest font-satoshi-bold font-medium"
                            onPress={() => router.replace('/sign-up' as Href)}
                        >
                            Sign Up
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
