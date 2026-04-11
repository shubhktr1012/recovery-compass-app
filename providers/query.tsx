import React, { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { CONTENT_QUERY_GC_TIME, CONTENT_QUERY_STALE_TIME } from '@/hooks/contentQueryUtils';

export const QUERY_PERSIST_STORAGE_KEY = 'REACT_QUERY_OFFLINE_CACHE';
const DEFAULT_QUERY_STALE_TIME = 60 * 1000;
const DEFAULT_QUERY_GC_TIME = 24 * 60 * 60 * 1000;
const PROFILE_QUERY_STALE_TIME = 2 * 60 * 1000;
const ONBOARDING_QUERY_STALE_TIME = 10 * 60 * 1000;
const JOURNAL_QUERY_STALE_TIME = 60 * 1000;
const PERSISTED_QUERY_MAX_AGE = 24 * 60 * 60 * 1000;

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
      staleTime: DEFAULT_QUERY_STALE_TIME,
      gcTime: DEFAULT_QUERY_GC_TIME,
      retry: 1,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

queryClient.setQueryDefaults(['profile'], {
  staleTime: PROFILE_QUERY_STALE_TIME,
  gcTime: DEFAULT_QUERY_GC_TIME,
});

queryClient.setQueryDefaults(['onboarding-response'], {
  staleTime: ONBOARDING_QUERY_STALE_TIME,
  gcTime: DEFAULT_QUERY_GC_TIME,
});

queryClient.setQueryDefaults(['programs'], {
  staleTime: CONTENT_QUERY_STALE_TIME,
  gcTime: CONTENT_QUERY_GC_TIME,
  refetchOnWindowFocus: false,
});

queryClient.setQueryDefaults(['program'], {
  staleTime: CONTENT_QUERY_STALE_TIME,
  gcTime: CONTENT_QUERY_GC_TIME,
  refetchOnWindowFocus: false,
});

queryClient.setQueryDefaults(['program-day'], {
  staleTime: CONTENT_QUERY_STALE_TIME,
  gcTime: CONTENT_QUERY_GC_TIME,
  refetchOnWindowFocus: false,
});

queryClient.setQueryDefaults(['journal-today'], {
  staleTime: JOURNAL_QUERY_STALE_TIME,
  gcTime: DEFAULT_QUERY_GC_TIME,
});

queryClient.setQueryDefaults(['journal-entries'], {
  staleTime: JOURNAL_QUERY_STALE_TIME,
  gcTime: DEFAULT_QUERY_GC_TIME,
});

queryClient.setQueryDefaults(['journal-count'], {
  staleTime: JOURNAL_QUERY_STALE_TIME,
  gcTime: DEFAULT_QUERY_GC_TIME,
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
        maxAge: PERSISTED_QUERY_MAX_AGE,
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
