import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/providers/auth';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import {
  ProgramAccessSnapshot,
  ProgramProgressRecord,
  ProgramSlug,
} from '@/lib/programs/types';
import { AccessService } from '@/lib/access/service';

export interface UserProfile {
  active_program?: string | null;
  id: string;
  email: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
  expo_push_token?: string | null;
  push_opt_in?: boolean;
}

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isSubscribed: boolean;
  access: ProgramAccessSnapshot;
  progress: ProgramProgressRecord | null;
  hasProgramAccess: boolean;
  refreshAccess: () => Promise<ProgramAccessSnapshot>;
  refreshProfile: () => Promise<void>;
  setProgramAccess: (program: ProgramSlug | null) => Promise<void>;
  completeProgramDay: (program: ProgramSlug, dayNumber: number) => Promise<void>;
}

const PROFILE_COLUMNS = 'id, email, onboarding_complete, created_at, updated_at, active_program, expo_push_token, push_opt_in';
export const PROFILE_QUERY_KEY = (userId: string | null) => ['profile', userId];

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isLoading: true,
  isSubscribed: false,
  access: {
    ownedProgram: null,
    purchaseState: 'not_owned',
    completionState: 'not_started',
    currentDay: null,
    completedAt: null,
    archivedAt: null,
    eligibleProducts: ['six_day_reset', 'ninety_day_transform'],
    source: 'local',
  },
  progress: null,
  hasProgramAccess: false,
  refreshAccess: async () => ({
    ownedProgram: null,
    purchaseState: 'not_owned',
    completionState: 'not_started',
    currentDay: null,
    completedAt: null,
    archivedAt: null,
    eligibleProducts: ['six_day_reset', 'ninety_day_transform'],
    source: 'local',
  }),
  refreshProfile: async () => { },
  setProgramAccess: async () => { },
  completeProgramDay: async () => { },
});

