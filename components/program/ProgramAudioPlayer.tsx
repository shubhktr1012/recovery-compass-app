import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

import { getCachedAudioUri, prefetchAudioAsset, resolvePlayableAudioUri } from '@/lib/audio-cache';
import { captureError } from '@/lib/monitoring';
import { ProgramDayAudio } from '@/lib/programs/types';
import { AppColors } from '@/constants/theme';

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL SINGLETON — only one player can own audio output at a time
// ─────────────────────────────────────────────────────────────────────────────
let activePlayerOwner: symbol | null = null;
let stopActivePlayer: null | (() => Promise<void>) = null;

function isDisposedPlayerError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  return (
    message.includes('NativeSharedObjectNotFoundException') ||
    message.includes('Unable to find the native shared object')
  );
}

function getPlaybackErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  if (message.includes('Object not found')) {
    return 'This audio file is not available in storage yet.';
  }

  if (message.includes('Audio URL could not be created')) {
    return 'We could not create a playable audio link right now.';
  }

  if (message.includes('Audio URL returned HTTP')) {
    return 'The audio file could not be fetched from storage right now.';
  }

  if (message.includes('non-audio content-type')) {
    return 'The storage response did not contain a valid audio file.';
  }

  if (message.includes('unexpected audio bytes')) {
    return 'The audio file format in storage does not look playable yet.';
  }

  return 'Audio could not be played right now.';
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: useProgramAudioPlayback
// Extracts all audio playback logic so any UI can drive playback.
// ─────────────────────────────────────────────────────────────────────────────
export interface AudioPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  isCached: boolean;
  isPrefetching: boolean;
  error: string | null;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds (from metadata or loaded source) */
  duration: number;
  /** Progress fraction 0–1 */
  progress: number;
  togglePlayback: () => void;
  seekTo: (positionSeconds: number) => void;
}

