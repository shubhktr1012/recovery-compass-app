import { supabase } from '@/lib/supabase';

export type MandatoryUpdatePlatform = 'ios' | 'android';

export interface AppRuntimeConfig {
  androidStoreUrl: string;
  iosStoreUrl: string;
  isEnabled: boolean;
  minSupportedVersionAndroid: string;
  minSupportedVersionIos: string;
}

export interface MandatoryUpdateState {
  body: string;
  ctaLabel: string;
  isBlocking: boolean;
  storeUrl: string | null;
  title: string;
  visible: boolean;
}

const DEFAULT_UPDATE_TITLE = 'Update required';
const DEFAULT_UPDATE_BODY = 'Please update the app for the best experience.';
const DEFAULT_UPDATE_CTA = 'Update Now';
export const DEFAULT_IOS_STORE_URL =
  'https://apps.apple.com/in/app/recovery-compass-wellness/id6761656102';
export const DEFAULT_ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.recoverycompass.app&hl=en_IN';

function resolvePlatformStoreUrl(
  platform: MandatoryUpdatePlatform,
  configuredUrl?: string | null
): string {
  const trimmed = configuredUrl?.trim();
  if (trimmed) {
    return trimmed;
  }

  return platform === 'ios' ? DEFAULT_IOS_STORE_URL : DEFAULT_ANDROID_STORE_URL;
}

export function getHttpsStoreUrl(
  storeUrl: string | null | undefined,
  platform: MandatoryUpdatePlatform | string
): string {
  const resolvedPlatform = platform === 'ios' ? 'ios' : 'android';
  return resolvePlatformStoreUrl(resolvedPlatform, storeUrl);
}

export function buildStoreUrlCandidates(
  storeUrl: string | null | undefined,
  platform: MandatoryUpdatePlatform | string
): string[] {
  const resolvedPlatform = platform === 'ios' ? 'ios' : 'android';
  const httpsUrl = resolvePlatformStoreUrl(resolvedPlatform, storeUrl);
  const candidates: string[] = [];

  if (resolvedPlatform === 'ios' && httpsUrl.includes('apps.apple.com')) {
    const appId = httpsUrl.match(/id[0-9]+/)?.[0];
    if (appId) {
      candidates.push(`itms-apps://apps.apple.com/app/${appId}`);
      candidates.push(`itms-apps://itunes.apple.com/app/${appId}`);
    }
  }

  if (resolvedPlatform === 'android' && httpsUrl.includes('play.google.com/store/apps/details')) {
    const packageName = httpsUrl.match(/[?&]id=([^&]+)/)?.[1];
    if (packageName) {
      candidates.push(`market://details?id=${packageName}`);
      const genericPlayUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
      if (genericPlayUrl !== httpsUrl) {
        candidates.push(genericPlayUrl);
      }
    }
  }

  candidates.push(httpsUrl);

  return [...new Set(candidates)];
}

function parseVersion(value: string | null | undefined): number[] | null {
  const normalized = value?.trim();
  if (!normalized || !/^[0-9]+(\.[0-9]+){0,2}$/.test(normalized)) {
    return null;
  }

  const parts = normalized.split('.').map((part) => Number.parseInt(part, 10));
  while (parts.length < 3) {
    parts.push(0);
  }

  return parts.slice(0, 3);
}

export function compareSemanticVersions(
  currentVersion: string | null | undefined,
  minimumVersion: string | null | undefined
) {
  const current = parseVersion(currentVersion);
  const minimum = parseVersion(minimumVersion);

  if (!current || !minimum) {
    return 0;
  }

  for (let index = 0; index < 3; index += 1) {
    if (current[index] < minimum[index]) return -1;
    if (current[index] > minimum[index]) return 1;
  }

  return 0;
}

export function isVersionBelowMinimum(
  currentVersion: string | null | undefined,
  minimumVersion: string | null | undefined
) {
  return compareSemanticVersions(currentVersion, minimumVersion) < 0;
}

export function resolveMandatoryUpdateState(args: {
  config: AppRuntimeConfig | null;
  currentVersion: string | null | undefined;
  platform: MandatoryUpdatePlatform | string;
}): MandatoryUpdateState {
  const platform = args.platform === 'ios' ? 'ios' : 'android';
  const config = args.config;
  const minimumVersion = platform === 'ios'
    ? config?.minSupportedVersionIos
    : config?.minSupportedVersionAndroid;
  const storeUrl = resolvePlatformStoreUrl(
    platform,
    platform === 'ios' ? config?.iosStoreUrl : config?.androidStoreUrl
  );
  const visible = Boolean(
    config?.isEnabled &&
    storeUrl &&
    isVersionBelowMinimum(args.currentVersion, minimumVersion)
  );

  return {
    body: DEFAULT_UPDATE_BODY,
    ctaLabel: DEFAULT_UPDATE_CTA,
    isBlocking: visible,
    storeUrl: visible ? storeUrl ?? null : null,
    title: DEFAULT_UPDATE_TITLE,
    visible,
  };
}

export function resolveMandatoryUpdatePreviewState(args: {
  config: AppRuntimeConfig | null;
  platform: MandatoryUpdatePlatform | string;
}): MandatoryUpdateState {
  const platform = args.platform === 'ios' ? 'ios' : 'android';
  const storeUrl = resolvePlatformStoreUrl(
    platform,
    platform === 'ios' ? args.config?.iosStoreUrl : args.config?.androidStoreUrl
  );

  return {
    body: DEFAULT_UPDATE_BODY,
    ctaLabel: DEFAULT_UPDATE_CTA,
    isBlocking: true,
    storeUrl,
    title: DEFAULT_UPDATE_TITLE,
    visible: true,
  };
}

function normalizeAppRuntimeConfig(row: Record<string, unknown> | null): AppRuntimeConfig | null {
  if (!row) {
    return null;
  }

  return {
    androidStoreUrl: typeof row.android_store_url === 'string' ? row.android_store_url : '',
    iosStoreUrl: typeof row.ios_store_url === 'string' ? row.ios_store_url : '',
    isEnabled: row.is_enabled !== false,
    minSupportedVersionAndroid:
      typeof row.min_supported_version_android === 'string'
        ? row.min_supported_version_android
        : '0.0.0',
    minSupportedVersionIos:
      typeof row.min_supported_version_ios === 'string'
        ? row.min_supported_version_ios
        : '0.0.0',
  };
}

export async function fetchAppRuntimeConfig(): Promise<AppRuntimeConfig | null> {
  const { data, error } = await (supabase as any)
    .from('app_runtime_config')
    .select(
      'is_enabled, min_supported_version_ios, min_supported_version_android, ios_store_url, android_store_url'
    )
    .eq('id', 'production')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeAppRuntimeConfig((data as Record<string, unknown> | null) ?? null);
}
