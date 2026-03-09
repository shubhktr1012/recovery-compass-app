import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { ExpoSecureStoreAdapter } from './storage';
import { Database } from '../types/database.types';
import { validatePublicEnv } from './env';

const { supabaseAnonKey, supabaseUrl } = validatePublicEnv();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter, // Use SecureStore instead of AsyncStorage
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