const fetchProfileFromApi = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as UserProfile | null;
};

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAccessLoading, setIsAccessLoading] = useState(false);
  const [access, setAccess] = useState<ProgramAccessSnapshot>({
    ownedProgram: null,
    purchaseState: 'not_owned',
    completionState: 'not_started',
    currentDay: null,
    completedAt: null,
    archivedAt: null,
    eligibleProducts: ['six_day_reset', 'ninety_day_transform'],
    source: 'local',
  });
  const [progress, setProgress] = useState<ProgramProgressRecord | null>(null);
  const userId = user?.id ?? null;
  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY(userId),
    queryFn: () => {
      if (!userId) return Promise.resolve(null);
      return fetchProfileFromApi(userId);
    },
    enabled: Boolean(userId),
  });
  const shouldRegisterPush = Boolean(userId && profileQuery.data?.onboarding_complete);
  const { expoPushToken, permissionStatus, error: pushError } = usePushNotifications({
    enabled: shouldRegisterPush,
  });

  useEffect(() => {
    if (!userId) return;

    const profile = profileQuery.data;
    if (!profile?.onboarding_complete) return;

    const token = expoPushToken?.data ?? null;
    const shouldClearPush =
      permissionStatus === 'denied' &&
      Boolean(profile.expo_push_token || profile.push_opt_in);

    let nextToken: string | null = null;
    let nextOptIn = false;

    if (token) {
      nextToken = token;
      nextOptIn = true;
    } else if (shouldClearPush) {
      nextToken = null;
      nextOptIn = false;
    } else {
      return;
    }

    if (
      profile.expo_push_token === nextToken &&
      Boolean(profile.push_opt_in) === nextOptIn
    ) {
      return;
    }

    let isCancelled = false;

    const syncPushState = async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          expo_push_token: nextToken,
          push_opt_in: nextOptIn,
        })
        .eq('id', userId);

      if (error) throw error;
    };

    void syncPushState()
      .then(() => {
        if (isCancelled) return;
        queryClient.setQueryData<UserProfile | null>(
          PROFILE_QUERY_KEY(userId),
          (currentProfile) =>
            currentProfile
              ? {
                  ...currentProfile,
                  expo_push_token: nextToken,
                  push_opt_in: nextOptIn,
                }
              : currentProfile
        );
      })
      .catch((syncError) => {
        if (isCancelled) return;
        console.error('Failed to sync push notification state', syncError);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    expoPushToken?.data,
    permissionStatus,
    profileQuery.data,
    queryClient,
    userId,
  ]);

  const refreshAccess = useCallback(async () => {
    if (!userId) {
      return {
        ownedProgram: null,
        purchaseState: 'not_owned',
        completionState: 'not_started',
        currentDay: null,
        completedAt: null,
        archivedAt: null,
        eligibleProducts: ['six_day_reset', 'ninety_day_transform'],
        source: 'local',
      } satisfies ProgramAccessSnapshot;
    }

    setIsAccessLoading(true);

    try {
      const snapshot = await AccessService.refreshFromDeviceStore(userId);
      const nextProgress = await AccessService.getProgressRecord();
      setAccess(snapshot);
      setProgress(nextProgress);
      return snapshot;
    } catch (error) {
      console.error('Error refreshing access state:', error);
      return access;
    } finally {
      setIsAccessLoading(false);
    }
  }, [access, userId]);

  const syncProfileActiveProgram = useCallback(
    async (snapshot: Pick<ProgramAccessSnapshot, 'ownedProgram' | 'source'>) => {
      if (!userId) return;
      if (snapshot.source === 'local') return;

      const nextProgram = snapshot.ownedProgram;

      if (profileQuery.data?.active_program === nextProgram) {
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          active_program: nextProgram,
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to sync active program', error);
        return;
      }

      queryClient.setQueryData<UserProfile | null>(
        PROFILE_QUERY_KEY(userId),
        (currentProfile) =>
          currentProfile
            ? {
                ...currentProfile,
                active_program: nextProgram,
              }
            : currentProfile
      );
    },
    [profileQuery.data?.active_program, queryClient, userId]
  );

  const setProgramAccess = useCallback(
    async (program: ProgramSlug | null) => {
      if (!userId || !program) {
        return;
      }

      const nextSnapshot = {
        ownedProgram: program,
        purchaseState: 'owned_active',
        completionState: 'in_progress',
        currentDay: 1,
        completedAt: null,
        archivedAt: null,
        eligibleProducts: [program],
        source: 'local',
      } satisfies ProgramAccessSnapshot;

      const nextProgress = AccessService.buildProgressRecord(userId, program);
      await Promise.all([
        AccessService.saveAccessSnapshot(nextSnapshot),
        AccessService.saveProgressRecord(nextProgress),
        AccessService.syncStateToSupabase(userId, nextSnapshot, nextProgress),
        syncProfileActiveProgram(nextSnapshot),
      ]);

      setAccess(nextSnapshot);
      setProgress(nextProgress);
    },
    [syncProfileActiveProgram, userId]
  );

  const completeProgramDay = useCallback(
    async (program: ProgramSlug, dayNumber: number) => {
      if (!userId) {
        return;
      }

      const { progress: nextProgress, snapshot: nextSnapshot } = await AccessService.updateProgress(
        userId,
        program,
        (current) => {
          const totalDays = program === 'six_day_reset' ? 6 : 90;
          const completedDays = current.completedDays.includes(dayNumber)
            ? current.completedDays
            : [...current.completedDays, dayNumber].sort((a, b) => a - b);
          const hasCompletedProgram = dayNumber >= totalDays;
          const isSixDayArchive = program === 'six_day_reset' && hasCompletedProgram;

          return {
            ...current,
            currentDay: hasCompletedProgram ? totalDays : Math.min(totalDays, dayNumber + 1),
            completedDays,
            completedAt: hasCompletedProgram ? new Date().toISOString() : current.completedAt,
            archivedAt: isSixDayArchive ? new Date().toISOString() : current.archivedAt,
          };
        }
      );

      setProgress(nextProgress);
      setAccess(nextSnapshot);
      await Promise.all([
        AccessService.syncStateToSupabase(userId, nextSnapshot, nextProgress),
        syncProfileActiveProgram(nextSnapshot),
      ]);
    },
    [syncProfileActiveProgram, userId]
  );

  const bootstrapAccessState = useCallback(async () => {
    if (!userId) {
      setAccess({
        ownedProgram: null,
        purchaseState: 'not_owned',
        completionState: 'not_started',
        currentDay: null,
        completedAt: null,
        archivedAt: null,
        eligibleProducts: ['six_day_reset', 'ninety_day_transform'],
        source: 'local',
      });
      setProgress(null);
      setIsAccessLoading(false);
      return;
    }

    setIsAccessLoading(true);

    try {
      const { snapshot: serverSnapshot, progress: serverProgress } = await AccessService.hydrateFromSupabase(userId);
      setAccess(serverSnapshot);
      setProgress(serverProgress);

      const liveSnapshot = await AccessService.refreshFromDeviceStore(userId);
      const liveProgress = await AccessService.getProgressRecord();
      setAccess(liveSnapshot);
      setProgress(liveProgress);
      await syncProfileActiveProgram(liveSnapshot);
    } catch (error) {
      console.error('Error bootstrapping access state', error);
    } finally {
      setIsAccessLoading(false);
    }
  }, [syncProfileActiveProgram, userId]);

  useEffect(() => {
    void bootstrapAccessState();

    if (!userId) {
      return;
    }

    const updateListener = (customerInfo: CustomerInfo) => {
      void AccessService.syncFromRevenueCat(customerInfo, userId)
        .then(async (snapshot) => {
          setAccess(snapshot);
          setProgress(await AccessService.getProgressRecord());
          await syncProfileActiveProgram(snapshot);
        })
        .catch((error) => {
          console.error('Error syncing RevenueCat access update', error);
        });
    };

    Purchases.addCustomerInfoUpdateListener(updateListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(updateListener);
    };
  }, [bootstrapAccessState, syncProfileActiveProgram, userId]);

  const refreshProfile = useCallback(
    async () => {
      if (!userId) {
        return;
      }

      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
      await queryClient.refetchQueries({ queryKey: PROFILE_QUERY_KEY(userId), type: 'active' });
    },
    [queryClient, userId]
  );

  useEffect(() => {
    if (!userId) {
      void AccessService.clear();
      queryClient.removeQueries({ queryKey: ['profile'] });
    }
  }, [queryClient, userId]);

  useEffect(() => {
    if (profileQuery.error) {
      console.error('Error fetching profile:', profileQuery.error);
    }
  }, [profileQuery.error]);

  useEffect(() => {
    if (!userId || profileQuery.isPending || profileQuery.data || profileQuery.error) {
      return;
    }

    let isCancelled = false;

    const ensureProfileRow = async () => {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            email: user?.email ?? null,
            onboarding_complete: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) {
        console.error('Failed to create missing profile row', error);
        return;
      }

      if (!isCancelled) {
        await refreshProfile();
      }
    };

    void ensureProfileRow();

    return () => {
      isCancelled = true;
    };
  }, [profileQuery.data, profileQuery.error, profileQuery.isPending, refreshProfile, user?.email, userId]);

  useEffect(() => {
    if (pushError) {
      console.error('Push registration error:', pushError);
    }
  }, [pushError]);

  const value = useMemo(
    () => ({
      profile: profileQuery.data ?? null,
      isLoading: Boolean(userId) && (profileQuery.isPending || isAccessLoading),
      isSubscribed: Boolean(access.ownedProgram),
      access,
      progress,
      hasProgramAccess: Boolean(access.ownedProgram),
      refreshAccess,
      refreshProfile,
      setProgramAccess,
      completeProgramDay,
    }),
    [
      access,
      completeProgramDay,
      profileQuery.data,
      profileQuery.isPending,
      progress,
      refreshAccess,
      refreshProfile,
      setProgramAccess,
      userId,
      isAccessLoading,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
