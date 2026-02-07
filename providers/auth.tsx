import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';

// Define the shape of our Auth Context
interface AuthContextType {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    signInWithOTP: (email: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    signInWithOTP: async () => ({ error: null }),
    signOut: async () => { },
});

// Hook to use the Auth Context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Initial Session Check
        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);
                setUser(initialSession?.user ?? null);
            } catch (error) {
                console.error('Error loading initial session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // 2. Listen for Auth Changes (Sign In, Sign Out, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // 3. Auth Actions
    const signInWithOTP = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                // We'll set this up later for deep linking back to the app
                // emailRedirectTo: 'recovery-compass://auth/callback', 
            }
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, isLoading, signInWithOTP, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
