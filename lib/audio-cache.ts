import * as FileSystem from 'expo-file-system/legacy';

import { validatePublicEnv } from '@/lib/env';
import { supabase } from '@/lib/supabase';

const { programAudioBucket } = validatePublicEnv();

function getCachePath(storagePath: string) {
  const safeFileName = storagePath.replace(/[^\w.-]+/g, '_');
  return `${FileSystem.documentDirectory ?? ''}${safeFileName}`;
}

export async function getCachedAudioUri(storagePath: string) {
  const cachePath = getCachePath(storagePath);
  const fileInfo = await FileSystem.getInfoAsync(cachePath);

  return fileInfo.exists ? fileInfo.uri : null;
}

async function getSignedAudioUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(programAudioBucket)
    .createSignedUrl(storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    throw error ?? new Error('Audio URL could not be created.');
  }

  return data.signedUrl;
}

export async function prefetchAudioAsset(storagePath: string) {
  const cachedUri = await getCachedAudioUri(storagePath);

  if (cachedUri) {
    return {
      cached: true,
      uri: cachedUri,
    };
  }

  const signedUrl = await getSignedAudioUrl(storagePath);

  if (!FileSystem.documentDirectory) {
    return {
      cached: false,
      uri: signedUrl,
    };
  }

  try {
    const downloadResult = await FileSystem.downloadAsync(signedUrl, getCachePath(storagePath));
    return {
      cached: true,
      uri: downloadResult.uri,
    };
  } catch {
    return {
      cached: false,
      uri: signedUrl,
    };
  }
}

export async function resolvePlayableAudioUri(storagePath: string) {
  return prefetchAudioAsset(storagePath);
}
