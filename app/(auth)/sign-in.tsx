import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppColors } from '@/constants/theme';

const LAST_SIGN_IN_PROVIDER_KEY = 'auth:last-sign-in-provider';

const signInSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
    const navigation = useNavigation<any>();
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
                await AsyncStorage.setItem(LAST_SIGN_IN_PROVIDER_KEY, 'email');
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

            Alert.alert(
                'Check your email',
                'If an account exists for this email, we sent a password reset link to the inbox.'
            );
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
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Continue your progress.</Text>
                    </View>

                    <View style={styles.formContainer}>
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
                            style={styles.actionText}
                            onPress={() => void handleForgotPassword()}
                        >
                            Forgot Password?
                        </Text>

                        {canResendVerification && (
                            <Text
                                style={styles.actionText}
                                onPress={() => void handleResendVerification()}
                            >
                                Resend verification email
                            </Text>
                        )}

                        <Button
                            label="Sign In"
                            onPress={handleSubmit(onSubmit)}
                            loading={loading}
                            style={styles.submitButton}
                            size="lg"
                        />
                    </View>

                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                        <Text
                            style={styles.footerLink}
                            onPress={() => navigation.navigate('sign-up')}
                        >
                            Sign Up
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontFamily: 'Erode-Bold',
        fontSize: 36,
        color: AppColors.forest,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Satoshi-Regular',
        color: AppColors.iconMuted,
        textAlign: 'center',
        fontSize: 18,
    },
    formContainer: {
        gap: 20,
    },
    actionText: {
        textAlign: 'right',
        color: AppColors.forest,
        fontFamily: 'Satoshi-Medium',
        fontSize: 14,
    },
    submitButton: {
        marginTop: 16,
        shadowColor: 'transparent',
    },
    footerContainer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        color: AppColors.iconMuted,
        fontFamily: 'Satoshi-Regular',
        fontSize: 16,
    },
    footerLink: {
        color: AppColors.forest,
        fontFamily: 'Satoshi-Bold',
        fontWeight: '500',
        fontSize: 16,
    },
});
