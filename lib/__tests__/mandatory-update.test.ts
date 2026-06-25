import { describe, expect, it, vi } from 'vitest';

import {
  buildStoreUrlCandidates,
  compareSemanticVersions,
  DEFAULT_ANDROID_STORE_URL,
  DEFAULT_IOS_STORE_URL,
  getHttpsStoreUrl,
  isVersionBelowMinimum,
  resolveMandatoryUpdatePreviewState,
  resolveMandatoryUpdateState,
  type AppRuntimeConfig,
} from '@/lib/mandatory-update';

vi.mock('@/lib/supabase', () => ({
  supabase: {},
}));

const config: AppRuntimeConfig = {
  androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.recoverycompass.app&hl=en_IN',
  iosStoreUrl: 'https://apps.apple.com/in/app/recovery-compass-wellness/id6761656102',
  isEnabled: true,
  minSupportedVersionAndroid: '1.1.4',
  minSupportedVersionIos: '1.1.4',
};

describe('mandatory update gate', () => {
  it('compares semantic app versions', () => {
    expect(compareSemanticVersions('1.1.3', '1.1.4')).toBe(-1);
    expect(compareSemanticVersions('1.1.4', '1.1.4')).toBe(0);
    expect(compareSemanticVersions('1.2.0', '1.1.4')).toBe(1);
    expect(compareSemanticVersions('2', '1.9.9')).toBe(1);
  });

  it('does not block when version values are missing or malformed', () => {
    expect(isVersionBelowMinimum(null, '1.1.4')).toBe(false);
    expect(isVersionBelowMinimum('1.1.4', null)).toBe(false);
    expect(isVersionBelowMinimum('local-dev', '1.1.4')).toBe(false);
    expect(isVersionBelowMinimum('1.1.4', 'bad-minimum')).toBe(false);
  });

  it('requires an update only when enabled and below the platform minimum', () => {
    expect(
      resolveMandatoryUpdateState({
        config,
        currentVersion: '1.1.3',
        platform: 'ios',
      })
    ).toMatchObject({
      ctaLabel: 'Update Now',
      isBlocking: true,
      storeUrl: 'https://apps.apple.com/in/app/recovery-compass-wellness/id6761656102',
      visible: true,
    });

    expect(
      resolveMandatoryUpdateState({
        config,
        currentVersion: '1.1.4',
        platform: 'ios',
      }).visible
    ).toBe(false);

    expect(
      resolveMandatoryUpdateState({
        config: { ...config, isEnabled: false },
        currentVersion: '1.1.3',
        platform: 'android',
      }).visible
    ).toBe(false);
  });

  it('uses the Android store URL for Android builds', () => {
    expect(
      resolveMandatoryUpdateState({
        config,
        currentVersion: '1.1.3',
        platform: 'android',
      }).storeUrl
    ).toBe('https://play.google.com/store/apps/details?id=com.recoverycompass.app&hl=en_IN');
  });

  it('uses the iOS store URL for iOS builds', () => {
    expect(
      resolveMandatoryUpdateState({
        config,
        currentVersion: '1.1.3',
        platform: 'ios',
      }).storeUrl
    ).toBe('https://apps.apple.com/in/app/recovery-compass-wellness/id6761656102');
  });

  it('can force a visible preview state for local QA', () => {
    expect(
      resolveMandatoryUpdatePreviewState({
        config,
        platform: 'ios',
      })
    ).toMatchObject({
      ctaLabel: 'Update Now',
      isBlocking: true,
      storeUrl: 'https://apps.apple.com/in/app/recovery-compass-wellness/id6761656102',
      visible: true,
    });
  });

  it('falls back to default store URLs when config fields are empty', () => {
    expect(
      resolveMandatoryUpdateState({
        config: {
          ...config,
          androidStoreUrl: '',
          iosStoreUrl: '',
        },
        currentVersion: '1.1.3',
        platform: 'ios',
      })
    ).toMatchObject({
      isBlocking: true,
      storeUrl: DEFAULT_IOS_STORE_URL,
      visible: true,
    });

    expect(
      resolveMandatoryUpdateState({
        config: {
          ...config,
          androidStoreUrl: '',
          iosStoreUrl: '',
        },
        currentVersion: '1.1.3',
        platform: 'android',
      }).storeUrl
    ).toBe(DEFAULT_ANDROID_STORE_URL);
  });

  it('builds an iOS store URL candidate chain ending with HTTPS', () => {
    expect(
      buildStoreUrlCandidates(
        'https://apps.apple.com/in/app/recovery-compass-wellness/id6761656102',
        'ios'
      )
    ).toEqual([
      'itms-apps://apps.apple.com/app/id6761656102',
      'itms-apps://itunes.apple.com/app/id6761656102',
      'https://apps.apple.com/in/app/recovery-compass-wellness/id6761656102',
    ]);
  });

  it('builds an Android store URL candidate chain with market and HTTPS fallbacks', () => {
    expect(
      buildStoreUrlCandidates(
        'https://play.google.com/store/apps/details?id=com.recoverycompass.app&hl=en_IN',
        'android'
      )
    ).toEqual([
      'market://details?id=com.recoverycompass.app',
      'https://play.google.com/store/apps/details?id=com.recoverycompass.app',
      'https://play.google.com/store/apps/details?id=com.recoverycompass.app&hl=en_IN',
    ]);
  });

  it('uses platform defaults when store URL input is empty', () => {
    expect(getHttpsStoreUrl(null, 'ios')).toBe(DEFAULT_IOS_STORE_URL);
    expect(getHttpsStoreUrl('', 'android')).toBe(DEFAULT_ANDROID_STORE_URL);
    expect(buildStoreUrlCandidates(null, 'ios')[buildStoreUrlCandidates(null, 'ios').length - 1]).toBe(
      DEFAULT_IOS_STORE_URL
    );
  });
});
