import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pedometer } from 'expo-sensors';

import {
  DailyStepSummary,
  formatStepCount,
  getCachedDailySteps,
  getEffectiveStepDateKey,
  getNextStepResetAt,
  persistDailySteps,
  readDailyStepsFromDevice,
} from '@/lib/steps';
import { useAuth } from '@/providers/auth';

export function dailyStepsQueryKey(
  userId: string | null | undefined,
  dayKey: string | null | undefined
) {
  return ['daily-steps', userId ?? 'anonymous', dayKey ?? 'unknown'];
}

function dailyStepsQueryBaseKey(userId: string | null | undefined) {
  return ['daily-steps', userId ?? 'anonymous'];
}

function mergeLiveSteps(
  summary: DailyStepSummary | undefined,
  liveSessionSteps: number
) {
  if (!summary || Platform.OS !== 'android' || summary.source !== 'android_pedometer') {
    return summary;
  }

  return {
    ...summary,
    steps: Math.max(summary.steps, liveSessionSteps),
  };
}

export function useDailySteps() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const [stepDayKey, setStepDayKey] = useState(() => getEffectiveStepDateKey());
  const [liveSessionSteps, setLiveSessionSteps] = useState(0);

  const query = useQuery({
    queryKey: dailyStepsQueryKey(userId, stepDayKey),
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      const deviceSummary = await readDailyStepsFromDevice({ requestPermission: false });

      if (deviceSummary.permissionState === 'ready' && deviceSummary.steps > 0) {
        return persistDailySteps({
          source: deviceSummary.source,
          steps: deviceSummary.steps,
          userId,
        });
      }

      const cachedSummary = await getCachedDailySteps(userId);
      return cachedSummary.steps > 0 ? cachedSummary : deviceSummary;
    },
    enabled: Boolean(userId),
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Sign in before enabling step tracking.');
      }

      const deviceSummary = await readDailyStepsFromDevice({ requestPermission: true });
      if (deviceSummary.permissionState !== 'ready') {
        return deviceSummary;
      }

      return persistDailySteps({
        source: deviceSummary.source,
        steps: deviceSummary.steps,
        userId,
      });
    },
    onSuccess: (summary) => {
      queryClient.setQueryData(dailyStepsQueryKey(userId, stepDayKey), summary);
    },
  });

  const refresh = useCallback(async () => {
    setStepDayKey(getEffectiveStepDateKey());
    await queryClient.invalidateQueries({ queryKey: dailyStepsQueryBaseKey(userId) });
  }, [queryClient, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setStepDayKey(getEffectiveStepDateKey());
        void refresh();
      }
    });

    return () => subscription.remove();
  }, [refresh, userId]);

  useEffect(() => {
    const nextResetAt = getNextStepResetAt();
    const timeoutMs = Math.max(1000, nextResetAt.getTime() - Date.now());
    const timeout = setTimeout(() => {
      setLiveSessionSteps(0);
      setStepDayKey(getEffectiveStepDateKey());
      void queryClient.invalidateQueries({ queryKey: dailyStepsQueryBaseKey(userId) });
    }, timeoutMs);

    return () => clearTimeout(timeout);
  }, [queryClient, stepDayKey, userId]);

  useEffect(() => {
    const summary = query.data;
    if (
      Platform.OS !== 'android' ||
      !summary ||
      summary.permissionState !== 'ready' ||
      summary.source === 'android_health_connect'
    ) {
      return;
    }

    const subscription = Pedometer.watchStepCount((result) => {
      setLiveSessionSteps(result.steps);
    });

    return () => subscription.remove();
  }, [query.data, stepDayKey]);

  const summary = useMemo(
    () => mergeLiveSteps(query.data ?? undefined, liveSessionSteps) ?? null,
    [liveSessionSteps, query.data]
  );

  return {
    enableStepTracking: enableMutation.mutateAsync,
    formattedSteps: formatStepCount(summary?.steps ?? 0),
    isEnabling: enableMutation.isPending,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching,
    refresh,
    summary,
  };
}
