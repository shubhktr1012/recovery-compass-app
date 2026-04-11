import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
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
import { AppColors } from '@/constants/theme';
import { isStrongPassword, PASSWORD_REQUIREMENTS_HINT } from '@/lib/password';
import { PasswordStrength } from '@/components/ui/PasswordStrength';

const resetPasswordSchema = z.object({
    password: z.string().refine(isStrongPassword, {
        message: PASSWORD_REQUIREMENTS_HINT,
    }),
    confirmPassword: z.string(),
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
                        <Text style={styles.title}>Set a New Password</Text>
                        <Text style={styles.subtitle}>Choose a new password to secure your account.</Text>
                    </View>

                    {canResetPassword ? (
                        <View style={styles.formContainer}>
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
                                    helperText={<PasswordStrength password={value} />}
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
                                style={styles.submitButton}
                                size="lg"
                            />
                        </View>
                    ) : (
                        <View style={styles.formContainer}>
                            <Text style={styles.expiredText}>
                                This password reset link is missing, expired, or has already been used.
                            </Text>

                            <Button
                                label="Back to Sign In"
                                onPress={handleBackToSignIn}
                                style={styles.submitButton}
                                size="lg"
                            />
                        </View>
                    )}
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
    submitButton: {
        marginTop: 16,
        shadowColor: 'transparent',
    },
    expiredText: {
        textAlign: 'center',
        color: AppColors.iconMuted,
        fontFamily: 'Satoshi-Regular',
        fontSize: 16,
    },
});
