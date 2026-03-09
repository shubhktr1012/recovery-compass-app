import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import Purchases from 'react-native-purchases';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient, QUERY_PERSIST_STORAGE_KEY } from './query';
import { AccessService } from '@/lib/access/service';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithOTP: (email: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signInWithOTP: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

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

  const signOut = async () => {
    // 1. Sign out of Supabase auth first.
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }

    // 2. Clear query client in-memory cache.
    queryClient.clear();

    // 3. Clear offline persisted queries.
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
  };

  return (
    <AuthContext.Provider
      value={{
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
