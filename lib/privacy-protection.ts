import { useCallback, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

type PrivacyProtectionNativeModule = {
  setEnabled: (enabled: boolean) => void;
};

const nativePrivacyProtection =
  Platform.OS === 'ios' || Platform.OS === 'android'
    ? (NativeModules.PrivacyProtection as PrivacyProtectionNativeModule | undefined)
    : undefined;

const activeScopes = new Set<string>();
let nextScopeId = 0;
let currentNativeState = false;
let didWarnMissingNativeModule = false;

export function isScreenCaptureAllowed() {
  return process.env.EXPO_PUBLIC_ALLOW_SCREEN_CAPTURE === 'true';
}

function setNativePrivacyProtectionEnabled(enabled: boolean) {
  if (currentNativeState === enabled) {
    return;
  }

  currentNativeState = enabled;

  if (!nativePrivacyProtection?.setEnabled) {
    if (__DEV__ && !didWarnMissingNativeModule) {
      didWarnMissingNativeModule = true;
      console.warn('PrivacyProtection native module is unavailable. Rebuild the native app to enable scoped screenshot protection.');
    }
    return;
  }

  nativePrivacyProtection.setEnabled(enabled);
}

function applyPrivacyProtectionState() {
  if (isScreenCaptureAllowed()) {
    setNativePrivacyProtectionEnabled(false);
    return;
  }

  setNativePrivacyProtectionEnabled(activeScopes.size > 0);
}

/** Clears scoped protection when store-asset screenshot mode is enabled. */
export function ensureScreenCaptureAllowedOnLaunch() {
  if (!isScreenCaptureAllowed()) {
    return;
  }

  activeScopes.clear();
  applyPrivacyProtectionState();
}

export function useScopedPrivacyProtection(enabled: boolean, scopeName = 'protected-screen') {
  const scopeIdRef = useRef<string | null>(null);

  if (!scopeIdRef.current) {
    nextScopeId += 1;
    scopeIdRef.current = `${scopeName}:${nextScopeId}`;
  }

  useFocusEffect(
    useCallback(() => {
      if (isScreenCaptureAllowed() || !enabled || !scopeIdRef.current) {
        return undefined;
      }

      const scopeId = scopeIdRef.current;
      activeScopes.add(scopeId);
      applyPrivacyProtectionState();

      return () => {
        activeScopes.delete(scopeId);
        applyPrivacyProtectionState();
      };
    }, [enabled])
  );
}
