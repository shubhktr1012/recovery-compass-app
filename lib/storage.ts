import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

export const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        if (Platform.OS === 'web') {
            if (typeof localStorage === 'undefined') return Promise.resolve(null);
            return Promise.resolve(localStorage.getItem(key));
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        if (Platform.OS === 'web') {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(key, value);
            return Promise.resolve();
        }
        return SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        if (Platform.OS === 'web') {
            if (typeof localStorage === 'undefined') return;
            localStorage.removeItem(key);
            return Promise.resolve();
        }
        return SecureStore.deleteItemAsync(key);
    },
};

import AsyncStorage from '@react-native-async-storage/async-storage';

export const AppStorage = {
    setItem: async (key: string, value: string) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (e) {
            console.error('Error saving data', e);
        }
    },
    getItem: async (key: string) => {
        try {
            return await AsyncStorage.getItem(key);
        } catch (e) {
            console.error('Error reading data', e);
            return null;
        }
    },
    removeItem: async (key: string) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing data', e);
        }
    }
};