export function useProgramAudioPlayback(
  storagePath: string,
  durationSeconds?: number | null,
  title?: string,
): AudioPlaybackState {
  const player = useAudioPlayer(null, { updateInterval: 250, downloadFirst: false });
  const status = useAudioPlayerStatus(player);
  const instanceIdRef = useRef(Symbol(storagePath));
  const isMountedRef = useRef(true);
  const loadRequestIdRef = useRef(0);
  const pendingPlayRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);

  const setIsLoadingIfMounted = useCallback((value: boolean) => {
    if (isMountedRef.current) {
      setIsLoading(value);
    }
  }, []);

  const setErrorIfMounted = useCallback((value: string | null) => {
    if (isMountedRef.current) {
      setError(value);
    }
  }, []);

  const releaseOwnership = useCallback(() => {
    if (activePlayerOwner === instanceIdRef.current) {
      activePlayerOwner = null;
      stopActivePlayer = null;
    }
  }, []);

  const runPlayerCall = useCallback((callback: () => void, context: string) => {
    try {
      callback();
    } catch (error) {
      if (!isDisposedPlayerError(error)) {
        console.warn(`Audio player call failed during ${context}`, error);
      }
    }
  }, []);

  const activateLockScreenControls = useCallback(() => {
    if (!isMountedRef.current || !player) return;
    
    try {
      // setActiveForLockScreen is the primary entry point for lock screen integration in expo-audio.
      // We pass the title and a default artist.
      player.setActiveForLockScreen(true, {
        title: title || 'Audio Session',
        artist: 'Recovery Compass',
      });
    } catch (err) {
      // We catch potential NativeSharedObjectNotFoundException if the player 
      // was disposed between the call and native execution.
      console.warn('[Audio] Failed to activate lock screen controls:', err);
    }
  }, [player, title]);

  const deactivateLockScreenControls = useCallback(() => {
    if (!player) return;
    
    try {
      player.clearLockScreenControls();
      player.setActiveForLockScreen(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Silent fail on deactivation as the object might already be gone.
    }
  }, [player]);

  const stopPlayback = useCallback(async () => {
    loadRequestIdRef.current += 1;
    pendingPlayRef.current = false;
    setIsLoadingIfMounted(false);

    try {
      if (status.isLoaded) {
        if (status.playing) {
          runPlayerCall(() => {
            player.pause();
          }, 'pause during stop');
        }

        if (status.currentTime > 0) {
          try {
            await player.seekTo(0);
          } catch (error) {
            if (!isDisposedPlayerError(error)) {
              console.warn('Audio seek cleanup warning:', error);
            }
          }
        }
      }
    } catch (e) {
      if (!isDisposedPlayerError(e)) {
        console.warn('Audio cleanup warning:', e);
      }
    } finally {
      deactivateLockScreenControls();
      releaseOwnership();
    }
  }, [deactivateLockScreenControls, player, releaseOwnership, runPlayerCall, setIsLoadingIfMounted, status.currentTime, status.isLoaded, status.playing]);

  const claimPlaybackOwnership = useCallback(async () => {
    if (activePlayerOwner === instanceIdRef.current) {
      stopActivePlayer = stopPlayback;
      return;
    }

    if (stopActivePlayer) {
      await stopActivePlayer();
    }

    activePlayerOwner = instanceIdRef.current;
    stopActivePlayer = stopPlayback;
  }, [stopPlayback]);

  // Configure audio mode
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      // Explicit fallbacks for older Expo versions or specific edge cases
      interruptionModeIOS: 'doNotMix',
      interruptionModeAndroid: 'doNotMix',
    } as any);
  }, []);

  // Warm audio cache on mount
  useEffect(() => {
    let isCancelled = false;

    const warmAudioCache = async () => {
      try {
        const cachedUri = await getCachedAudioUri(storagePath);
        if (cachedUri) {
          if (!isCancelled) {
            setIsCached(true);
          }
          return;
        }

        if (!isCancelled) {
          setIsPrefetching(true);
        }

        const result = await prefetchAudioAsset(storagePath);

        if (!isCancelled) {
          setIsCached(result.cached);
        }
      } catch {
        if (!isCancelled) {
          setIsCached(false);
        }
      } finally {
        if (!isCancelled) {
          setIsPrefetching(false);
        }
      }
    };

    void warmAudioCache();

    return () => {
      isCancelled = true;
    };
  }, [storagePath]);

  // Keep the global stop reference up to date
  const stopPlaybackRef = useRef(stopPlayback);
  stopPlaybackRef.current = stopPlayback;

  useEffect(() => {
    stopActivePlayer = activePlayerOwner === instanceIdRef.current ? stopPlayback : stopActivePlayer;
  }, [stopPlayback]);

  // Cleanup on unmount ONLY — use a ref so this effect has no deps
  // and never re-runs (which was previously killing the player mid-load).
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      void stopPlaybackRef.current();
    };
   
  }, []);

  useEffect(() => {
    if (!pendingPlayRef.current || !status.isLoaded) return;

    pendingPlayRef.current = false;
    activateLockScreenControls();
    runPlayerCall(() => {
      player.play();
    }, 'play after load');
    setIsLoadingIfMounted(false);
  }, [activateLockScreenControls, player, runPlayerCall, setIsLoadingIfMounted, status.isLoaded]);

  // Remote control / background logic is handled by expo-audio mode settings.
  // We remove the explicit auto-stop on app background to allow background listening.

  useEffect(() => {
    if (status.didJustFinish) {
      deactivateLockScreenControls();
      releaseOwnership();
    }
  }, [status.didJustFinish, deactivateLockScreenControls, releaseOwnership]);

  const togglePlayback = useCallback(() => {
    const handleToggle = async () => {
      if (isLoading) return;

      try {
        setErrorIfMounted(null);

        if (status.isLoaded) {
          if (status.playing) {
            runPlayerCall(() => {
              player.pause();
            }, 'pause');
            deactivateLockScreenControls();
            releaseOwnership();
            return;
          }

          await claimPlaybackOwnership();
          activateLockScreenControls();
          runPlayerCall(() => {
            player.play();
          }, 'resume playback');
          return;
        }

        await claimPlaybackOwnership();
        const requestId = loadRequestIdRef.current + 1;
        loadRequestIdRef.current = requestId;
        setIsLoadingIfMounted(true);
        const { uri, cached } = await resolvePlayableAudioUri(storagePath);

        if (!isMountedRef.current || loadRequestIdRef.current !== requestId) {
          return;
        }

        setIsCached(cached);
        pendingPlayRef.current = true;
        

        runPlayerCall(() => {
          player.replace(uri);
        }, 'replace source');
        
        setIsLoadingIfMounted(true);
      } catch (playbackError) {
        pendingPlayRef.current = false;
        deactivateLockScreenControls();
        releaseOwnership();
        setIsLoadingIfMounted(false);
        console.error('Audio playback failed', playbackError);
        void captureError(playbackError, {
          source: 'audio',
          metadata: {
            storagePath,
          },
        });
        setErrorIfMounted(getPlaybackErrorMessage(playbackError));
      }
    };

    void handleToggle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activateLockScreenControls, claimPlaybackOwnership, deactivateLockScreenControls, isLoading, player, releaseOwnership, runPlayerCall, setErrorIfMounted, setIsLoadingIfMounted, status.isLoaded, status.playing, storagePath, title]);

  const seekTo = useCallback((positionSeconds: number) => {
    if (status.isLoaded) {
      void player.seekTo(positionSeconds).catch((error) => {
        if (!isDisposedPlayerError(error)) {
          console.warn('Audio seek failed', error);
        }
      });
    }
  }, [player, status.isLoaded]);

  // Derive current time and duration
  const currentTime = status.isLoaded ? status.currentTime : 0;
  const duration = status.isLoaded && status.duration > 0
    ? status.duration
    : (durationSeconds ?? 0);
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return {
    isPlaying: status.playing,
    isLoading,
    isCached,
    isPrefetching,
    error,
    currentTime,
    duration,
    progress,
    togglePlayback,
    seekTo,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: ProgramAudioPlayer (backward-compatible wrapper)
// ─────────────────────────────────────────────────────────────────────────────
interface ProgramAudioPlayerProps {
  audio: ProgramDayAudio;
  title?: string;
  embeddedDark?: boolean;
}

/**
 * BotanicalWatermark — The subtle leaf SVG used in the au2 spec.
 */
function BotanicalWatermark({ style }: { style?: any }) {
  return (
    <View style={[styles.watermarkContainer, style]}>
      <Text style={{ fontSize: 180, opacity: 0.05, color: '#E3F3E5' }}>🌿</Text>
    </View>
  );
}

export function ProgramAudioPlayer({ audio, title, embeddedDark = false }: ProgramAudioPlayerProps) {
  const {
    isPlaying,
    isLoading,
    isCached,
    isPrefetching,
    error,
    progress,
    currentTime,
    duration,
    togglePlayback,
  } = useProgramAudioPlayback(audio.storagePath, audio.durationSeconds);

  // Formatted times
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.au2Container}>
      <BotanicalWatermark style={styles.au2Bot} />
      
      <View style={styles.au2Body}>
        <Text style={styles.au2Eye}>Calm Session</Text>
        <Text style={styles.au2Title}>
          {title ? (
            <>
              {title.split(' ')[0]} <Text style={styles.au2TitleEm}>{title.split(' ').slice(1).join(' ')}</Text>
            </>
          ) : (
            <>Nervous System <Text style={styles.au2TitleEm}>Reset</Text></>
          )}
        </Text>
        <Text style={styles.au2Desc}>
          Lower cortisol. Restore the circadian rhythm. Support hormone balance.
        </Text>

        <View style={styles.au2Wave}>
          {[8, 14, 22, 34, 44, 56, 64, 56, 70, 58, 44, 50, 38, 28, 18, 12, 8, 14, 22, 30, 18, 10].map((h, i) => (
            <View 
              key={i} 
              style={[
                styles.wv, 
                { 
                  height: h, 
                  backgroundColor: i < (progress * 22) ? '#E3F3E5' : 'rgba(227,243,229,0.15)' 
                }
              ]} 
            />
          ))}
        </View>

        <View style={styles.au2Prog}>
          <View style={styles.au2Track}>
            <View style={[styles.au2Fill, { width: `${progress * 100}%` }]}>
              <View style={styles.au2Thumb} />
            </View>
          </View>
          <View style={styles.au2Times}>
            <Text style={styles.timeLabel}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
          </View>
        </View>
        
        {/* Play/Pause Control - integrated into the card for now as per spec */}
        <TouchableOpacity 
          style={styles.au2PlayBtn} 
          onPress={togglePlayback}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <ActivityIndicator color={AppColors.forest} size="small" />
          ) : (
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={24} 
              color={AppColors.forest} 
              style={!isPlaying && { marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Cache Status Badge */}
      <View style={styles.cacheBadge}>
        <View style={[
          styles.cacheDot,
          { backgroundColor: isCached ? '#4ADE80' : isPrefetching ? '#FBBF24' : 'rgba(255,255,255,0.3)' }
        ]} />
        <Text style={styles.cacheText}>
          {isCached ? 'Offline' : isPrefetching ? 'Caching' : 'Live'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  au2Container: {
    backgroundColor: '#06290C', // Forest
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 440,
    position: 'relative',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  watermarkContainer: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  au2Bot: {
    left: -40,
    bottom: -60,
    transform: [{ scaleX: -1 }, { rotate: '15deg' }],
  },
  au2Body: {
    padding: 24,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 2,
    alignItems: 'center',
  },
  au2Eye: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(227,243,229,0.35)',
    marginBottom: 12,
    textAlign: 'center',
  },
  au2Title: {
    fontFamily: 'Erode-Bold',
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  au2TitleEm: {
    fontFamily: 'Erode-MediumItalic',
    fontWeight: '400',
    color: 'rgba(227,243,229,0.8)',
  },
  au2Desc: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: 'rgba(227,243,229,0.5)',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  au2Wave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 40,
    flex: 1,
  },
  wv: {
    borderRadius: 2,
    width: 3,
  },
  au2Prog: {
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 32,
  },
  au2Track: {
    height: 3,
    backgroundColor: 'rgba(227,243,229,0.15)',
    borderRadius: 999,
    position: 'relative',
    overflow: 'visible',
  },
  au2Fill: {
    height: 3,
    backgroundColor: '#E3F3E5', // Sage
    borderRadius: 999,
  },
  au2Thumb: {
    position: 'absolute',
    right: -5,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  au2Times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    color: 'rgba(227,243,229,0.4)',
    letterSpacing: 0.4,
  },
  au2PlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F3E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 8,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'Satoshi-Bold',
  },
  cacheBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cacheDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 6,
  },
  cacheText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
