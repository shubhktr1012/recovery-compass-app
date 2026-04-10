import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

import { getCachedAudioUri, prefetchAudioAsset, resolvePlayableAudioUri } from '@/lib/audio-cache';
import { captureError } from '@/lib/monitoring';
import { ProgramDayAudio } from '@/lib/programs/types';
import { AppColors } from '@/constants/theme';

interface ProgramAudioPlayerProps {
  audio: ProgramDayAudio;
  embeddedDark?: boolean;
}

export function ProgramAudioPlayer({ audio, embeddedDark = false }: ProgramAudioPlayerProps) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const pendingPlayRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);

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
    player.play();
    setIsLoading(false);
  }, [player, status.isLoaded]);

  const handleTogglePlayback = async () => {
    if (isLoading) return;

    try {
      setError(null);

      if (status.isLoaded) {
        if (status.playing) {
          player.pause();
          return;
        }

        player.play();
        return;
      }

      setIsLoading(true);
      const { uri, cached } = await resolvePlayableAudioUri(audio.storagePath);
      setIsCached(cached);
      pendingPlayRef.current = true;
      player.replace({ uri });
    } catch (playbackError) {
      pendingPlayRef.current = false;
      setIsLoading(false);
      console.error('Audio playback failed', playbackError);
      void captureError(playbackError, {
        source: 'audio',
        metadata: {
          storagePath: audio.storagePath,
        },
      });
      setError('Audio could not be played right now.');
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
