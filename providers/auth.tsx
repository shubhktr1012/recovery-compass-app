import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import Purchases from 'react-native-purchases';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient, QUERY_PERSIST_STORAGE_KEY } from './query';
import { AccessService } from '@/lib/access/service';
import { validatePublicEnv } from '@/lib/env';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  deleteAccount: () => Promise<void>;
  signInWithOTP: (email: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  deleteAccount: async () => {},
  signInWithOTP: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const { supabaseAnonKey, supabaseUrl } = validatePublicEnv();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error loading initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('Auth Event:', event);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
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
    setIsLoading(false);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }

    await clearLocalSessionState();
  };

  const deleteAccount = async () => {
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
        deleteAccount,
        session,
        user,
        isLoading,
        signInWithOTP,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
