import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import {
  fetchAppRuntimeConfig,
  resolveMandatoryUpdatePreviewState,
  resolveMandatoryUpdateState,
  type MandatoryUpdateState,
} from '@/lib/mandatory-update';

const ALLOW_UPDATE_STATE: MandatoryUpdateState = {
  body: 'Please update the app for the best experience.',
  ctaLabel: 'Update Now',
  isBlocking: false,
  storeUrl: null,
  title: 'Update required',
  visible: false,
};

const FORCE_MANDATORY_UPDATE_PREVIEW =
  __DEV__ && process.env.EXPO_PUBLIC_FORCE_MANDATORY_UPDATE_PREVIEW === 'true';

export function useMandatoryAppUpdate() {
  const configQuery = useQuery({
    enabled: !FORCE_MANDATORY_UPDATE_PREVIEW,
    gcTime: 5 * 60 * 1000,
    queryFn: fetchAppRuntimeConfig,
    queryKey: ['app-runtime-config'],
    retry: false,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (configQuery.isError) {
      console.warn('Mandatory update config unavailable; allowing app access.', configQuery.error);
    }
  }, [configQuery.error, configQuery.isError]);

  useEffect(() => {
    if (FORCE_MANDATORY_UPDATE_PREVIEW) {
      console.info('Mandatory update preview is enabled.');
    }
  }, []);

  if (FORCE_MANDATORY_UPDATE_PREVIEW) {
    return {
      ...resolveMandatoryUpdatePreviewState({
        config: null,
        platform: Platform.OS,
      }),
      isLoading: false,
    };
  }

  if (configQuery.isError) {
    return {
      ...ALLOW_UPDATE_STATE,
      isLoading: false,
    };
  }

  const state = resolveMandatoryUpdateState({
    config: configQuery.data ?? null,
    currentVersion: Constants.expoConfig?.version ?? null,
    platform: Platform.OS,
  });

  return {
    ...state,
    isLoading: configQuery.isPending,
  };
}
