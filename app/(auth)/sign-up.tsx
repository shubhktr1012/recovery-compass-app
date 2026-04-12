import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppColors } from '@/constants/theme';
import { isStrongPassword, PASSWORD_REQUIREMENTS_HINT } from '@/lib/password';
import { PasswordStrength } from '@/components/ui/PasswordStrength';

const signUpSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().refine(isStrongPassword, {
        message: PASSWORD_REQUIREMENTS_HINT,
    }),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: SignUpFormData) => {
        setLoading(true);
        try {
            const { error, data: sessionData } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    emailRedirectTo: 'recoverycompassapp://sign-in',
                },
            });

            if (error) throw error;

            // Supabase can return an obfuscated "success" payload for already-registered emails.
            // In that case identities is commonly an empty array and no session is issued.
            const maybeExistingUser =
                !!sessionData?.user &&
                !sessionData?.session &&
                Array.isArray((sessionData.user as any).identities) &&
                (sessionData.user as any).identities.length === 0;

            if (maybeExistingUser) {
                Alert.alert(
                    'Account already exists',
                    'This email is already linked to an account. Use Sign In, or continue with Apple/Google if you used those before.',
                    [
                        {
                            text: 'Continue',
                            onPress: () => navigation.navigate('welcome'),
                        },
                        { text: 'Cancel', style: 'cancel' },
                    ]
                );
                return;
            }

            if (sessionData.user && sessionData.session) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert(
                        {
                            id: sessionData.user.id,
                            email: sessionData.user.email ?? null,
                            onboarding_complete: false,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'id' }
                    );

                if (profileError) throw profileError;

                // Let the root auth gate route newly authenticated users after
                // session/profile state has settled. Navigating immediately here
                // can race the navigator tree on Android.
                return;
            } else {
                // Email confirmation mode: do not enter personalization until authenticated.
                Alert.alert(
                    'Check your email',
                    'Verify your account, then sign in to continue setup. If this email was already used with Apple/Google, use Sign In instead.'
                );
                navigation.navigate('welcome');
            }

        } catch (error: any) {
            const rawMessage = error?.message ?? 'Please try again.';
            const normalized = rawMessage.toLowerCase();
            const isExistingAccount =
                normalized.includes('already registered') ||
                normalized.includes('already exists') ||
                normalized.includes('user already registered');

            if (isExistingAccount) {
                Alert.alert(
                    'Account already exists',
                    'This email is already linked to an account. Sign in with Apple/Google if you used those before, or reset your password.',
                    [
                        {
                            text: 'Reset Password',
                            onPress: () => navigation.navigate('sign-in'),
                        },
                        {
                            text: 'Sign In',
                            onPress: () => navigation.navigate('sign-in'),
                        },
                        { text: 'Cancel', style: 'cancel' },
                    ]
                );
                return;
            }

            Alert.alert('Sign Up Error', rawMessage);
        } finally {
            setLoading(false);
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
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Start your journey to freedom.</Text>
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
                                    helperText={<PasswordStrength password={value} />}
                                    error={errors.password?.message}
                                />
                            )}
                        />

                        <Button
                            label="Sign Up"
                            onPress={handleSubmit(onSubmit)}
                            loading={loading}
                            style={styles.submitButton}
                            size="lg"
                        />
                    </View>

                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Text
                            style={styles.footerLink}
                            onPress={() => navigation.navigate('welcome')}
                        >
                            Sign In
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
