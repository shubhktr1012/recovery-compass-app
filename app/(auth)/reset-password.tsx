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
import { useAuth } from '@/providers/auth';

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
    const router = useRouter();
    const { clearPasswordRecoveryState, isRecoveringPassword, session } = useAuth();
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) throw error;

            clearPasswordRecoveryState();
            Alert.alert('Password updated', 'Your password has been changed successfully.');
        } catch (error: any) {
            Alert.alert('Update failed', error?.message ?? 'Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToSignIn = () => {
        clearPasswordRecoveryState();
        router.replace('/sign-in' as Href);
    };

    const canResetPassword = isRecoveringPassword || !!session;

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
                            Set a New Password
                        </Text>
                        <Text className="font-satoshi text-gray-500 text-center text-lg">
                            Choose a new password to secure your account.
                        </Text>
                    </View>

                    {canResetPassword ? (
                        <View className="space-y-5">
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="New Password"
                                        placeholder="••••••••"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        isPassword
                                        autoCapitalize="none"
                                        error={errors.password?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="confirmPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        label="Confirm Password"
                                        placeholder="••••••••"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        isPassword
                                        autoCapitalize="none"
                                        error={errors.confirmPassword?.message}
                                    />
                                )}
                            />

                            <Button
                                label="Update Password"
                                onPress={handleSubmit(onSubmit)}
                                loading={loading}
                                className="mt-4"
                                size="lg"
                            />
                        </View>
                    ) : (
                        <View className="space-y-5">
                            <Text className="text-center text-gray-500 font-satoshi text-base">
                                This password reset link is missing, expired, or has already been used.
                            </Text>

                            <Button
                                label="Back to Sign In"
                                onPress={handleBackToSignIn}
                                className="mt-4"
                                size="lg"
                            />
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
