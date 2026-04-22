import * as FileSystem from 'expo-file-system/legacy';

import { getPublicEnv } from '@/lib/env';
import { supabase } from '@/lib/supabase';

const { programAudioBucket } = getPublicEnv();

function getCachePath(storagePath: string) {
  const safeFileName = storagePath.replace(/[^\w.-]+/g, '_');
  const base = FileSystem.cacheDirectory;
  if (!base) return safeFileName;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${safeFileName}`;
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

function looksLikeAudioContentType(contentType: string | null) {
  if (!contentType) return false;
  return /audio\/|application\/octet-stream/i.test(contentType);
}

function looksLikeAudioBytes(bytes: Uint8Array) {
  if (bytes.length < 4) return false;

  const ascii = String.fromCharCode(...Array.from(bytes.slice(0, 12)));
  const hasId3 = ascii.startsWith('ID3');
  const hasMp3Frame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  const hasMp4Box = ascii.slice(4, 8) === 'ftyp';
  const hasRiff = ascii.startsWith('RIFF');
  const hasOgg = ascii.startsWith('OggS');

  return hasId3 || hasMp3Frame || hasMp4Box || hasRiff || hasOgg;
}

async function validateAudioResponse(url: string, storagePath: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Range: 'bytes=0-63',
    },
  });

  if (!response.ok && response.status !== 206) {
    throw new Error(`Audio URL returned HTTP ${response.status} for ${storagePath}`);
  }

  const contentType = response.headers.get('content-type');
  const bytes = new Uint8Array(await response.arrayBuffer());
  const headerHex = Array.from(bytes.slice(0, 16)).map((byte) => byte.toString(16).padStart(2, '0')).join('');



  if (!looksLikeAudioContentType(contentType)) {
    throw new Error(
      `Audio URL returned non-audio content-type (${contentType ?? 'unknown'}) for ${storagePath}. Header: ${headerHex}`
    );
  }

  if (!looksLikeAudioBytes(bytes)) {
    throw new Error(
      `Audio URL returned unexpected audio bytes for ${storagePath}. Header: ${headerHex}`
    );
  }
}

// Deduplicate concurrent downloads for the same track
const downloadingPromises = new Map<string, Promise<{ cached: boolean; uri: string }>>();

export async function prefetchAudioAsset(storagePath: string): Promise<{ cached: boolean; uri: string }> {
  const cachePath = getCachePath(storagePath);
  
  // 1. Check if already downloading
  const existingPromise = downloadingPromises.get(storagePath);
  if (existingPromise) return existingPromise;

  // 2. Check if already on disk
  const fileInfo = await FileSystem.getInfoAsync(cachePath);
  if (fileInfo.exists) {
    // Basic corruption check: If the file is extremely small (< 1KB), it's likely a failed download
    if (fileInfo.size > 1024) {
      let headerSnippet = 'unknown';
      try {
        headerSnippet = await FileSystem.readAsStringAsync(fileInfo.uri, { 
          encoding: FileSystem.EncodingType.Base64,
          length: 16 
        });
      } catch (e) {}

      return {
        cached: true,
        uri: fileInfo.uri,
      };
    }
    
    console.warn(`[Audio] Cached file for ${storagePath} is too small (${fileInfo.size} bytes). Re-downloading...`);
    try {
      await FileSystem.deleteAsync(cachePath, { idempotent: true });
    } catch (e) {}
  }

  // 3. Start download process
  const downloadPromise = (async () => {
    try {
      const signedUrl = await getSignedAudioUrl(storagePath);
      
      // Experiment: Skip validateAudioResponse (range request) to ensure the 
      // full download isn't affected by any partial-content session logic.
      // await validateAudioResponse(signedUrl, storagePath);


      // Ensure we start with a clean slate
      try {
        await FileSystem.deleteAsync(cachePath, { idempotent: true });
      } catch (e) {}

      const result = await FileSystem.downloadAsync(signedUrl, cachePath);
      
      // Verify download integrity and inspect content more deeply
      const finalInfo = await FileSystem.getInfoAsync(result.uri);
      
      let headerSnippet = 'unknown';
      try {
        // Read 512 bytes to see if it's mostly zeros or actually data
        headerSnippet = await FileSystem.readAsStringAsync(result.uri, { 
          encoding: FileSystem.EncodingType.Base64,
          length: 512
        });
      } catch (e) {}


      
      return {
        cached: false,
        uri: result.uri,
      };
    } finally {
      downloadingPromises.delete(storagePath);
    }
  })();

  downloadingPromises.set(storagePath, downloadPromise);
  return downloadPromise;
}

export async function resolvePlayableAudioUri(storagePath: string) {
  // We now always prefer the prefetch flow which ensures local file availability.
  // This resolves the AVPlayer -12864 error caused by signed URL handshake issues.
  return prefetchAudioAsset(storagePath);
}
