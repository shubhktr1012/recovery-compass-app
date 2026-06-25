import { describe, expect, it, vi } from 'vitest';

import {
  compareSemanticVersions,
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
});
