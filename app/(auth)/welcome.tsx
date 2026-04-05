import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';
import { AppColors } from '@/constants/theme';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useAuth } from '@/providers/auth';
import { validatePublicEnv } from '@/lib/env';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthMode = 'default' | 'signIn';
type OAuthProvider = 'google' | 'apple';

const APPEAR_DURATION = 560;
const DISAPPEAR_DURATION = 760;
const BUTTON_ROW_HEIGHT = 60;
const BUTTON_ROW_GAP = 16;
const REVEAL_TRAVEL = 14;
const authModeEasing = Easing.bezier(0.22, 1, 0.36, 1);
const OAUTH_LINK_NOTICE_PREFIX = 'auth:linked-provider-notice';
const flatButtonStyle = {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
};

function toStaggeredProgress(value: number, start: number, end: number) {
    'worklet';
    return interpolate(value, [start, end], [0, 1], Extrapolation.CLAMP);
}

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
    const insets = useSafeAreaInsets();
    const [authMode, setAuthMode] = useState<AuthMode>('default');
    const [authProviderLoading, setAuthProviderLoading] = useState<'google' | 'apple' | null>(null);
    const progress = useSharedValue(0);
    const isIOS = Platform.OS === 'ios';
    const { signInWithGoogleIdToken, signInWithAppleIdToken } = useAuth();
    const {
        googleWebClientId,
        googleIosClientId,
        googleAndroidClientId,
    } = validatePublicEnv();
    const hasGoogleConfig = Boolean(googleWebClientId || googleIosClientId || googleAndroidClientId);
    const [googleRequest, googleAuthResponse, promptGoogleSignIn] = Google.useAuthRequest({
        webClientId: googleWebClientId ?? undefined,
        iosClientId: googleIosClientId ?? undefined,
        androidClientId: googleAndroidClientId ?? undefined,
        selectAccount: true,
        scopes: ['openid', 'profile', 'email'],
        shouldAutoExchangeCode: true,
    });
    const handledGoogleResponseRef = useRef<string | null>(null);

    const maybeShowLinkedProviderInfo = async (
        authUser: { id?: string; identities?: { provider?: string }[] } | null,
        currentProvider: OAuthProvider
    ) => {
        if (!authUser?.id || !Array.isArray(authUser.identities)) {
            return;
        }

        const providerSet = new Set(
            authUser.identities
                .map((identity) => identity?.provider)
                .filter((provider): provider is string => typeof provider === 'string' && provider.length > 0)
        );

        if (!providerSet.has(currentProvider) || providerSet.size < 2) {
            return;
        }

        const noticeKey = `${OAUTH_LINK_NOTICE_PREFIX}:${authUser.id}:${currentProvider}`;
        const alreadyShown = await AsyncStorage.getItem(noticeKey);
        if (alreadyShown === '1') {
            return;
        }

        await AsyncStorage.setItem(noticeKey, '1');
        const providerLabel = currentProvider === 'google' ? 'Google' : 'Apple';
        Alert.alert(
            'Account linked',
            `Your ${providerLabel} sign-in is linked to your existing Recovery Compass account.`
        );
    };

    useEffect(() => {
        progress.value = withTiming(authMode === 'signIn' ? 1 : 0, {
            duration: authMode === 'signIn' ? APPEAR_DURATION : DISAPPEAR_DURATION,
            easing: authModeEasing,
        });
    }, [authMode, progress]);

    useEffect(() => {
        let isMounted = true;

        const completeGoogleSignIn = async () => {
            if (!googleAuthResponse) {
                return;
            }

            if (googleAuthResponse.type !== 'success') {
                if (isMounted) {
                    setAuthProviderLoading((current) => (current === 'google' ? null : current));
                }
                return;
            }

            const responseKey =
                googleAuthResponse.params?.code ??
                googleAuthResponse.params?.id_token ??
                (googleAuthResponse.authentication as { accessToken?: string } | null | undefined)?.accessToken ??
                null;

            if (responseKey && handledGoogleResponseRef.current === responseKey) {
                return;
            }
            handledGoogleResponseRef.current = responseKey;

            try {
                const idToken =
                    googleAuthResponse.params?.id_token ??
                    (googleAuthResponse.authentication as { idToken?: string } | null | undefined)?.idToken ??
                    null;

                if (!idToken) {
                    console.warn('[GoogleAuth] Missing ID token', {
                        authKeys: googleAuthResponse.authentication
                            ? Object.keys(googleAuthResponse.authentication)
                            : [],
                        paramKeys: googleAuthResponse.params ? Object.keys(googleAuthResponse.params) : [],
                        resultType: googleAuthResponse.type,
                    });
                    throw new Error('Google did not return an ID token. Please verify Google OAuth client IDs (web + platform).');
                }

                const { error, user } = await signInWithGoogleIdToken(idToken);
                if (error) {
                    throw error;
                }
                await maybeShowLinkedProviderInfo(user, 'google');
            } catch (error: any) {
                if (isMounted) {
                    Alert.alert('Google Sign-In failed', error?.message ?? 'Please try again.');
                }
            } finally {
                if (isMounted) {
                    setAuthProviderLoading((current) => (current === 'google' ? null : current));
                }
            }
        };

        void completeGoogleSignIn();

        return () => {
            isMounted = false;
        };
    }, [googleAuthResponse, signInWithGoogleIdToken]);

    const handlePrimaryButtonPress = () => {
        if (authMode === 'default') {
            router.push('/(auth)/onboarding'); 
        } else {
            router.push('/(auth)/sign-in'); // Adjust if there's a specific route for email sign-in
        }
    };

    const handleSecondaryButtonPress = () => {
        if (authMode === 'default') {
            setAuthMode('signIn');
        } else {
            setAuthMode('default');
        }
    };

    const openLink = (url: string) => {
        Linking.openURL(url);
    };

    const handleGoogleSignIn = async () => {
        if (!hasGoogleConfig) {
            Alert.alert('Google Sign-In not configured', 'Add Google OAuth client IDs in your app environment variables.');
            return;
        }

        if (!googleRequest) {
            Alert.alert('Google Sign-In unavailable', 'Please try again in a moment.');
            return;
        }

        setAuthProviderLoading('google');
        handledGoogleResponseRef.current = null;

        try {
            const result = await promptGoogleSignIn();
            if (result.type === 'error') {
                throw new Error(result.error?.message ?? 'Google authentication was not completed.');
            }
            if (result.type !== 'success') {
                setAuthProviderLoading((current) => (current === 'google' ? null : current));
            }
        } catch (error: any) {
            setAuthProviderLoading((current) => (current === 'google' ? null : current));
            Alert.alert('Google Sign-In failed', error?.message ?? 'Please try again.');
        }
    };

    const createRawNonce = (length = 32) => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._';
        let nonce = '';
        for (let index = 0; index < length; index += 1) {
            nonce += chars[Math.floor(Math.random() * chars.length)];
        }
        return nonce;
    };

    const handleAppleSignIn = async () => {
        if (!isIOS) return;

        setAuthProviderLoading('apple');

        try {
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            if (!isAvailable) {
                throw new Error('Apple Sign-In is not available on this device.');
            }

            const rawNonce = createRawNonce();
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                rawNonce
            );

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            if (!credential.identityToken) {
                throw new Error('Apple did not return an identity token.');
            }

            const { error, user } = await signInWithAppleIdToken(credential.identityToken, rawNonce);
            if (error) throw error;
            await maybeShowLinkedProviderInfo(user, 'apple');
        } catch (error: any) {
            if (error?.code === 'ERR_REQUEST_CANCELED') {
                return;
            }
            Alert.alert('Apple Sign-In failed', error?.message ?? 'Please try again.');
        } finally {
            setAuthProviderLoading((current) => (current === 'apple' ? null : current));
        }
    };

    const createAccountStyle = useAnimatedStyle(() => ({
        opacity: 1 - progress.value,
        transform: [
            { translateY: interpolate(progress.value, [0, 1], [0, -6], Extrapolation.CLAMP) },
            { scale: interpolate(progress.value, [0, 1], [1, 0.992], Extrapolation.CLAMP) },
        ],
    }));

    const googleStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [
            { translateY: interpolate(progress.value, [0, 1], [6, 0], Extrapolation.CLAMP) },
            { scale: interpolate(progress.value, [0, 1], [0.992, 1], Extrapolation.CLAMP) },
        ],
    }));

    const appleRowStyle = useAnimatedStyle(() => {
        const staged = toStaggeredProgress(progress.value, 0.26, 0.84);
        return {
            opacity: staged,
            height: interpolate(staged, [0, 1], [0, BUTTON_ROW_HEIGHT], Extrapolation.CLAMP),
            marginBottom: interpolate(staged, [0, 1], [0, BUTTON_ROW_GAP], Extrapolation.CLAMP),
            transform: [{ translateY: interpolate(staged, [0, 1], [-REVEAL_TRAVEL, 0], Extrapolation.CLAMP) }],
        };
    });

    const emailRowStyle = useAnimatedStyle(() => {
        const staged = toStaggeredProgress(progress.value, 0.42, 1);
        return {
            opacity: staged,
            height: interpolate(staged, [0, 1], [0, BUTTON_ROW_HEIGHT], Extrapolation.CLAMP),
            marginBottom: interpolate(staged, [0, 1], [0, BUTTON_ROW_GAP], Extrapolation.CLAMP),
            transform: [{ translateY: interpolate(staged, [0, 1], [-REVEAL_TRAVEL, 0], Extrapolation.CLAMP) }],
        };
    });

    const signInStyle = useAnimatedStyle(() => ({
        opacity: 1 - progress.value,
        transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -5], Extrapolation.CLAMP) }],
    }));

    const backStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ translateY: interpolate(progress.value, [0, 1], [5, 0], Extrapolation.CLAMP) }],
    }));

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}> 
            <View style={styles.content}>
                
                {/* Logo and Branding Header */}
                <View style={styles.brandingContainer}>
                    <Image 
                        source={require('@/assets/images/rc-logo-primary.svg')} 
                        style={styles.logo}
                        contentFit="contain"
                    />
                    <ThemedText style={styles.brandName}>Recovery Compass</ThemedText>
                    <ThemedText style={styles.tagline}>Steady progress, without pressure</ThemedText>
                </View>

                {/* Footer and Auth Controls */}
                <View style={styles.footerContainer}>
                    <ThemedText style={styles.legalText}>
                        By tapping Sign in or Create account, you agree to our{' '}
                        <ThemedText 
                            style={styles.legalLink} 
                            onPress={() => openLink('https://recoverycompass.app/terms')}
                        >
                            Terms of Service
                        </ThemedText>. Learn how we process your data in our{' '}
                        <ThemedText 
                            style={styles.legalLink}
                            onPress={() => openLink('https://recoverycompass.app/privacy')}
                        >
                            Privacy Policy
                        </ThemedText>{' '}
                        and{' '}
                        <ThemedText 
                            style={styles.legalLink}
                            onPress={() => openLink('https://recoverycompass.app/cookies')}
                        >
                            Cookies Policy
                        </ThemedText>.
                    </ThemedText>

                    <View style={styles.buttonContainer}>
                        <View style={styles.morphRow}>
                            <Animated.View
                                style={[styles.overlayButton, createAccountStyle]}
                                pointerEvents={authMode === 'default' ? 'auto' : 'none'}
                            >
                                <Button
                                    variant="primary"
                                    size="lg"
                                    label="Create Account"
                                    onPress={handlePrimaryButtonPress}
                                    style={flatButtonStyle}
                                />
                            </Animated.View>

                            <Animated.View
                                style={[styles.overlayButton, googleStyle]}
                                pointerEvents={authMode === 'signIn' ? 'auto' : 'none'}
                            >
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    icon={<Image source={require('@/assets/images/google-logo.svg')} style={{ width: 22, height: 22, marginRight: 12 }} contentFit="contain" />}
                                    label="Sign In with Google"
                                    onPress={() => void handleGoogleSignIn()}
                                    loading={authProviderLoading === 'google'}
                                    disabled={!hasGoogleConfig}
                                    style={flatButtonStyle}
                                />
                            </Animated.View>
                        </View>

                        {isIOS ? (
                            <Animated.View
                                style={[styles.revealRow, styles.appleRowLayer, appleRowStyle]}
                                pointerEvents={authMode === 'signIn' ? 'auto' : 'none'}
                            >
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    icon={<Image source={require('@/assets/images/apple-logo.svg')} style={{ width: 22, height: 22, marginRight: 12, tintColor: AppColors.forest }} contentFit="contain" />}
                                    label="Sign In with Apple"
                                    onPress={() => void handleAppleSignIn()}
                                    loading={authProviderLoading === 'apple'}
                                    style={flatButtonStyle}
                                />
                            </Animated.View>
                        ) : null}
                        
                        <Animated.View
                            style={[styles.revealRow, styles.emailRowLayer, emailRowStyle]}
                            pointerEvents={authMode === 'signIn' ? 'auto' : 'none'}
                        >
                            <Button
                                variant="primary"
                                size="lg"
                                label="Sign in with Email Address"
                                onPress={() => router.push('/(auth)/sign-in')}
                                style={flatButtonStyle}
                            />
                        </Animated.View>

                        <View style={styles.switchRow}>
                            <Animated.View
                                style={[styles.switchOverlay, signInStyle]}
                                pointerEvents={authMode === 'default' ? 'auto' : 'none'}
                            >
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    label="Sign In"
                                    onPress={handleSecondaryButtonPress}
                                    style={flatButtonStyle}
                                />
                            </Animated.View>
                            <Animated.View
                                style={[styles.switchOverlay, backStyle]}
                                pointerEvents={authMode === 'signIn' ? 'auto' : 'none'}
                            >
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    label="Back"
                                    onPress={handleSecondaryButtonPress}
                                    style={flatButtonStyle}
                                />
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    brandingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 24,
    },
    brandName: {
        fontSize: 32,
        lineHeight: 40,
        fontFamily: 'Erode-Bold',
        color: AppColors.forest,
        marginBottom: 8,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 18,
        fontFamily: 'Satoshi-Medium',
        color: AppColors.iconMuted,
        textAlign: 'center',
    },
    footerContainer: {
        width: '100%',
        paddingTop: 24,
    },
    legalText: {
        fontSize: 12,
        fontFamily: 'Satoshi-Regular',
        color: AppColors.iconMuted,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 18,
    },
    legalLink: {
        fontSize: 12,
        fontFamily: 'Satoshi-Medium',
        color: AppColors.forest,
    },
    buttonContainer: {
        width: '100%',
    },
    morphRow: {
        position: 'relative',
        height: BUTTON_ROW_HEIGHT,
        zIndex: 1,
    },
    overlayButton: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
    },
    revealRow: {
        overflow: 'hidden',
        zIndex: 1,
    },
    appleRowLayer: {
        zIndex: 2,
    },
    emailRowLayer: {
        zIndex: 3,
    },
    switchRow: {
        minHeight: 48,
    },
    switchOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
    },
});
