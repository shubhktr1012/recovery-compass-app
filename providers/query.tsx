import React, { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export const QUERY_PERSIST_STORAGE_KEY = 'REACT_QUERY_OFFLINE_CACHE';

// Set up the online manager with NetInfo to track true connectivity
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    const isOnline =
      state.isConnected !== false &&
      state.isInternetReachable !== false;
    setOnline(isOnline);
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh
      gcTime: 24 * 60 * 60 * 1000, // 24 hours of garbage collection time
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 2,
    },
  },
});

// Create the AsyncStorage persister
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_PERSIST_STORAGE_KEY,
  // Optional: add a retry schedule for failed persistence
});

export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    focusManager.setFocused(AppState.currentState === 'active');

    const onAppStateChange = (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        // Only persist exactly what we need (the profile data limits the size)
        maxAge: 24 * 60 * 60 * 1000, // 24 hours explicit max age
        buster: 'v1.0.3', // bumped to invalidate persisted content cache after six_day_reset lesson refresh
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Explicitly whitelist queries to save to plaintext AsyncStorage
            // E.g., Profile is safe. Avoid caching raw journal entries if highly sensitive.
            const safeKeys = ['profile', 'onboarding-response', 'programs', 'program', 'program-day'];
            return query.state.status === 'success' && safeKeys.some((key) => query.queryKey[0] === key);
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
