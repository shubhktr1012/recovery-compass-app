import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getCachedAudioUri, prefetchAudioAsset, resolvePlayableAudioUri } from '@/lib/audio-cache';
import { captureError } from '@/lib/monitoring';
import { ProgramDayAudio } from '@/lib/programs/types';
import { AppColors } from '@/constants/theme';

interface ProgramAudioPlayerProps {
  audio: ProgramDayAudio;
  embeddedDark?: boolean;
}

let activePlayerOwner: symbol | null = null;
let stopActivePlayer: null | (() => Promise<void>) = null;

export function ProgramAudioPlayer({ audio, embeddedDark = false }: ProgramAudioPlayerProps) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const isFocused = useIsFocused();
  const instanceIdRef = useRef(Symbol(audio.storagePath));
  const pendingPlayRef = useRef(false);
  const isMountedRef = useRef(true);
  const loadRequestIdRef = useRef(0);
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

  const stopPlayback = useCallback(async () => {
    loadRequestIdRef.current += 1;
    pendingPlayRef.current = false;
    setIsLoadingIfMounted(false);

    try {
      if (player.isLoaded) {
        if (player.playing || player.paused) {
          player.pause();
        }

        if (player.currentTime > 0) {
          try {
            await player.seekTo(0);
          } catch {
            // Ignore seek failures while tearing down playback.
          }
        }

        player.remove();
      }
    } finally {
      releaseOwnership();
    }
  }, [player, releaseOwnership, setIsLoadingIfMounted]);

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

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const warmAudioCache = async () => {
      try {
        const cachedUri = await getCachedAudioUri(audio.storagePath);
        if (cachedUri) {
          if (!isCancelled) {
            setIsCached(true);
          }
          return;
        }

        if (!isCancelled) {
          setIsPrefetching(true);
        }

        const result = await prefetchAudioAsset(audio.storagePath);

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
  }, [audio.storagePath]);

  useEffect(() => {
    if (!pendingPlayRef.current || !status.isLoaded) return;

    pendingPlayRef.current = false;
    void claimPlaybackOwnership();
    player.play();
    setIsLoadingIfMounted(false);
  }, [claimPlaybackOwnership, player, setIsLoadingIfMounted, status.isLoaded]);

  useEffect(() => {
    stopActivePlayer = activePlayerOwner === instanceIdRef.current ? stopPlayback : stopActivePlayer;
  }, [stopPlayback]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      void stopPlayback();
    };
  }, [stopPlayback]);

  useEffect(() => {
    if (!isFocused) {
      void stopPlayback();
    }
  }, [isFocused, stopPlayback]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        void stopPlayback();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [stopPlayback]);

  const handleTogglePlayback = async () => {
    if (isLoading) return;

    try {
      setErrorIfMounted(null);

      if (status.isLoaded) {
        if (status.playing) {
          player.pause();
          releaseOwnership();
          return;
        }

        await claimPlaybackOwnership();
        player.play();
        return;
      }

      await claimPlaybackOwnership();
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      setIsLoadingIfMounted(true);
      const { uri, cached } = await resolvePlayableAudioUri(audio.storagePath);

      if (!isMountedRef.current || loadRequestIdRef.current !== requestId) {
        return;
      }

      setIsCached(cached);
      pendingPlayRef.current = true;
      player.replace({ uri });
    } catch (playbackError) {
      pendingPlayRef.current = false;
      releaseOwnership();
      setIsLoadingIfMounted(false);
      console.error('Audio playback failed', playbackError);
      void captureError(playbackError, {
        source: 'audio',
        metadata: {
          storagePath: audio.storagePath,
        },
      });
      setErrorIfMounted('Audio could not be played right now.');
    }
  };

  return (
    <View style={embeddedDark ? styles.containerEmbeddedDark : styles.container}>
      {!embeddedDark ? (
        <>
          <Text style={styles.eyebrow}>Guided Audio</Text>
          <Text style={styles.title}>Listen to today&apos;s exercise</Text>
        </>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => void handleTogglePlayback()}
        style={styles.playerContainer}
      >
        <View style={styles.playButton}>
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons
              name={status.playing ? 'pause' : 'play'}
              size={24}
              color={AppColors.white}
            />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.playerAction}>
            {status.playing ? 'Pause audio' : 'Play audio'}
          </Text>
          <Text style={styles.playerSubtext}>
            {audio.durationSeconds
              ? `${Math.round(audio.durationSeconds / 60)} min guided practice`
              : 'Guided meditation'}
          </Text>

          <View style={styles.cacheStatusRow}>
            <View style={[
              styles.cacheDot,
              { backgroundColor: isCached ? '#4ADE80' : isPrefetching ? '#FBBF24' : 'rgba(255,255,255,0.3)' }
            ]} />
            <Text style={styles.cacheText}>
              {isCached
                ? 'Offline ready'
                : isPrefetching
                  ? 'Caching...'
                  : 'Streaming'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    backgroundColor: '#06290C', // Forest
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  containerEmbeddedDark: {
    borderRadius: 0,
  },
  eyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Erode-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 20,
    lineHeight: 32,
  },
  playerContainer: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  playerAction: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  playerSubtext: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cacheStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cacheDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  cacheText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    fontFamily: 'Satoshi',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
