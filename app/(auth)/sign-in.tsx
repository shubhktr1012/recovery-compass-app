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
    const [canResendVerification, setCanResendVerification] = useState(false);

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
            setCanResendVerification(false);

            if (sessionData.user) {
                // Root layout guard handles post-login routing (tabs/paywall/personalization).
                return;
            }

        } catch (error: any) {
            const message = error?.message ?? 'Please try again.';
            setCanResendVerification(/email.*not confirmed|email.*not verified|confirm your email/i.test(message));
            Alert.alert('Sign In Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const email = control._formValues.email?.trim();

        if (!email) {
            Alert.alert('Email required', 'Enter your email first so we know where to send the reset link.');
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'recoverycompassapp://reset-password',
            });

            if (error) throw error;

            Alert.alert('Check your email', 'We sent a password reset link to your inbox.');
        } catch (error: any) {
            Alert.alert('Reset failed', error?.message ?? 'Please try again.');
        }
    };

    const handleResendVerification = async () => {
        const email = control._formValues.email?.trim();

        if (!email) {
            Alert.alert('Email required', 'Enter your email first so we know where to send the verification link.');
            return;
        }

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: 'recoverycompassapp://sign-in',
                },
            });

            if (error) throw error;

            Alert.alert('Verification sent', 'Check your inbox and tap the verification link to continue.');
        } catch (error: any) {
            Alert.alert('Resend failed', error?.message ?? 'Please try again.');
        }
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
                                    isPassword
                                    autoCapitalize="none"
                                    error={errors.password?.message}
                                />
                            )}
                        />

                        <Text
                            className="text-right text-forest font-satoshi-medium text-sm"
                            onPress={() => void handleForgotPassword()}
                        >
                            Forgot Password?
                        </Text>

                        {canResendVerification && (
                            <Text
                                className="text-right text-forest font-satoshi-medium text-sm"
                                onPress={() => void handleResendVerification()}
                            >
                                Resend verification email
                            </Text>
                        )}

                        <Button
                            label="Sign In"
                            onPress={handleSubmit(onSubmit)}
                            loading={loading}
                            className="mt-4"
                            size="lg"
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
