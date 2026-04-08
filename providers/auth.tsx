import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';

import Purchases from 'react-native-purchases';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient, QUERY_PERSIST_STORAGE_KEY } from './query';
import { AccessService } from '@/lib/access/service';
import { getPublicEnv, getPublicEnvState } from '@/lib/env';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isRecoveringPassword: boolean;
  isLoading: boolean;
  clearPasswordRecoveryState: () => void;
  deleteAccount: () => Promise<void>;
  signInWithOTP: (email: string) => Promise<{ error: unknown }>;
  signInWithGoogleIdToken: (idToken: string) => Promise<{ error: unknown; user: User | null }>;
  signInWithAppleIdToken: (idToken: string, nonce?: string) => Promise<{ error: unknown; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isRecoveringPassword: false,
  isLoading: true,
  clearPasswordRecoveryState: () => {},
  deleteAccount: async () => {},
  signInWithOTP: async () => ({ error: null }),
  signInWithGoogleIdToken: async () => ({ error: null, user: null }),
  signInWithAppleIdToken: async () => ({ error: null, user: null }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const publicEnvState = getPublicEnvState();
const { supabaseAnonKey, supabaseUrl } = getPublicEnv();
const SESSION_EXPIRED_NOTICE_KEY = 'auth:session-expired-notice';

function isStaleRefreshTokenError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code : null;
  const message = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';

  return (
    code === 'refresh_token_not_found' ||
    code === 'refresh_token_already_used' ||
    (message.includes('invalid refresh token') && message.includes('refresh token not found'))
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const handleAuthDeepLink = async (url: string) => {
      try {
        const [baseUrl, hash = ''] = url.split('#');
        const parsedUrl = new URL(baseUrl);
        const searchParams = new URLSearchParams(parsedUrl.search);
        const hashParams = new URLSearchParams(hash);

        const accessToken = hashParams.get('access_token') ?? searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') ?? searchParams.get('refresh_token');
        const flowType = hashParams.get('type') ?? searchParams.get('type');

        if (flowType === 'recovery' && isMounted) {
          setIsRecoveringPassword(true);
        }

        if (!accessToken || !refreshToken) return;

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Error handling auth deep link:', error);
      }
    };

    const initializeAuth = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleAuthDeepLink(initialUrl);
        }

        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          if (isStaleRefreshTokenError(sessionError)) {
            await AsyncStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, '1');

            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch (localSignOutError) {
              console.warn('Failed to clear stale Supabase session locally', localSignOutError);
            }

            await clearLocalSessionState();
            return;
          }

          throw sessionError;
        }

        if (!isMounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error loading initial session:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthDeepLink(url);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('Auth Event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveringPassword(true);
      } else if (event === 'SIGNED_OUT') {
        setIsRecoveringPassword(false);
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      linkingSubscription.remove();
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // emailRedirectTo: 'recovery-compass://auth/callback',
      },
    });
    return { error };
  };

  const signInWithGoogleIdToken = async (idToken: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    return { error, user: data.user };
  };

  const signInWithAppleIdToken = async (idToken: string, nonce?: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: idToken,
      nonce,
    });

    return { error, user: data.user };
  };

  const clearLocalSessionState = async () => {
    queryClient.clear();

    try {
      await AsyncStorage.removeItem(QUERY_PERSIST_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear offline query cache', e);
    }

    try {
      await AccessService.clear();
    } catch (e) {
      console.error('Failed to clear program access cache', e);
    }

    try {
      await Purchases.logOut();
    } catch (e) {
      console.error('Failed to log out RevenueCat user', e);
    }

    setSession(null);
    setUser(null);
    setIsRecoveringPassword(false);
    setIsLoading(false);
  };

  const clearPasswordRecoveryState = () => {
    setIsRecoveringPassword(false);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }

    await clearLocalSessionState();
  };

  const deleteAccount = async () => {
    if (!publicEnvState.isValid) {
      throw new Error(publicEnvState.errorMessage ?? 'App configuration is incomplete.');
    }

    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession();

    if (refreshError) {
      throw new Error('Your session expired. Please sign in again and retry account deletion.');
    }

    if (!refreshedSession?.access_token) {
      throw new Error('No active session found. Please sign in again and retry account deletion.');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshedSession.access_token}`,
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const rawText = await response.text();
      let message = `Delete account failed (${response.status})`;

      if (rawText) {
        try {
          const payload = JSON.parse(rawText) as { error?: unknown; message?: unknown };
          if (typeof payload.error === 'string') {
            message = payload.error;
          } else if (typeof payload.message === 'string') {
            message = payload.message;
          } else {
            message = rawText;
          }
        } catch {
          message = rawText;
        }
      }

      console.error('Delete-account HTTP failure', {
        body: rawText,
        status: response.status,
      });
      throw new Error(message);
    }

    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.warn('Delete-account cleanup sign-out failed; clearing local session anyway.', signOutError);
    }

    await clearLocalSessionState();
  };

  return (
    <AuthContext.Provider
      value={{
        clearPasswordRecoveryState,
        deleteAccount,
        isRecoveringPassword,
        session,
        user,
        isLoading,
        signInWithOTP,
        signInWithGoogleIdToken,
        signInWithAppleIdToken,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
