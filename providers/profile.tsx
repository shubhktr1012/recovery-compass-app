import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
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
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

export interface UserProfile {
  active_program?: string | null;
  id: string;
  email: string | null;
  onboarding_complete: boolean;
  questionnaire_answers?: Record<string, unknown> | null;
  recommended_program?: ProgramSlug | null;
  created_at: string;
  updated_at: string;
  expo_push_token?: string | null;
  push_opt_in?: boolean;
  display_name?: string | null;
  avatar_url?: string | null;
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
  updateProfile: (fields: { display_name?: string | null }) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<string | null>;
}

const PROFILE_COLUMNS =
  'id, email, onboarding_complete, questionnaire_answers, recommended_program, created_at, updated_at, active_program, expo_push_token, push_opt_in, display_name, avatar_url';
export const PROFILE_QUERY_KEY = (userId: string | null) => ['profile', userId];
const PROFILE_IMAGE_BUCKET = 'profile-images';
const PROFILE_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

async function resolveAvatarDisplayUrl(avatarValue: string | null | undefined, cacheBustKey?: number) {
  if (!avatarValue) {
    return null;
  }

  if (isAbsoluteUrl(avatarValue)) {
    if (!cacheBustKey) {
      return avatarValue;
    }

    const separator = avatarValue.includes('?') ? '&' : '?';
    return `${avatarValue}${separator}t=${cacheBustKey}`;
  }

  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .createSignedUrl(avatarValue, PROFILE_IMAGE_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw error ?? new Error('Avatar URL could not be created.');
  }

  return cacheBustKey ? `${data.signedUrl}&t=${cacheBustKey}` : data.signedUrl;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isLoading: true,
  isSubscribed: false,
  access: {
    ownedProgram: null,
    purchaseState: 'not_owned',
    completionState: 'not_started',
    currentDay: null,
    startedAt: null,
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
    startedAt: null,
    completedAt: null,
    archivedAt: null,
    eligibleProducts: ['six_day_reset', 'ninety_day_transform'],
    source: 'local',
  }),
  refreshProfile: async () => { },
  setProgramAccess: async () => { },
  completeProgramDay: async () => { },
  updateProfile: async () => { },
  uploadAvatar: async () => null,
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

  const profile = data as UserProfile | null;

  if (profile?.avatar_url) {
    try {
      profile.avatar_url = await resolveAvatarDisplayUrl(profile.avatar_url);
    } catch (avatarError) {
      console.error('Failed to resolve avatar URL', avatarError);
      profile.avatar_url = null;
    }
  }

  return profile;
};

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isAccessLoading, setIsAccessLoading] = useState(false);
  const [access, setAccess] = useState<ProgramAccessSnapshot>({
    ownedProgram: null,
    purchaseState: 'not_owned',
    completionState: 'not_started',
    currentDay: null,
    startedAt: null,
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
  const shouldRegisterPush = Boolean(
    userId &&
    profileQuery.data?.onboarding_complete &&
    Platform.OS === 'ios'
  );
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
        startedAt: null,
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
      const fallbackSnapshot = await AccessService.getAccessSnapshot();
      const fallbackProgress = await AccessService.getProgressRecord();
      setAccess(fallbackSnapshot);
      setProgress(fallbackProgress);
      return fallbackSnapshot;
    } finally {
      setIsAccessLoading(false);
    }
  }, [userId]);

  const syncProfileActiveProgram = useCallback(
    async (
      snapshot: Pick<ProgramAccessSnapshot, 'ownedProgram' | 'source'>,
      options?: { allowLocal?: boolean }
    ) => {
      if (!userId) return;
      if (snapshot.source === 'local' && !options?.allowLocal) return;

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
        startedAt: new Date().toISOString(),
        completedAt: null,
        archivedAt: null,
        eligibleProducts: [],
        source: 'local',
      } satisfies ProgramAccessSnapshot;

      const nextProgress = AccessService.buildProgressRecord(userId, program);
      await Promise.all([
        AccessService.saveAccessSnapshot(nextSnapshot),
        AccessService.saveProgressRecord(nextProgress),
        AccessService.syncStateToSupabase(userId, nextSnapshot, nextProgress),
        syncProfileActiveProgram(nextSnapshot, { allowLocal: true }),
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
          const totalDays = PROGRAM_METADATA[program].totalDays;
          const completedDays = current.completedDays.includes(dayNumber)
            ? current.completedDays
            : [...current.completedDays, dayNumber].sort((a, b) => a - b);
          const hasCompletedProgram = dayNumber >= totalDays;
          const isSixDayArchive = program === 'six_day_reset' && hasCompletedProgram;

          return {
            ...current,
            currentDay: current.currentDay,
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
        startedAt: null,
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
      const [cachedSnapshot, cachedProgress] = await Promise.all([
        AccessService.getAccessSnapshot(),
        AccessService.getProgressRecord(),
      ]);

      setAccess(cachedSnapshot);
      setProgress(cachedProgress);

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
      const {
        data: { user: activeUser },
        error: activeUserError,
      } = await supabase.auth.getUser();

      if (activeUserError || !activeUser || activeUser.id !== userId) {
        console.warn('Cached session no longer maps to an active auth user. Clearing local session.', activeUserError);

        if (!isCancelled) {
          await signOut().catch((signOutError) => {
            console.error('Failed to sign out after detecting deleted auth user', signOutError);
          });
        }
        return;
      }

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
  }, [profileQuery.data, profileQuery.error, profileQuery.isPending, refreshProfile, signOut, user?.email, userId]);

  useEffect(() => {
    if (pushError) {
      console.error('Push registration error:', pushError);
    }
  }, [pushError]);

  const updateProfile = useCallback(
    async (fields: { display_name?: string | null }) => {
      if (!userId) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          ...fields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      queryClient.setQueryData<UserProfile | null>(
        PROFILE_QUERY_KEY(userId),
        (current) =>
          current
            ? { ...current, ...fields, updated_at: new Date().toISOString() }
            : current
      );
    },
    [queryClient, userId]
  );

  const uploadAvatar = useCallback(
    async (imageUri: string): Promise<string | null> => {
      if (!userId) return null;

      const fileExt = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `${userId}/avatar.${fileExt}`;
      const mimeType = fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg';

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      const { error: uploadError } = await supabase.storage
        .from(PROFILE_IMAGE_BUCKET)
        .upload(filePath, decode(base64), {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const avatarUrl = await resolveAvatarDisplayUrl(filePath, Date.now());

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;

      queryClient.setQueryData<UserProfile | null>(
        PROFILE_QUERY_KEY(userId),
        (current) =>
          current
            ? { ...current, avatar_url: avatarUrl, updated_at: new Date().toISOString() }
            : current
      );

      return avatarUrl;
    },
    [queryClient, userId]
  );

  const value = useMemo(
    () => ({
      profile: profileQuery.data ?? null,
      isLoading: Boolean(userId) && (profileQuery.isPending || isAccessLoading),
      isSubscribed:
        Boolean(access.ownedProgram) && access.purchaseState !== 'not_owned',
      access,
      progress,
      hasProgramAccess:
        Boolean(access.ownedProgram) && access.purchaseState !== 'not_owned',
      refreshAccess,
      refreshProfile,
      setProgramAccess,
      completeProgramDay,
      updateProfile,
      uploadAvatar,
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
      updateProfile,
      uploadAvatar,
      userId,
      isAccessLoading,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
