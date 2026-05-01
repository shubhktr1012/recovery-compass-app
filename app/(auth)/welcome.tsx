import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { AppColors } from '@/constants/theme';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/providers/auth';
import { getPublicEnv } from '@/lib/env';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

type OAuthProvider = 'google' | 'apple';
type LastSignInProvider = 'email' | 'google' | 'apple';

const OAUTH_LINK_NOTICE_PREFIX = 'auth:linked-provider-notice';
const LAST_SIGN_IN_PROVIDER_KEY = 'auth:last-sign-in-provider';
const SESSION_EXPIRED_NOTICE_KEY = 'auth:session-expired-notice';
const flatButtonStyle = {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
};

function getGoogleReversedClientScheme(clientId?: string | null) {
    if (!clientId) {
        return null;
    }

    const suffix = '.apps.googleusercontent.com';
    if (!clientId.endsWith(suffix)) {
        return null;
    }

    return `com.googleusercontent.apps.${clientId.slice(0, -suffix.length)}`;
}

function getAppleFullName(fullName: AppleAuthentication.AppleAuthenticationFullName | null) {
    if (!fullName) {
        return null;
    }

    const formattedName = [
        fullName.givenName,
        fullName.middleName,
        fullName.familyName,
    ]
        .filter((part): part is string => Boolean(part?.trim()))
        .join(' ')
        .trim();

    return formattedName || fullName.nickname?.trim() || null;
}

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [authProviderLoading, setAuthProviderLoading] = useState<'google' | 'apple' | null>(null);
    const [lastSignInProvider, setLastSignInProvider] = useState<LastSignInProvider | null>(null);
    const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);
    const isIOS = Platform.OS === 'ios';
    const { signInWithGoogleIdToken, signInWithAppleIdToken } = useAuth();
    const {
        googleWebClientId,
        googleIosClientId,
        googleAndroidClientId,
    } = getPublicEnv();
    const googleNativeScheme =
        Platform.OS === 'ios'
            ? getGoogleReversedClientScheme(googleIosClientId)
            : getGoogleReversedClientScheme(googleAndroidClientId);
    const googleRedirectUri = AuthSession.makeRedirectUri({
        native: googleNativeScheme
            ? `${googleNativeScheme}:/oauthredirect`
            : 'recoverycompassapp:/oauthredirect',
    });
    const hasGoogleConfig = Boolean(googleWebClientId || googleIosClientId || googleAndroidClientId);
    const [googleRequest, googleAuthResponse, promptGoogleSignIn] = Google.useAuthRequest({
        webClientId: googleWebClientId ?? undefined,
        iosClientId: googleIosClientId ?? undefined,
        androidClientId: googleAndroidClientId ?? undefined,
        redirectUri: googleRedirectUri,
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

    const persistLastSignInProvider = async (provider: LastSignInProvider) => {
        try {
            await AsyncStorage.setItem(LAST_SIGN_IN_PROVIDER_KEY, provider);
            setLastSignInProvider(provider);
        } catch (error) {
            console.warn('Failed to persist last sign-in provider', error);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadWelcomeState = async () => {
            try {
                const [storedProvider, expiredNotice] = await Promise.all([
                    AsyncStorage.getItem(LAST_SIGN_IN_PROVIDER_KEY),
                    AsyncStorage.getItem(SESSION_EXPIRED_NOTICE_KEY),
                ]);

                if (
                    isMounted &&
                    (storedProvider === 'email' || storedProvider === 'google' || storedProvider === 'apple')
                ) {
                    setLastSignInProvider(storedProvider);
                }

                if (isMounted && expiredNotice === '1') {
                    setSessionExpiredNotice('Your session expired. Please sign in again.');
                }

                if (expiredNotice) {
                    await AsyncStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY);
                }
            } catch (error) {
                console.warn('Failed to read welcome screen state', error);
            }
        };

        void loadWelcomeState();

        return () => {
            isMounted = false;
        };
    }, []);

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
                await persistLastSignInProvider('google');
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

    const handleCreateAccountPress = () => {
        navigation.navigate('sign-up');
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

            const appleFullName = getAppleFullName(credential.fullName);
            if (user?.id && appleFullName) {
                const updatedAt = new Date().toISOString();
                const { data: existingProfile, error: profileFetchError } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileFetchError) {
                    console.warn('Failed to read profile before persisting Apple name', profileFetchError);
                } else if (!existingProfile?.display_name?.trim()) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert(
                            {
                                id: user.id,
                                email: user.email ?? credential.email ?? null,
                                display_name: appleFullName,
                                updated_at: updatedAt,
                            },
                            { onConflict: 'id' }
                        );

                    if (profileError) {
                        console.warn('Failed to persist Apple profile name', profileError);
                    }
                }

                const { error: metadataError } = await supabase.auth.updateUser({
                    data: { full_name: appleFullName },
                });

                if (metadataError) {
                    console.warn('Failed to persist Apple auth name', metadataError);
                }
            }

            await persistLastSignInProvider('apple');
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
                            onPress={() => openLink('https://recoverycompass.co/terms')}
                        >
                            Terms of Service
                        </ThemedText>. Learn how we process your data in our{' '}
                        <ThemedText 
                            style={styles.legalLink}
                            onPress={() => openLink('https://recoverycompass.co/privacy')}
                        >
                            Privacy Policy
                        </ThemedText>.
                    </ThemedText>

                        <View style={styles.buttonContainer}>
                        {sessionExpiredNotice ? (
                            <ThemedText style={styles.sessionExpiredHint}>
                                {sessionExpiredNotice}
                            </ThemedText>
                        ) : null}

                        {lastSignInProvider ? (
                            <ThemedText style={styles.lastProviderHint}>
                                You signed in using{' '}
                                {lastSignInProvider === 'email'
                                    ? 'Email'
                                    : lastSignInProvider === 'google'
                                      ? 'Google'
                                      : 'Apple'}{' '}
                                the last time.
                            </ThemedText>
                        ) : null}

                        <View style={styles.authButtonStack}>
                            <View style={styles.authButtonRow}>
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
                            </View>

                            {isIOS ? (
                                <View style={styles.authButtonRow}>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        icon={<Image source={require('@/assets/images/apple-logo.svg')} style={{ width: 22, height: 22, marginRight: 12, tintColor: AppColors.forest }} contentFit="contain" />}
                                        label="Sign In with Apple"
                                        onPress={() => void handleAppleSignIn()}
                                        loading={authProviderLoading === 'apple'}
                                        style={flatButtonStyle}
                                    />
                                </View>
                            ) : null}

                            <View style={styles.authButtonRow}>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    label="Sign in with Email Address"
                                    onPress={() => navigation.navigate('sign-in')}
                                    style={flatButtonStyle}
                                />
                            </View>
                        </View>

                        <Button
                            variant="ghost"
                            size="lg"
                            label="Create Account"
                            onPress={handleCreateAccountPress}
                            style={[flatButtonStyle, styles.createAccountButton]}
                        />
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
    sessionExpiredHint: {
        fontSize: 13,
        fontFamily: 'Satoshi-Medium',
        color: AppColors.forest,
        textAlign: 'center',
        marginBottom: 10,
    },
    lastProviderHint: {
        fontSize: 13,
        fontFamily: 'Satoshi-Medium',
        color: AppColors.iconMuted,
        textAlign: 'center',
        marginBottom: 14,
    },
    authButtonStack: {
        gap: 8,
    },
    authButtonRow: {
        width: '100%',
    },
    createAccountButton: {
        marginTop: 8,
    },
});
