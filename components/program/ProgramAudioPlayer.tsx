import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

import { getCachedAudioUri, prefetchAudioAsset, resolvePlayableAudioUri } from '@/lib/audio-cache';
import { captureError } from '@/lib/monitoring';
import { ProgramDayAudio } from '@/lib/programs/types';
import { AppColors } from '@/constants/theme';

interface ProgramAudioPlayerProps {
  audio: ProgramDayAudio;
}

export function ProgramAudioPlayer({ audio }: ProgramAudioPlayerProps) {
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
    <View className="rounded-3xl bg-forest p-5">
      <Text className="font-satoshi-bold text-white/70 text-xs uppercase mb-2">Guided Audio</Text>
      <Text className="font-erode-semibold text-white text-2xl mb-3">Listen to today&apos;s exercise</Text>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => void handleTogglePlayback()}
        className="rounded-2xl bg-white/10 border border-white/10 px-4 py-4 flex-row items-center"
      >
        <View className="w-12 h-12 rounded-full bg-white/15 items-center justify-center mr-4">
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons
              name={status.playing ? 'pause' : 'play'}
              size={22}
              color={AppColors.white}
            />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-satoshi-bold text-white text-base">
            {status.playing ? 'Pause audio' : 'Play audio'}
          </Text>
          <Text className="font-satoshi text-white/70 text-sm mt-1">
            {audio.durationSeconds
              ? `${Math.round(audio.durationSeconds / 60)} min guided practice`
              : 'Guided meditation'}
          </Text>
          <Text className="font-satoshi text-white/55 text-xs mt-2">
            {isCached
              ? 'Downloaded for faster replay'
              : isPrefetching
                ? 'Caching for offline replay...'
                : 'Streaming available'}
          </Text>
        </View>
      </TouchableOpacity>
      {error ? (
        <Text className="font-satoshi text-white/70 text-sm mt-3">{error}</Text>
      ) : null}
    </View>
  );
}
