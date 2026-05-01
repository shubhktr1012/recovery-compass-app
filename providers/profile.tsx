import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { OWNED_PROGRAMS_QUERY_ROOT } from '@/hooks/useOwnedPrograms';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

export interface UserProfile {
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
  selectActiveProgram: (program: ProgramSlug) => Promise<void>;
  savePartialProgramDay: (program: ProgramSlug, dayNumber: number) => Promise<void>;
  completeProgramDay: (program: ProgramSlug, dayNumber: number) => Promise<void>;
  updateProfile: (fields: { display_name?: string | null }) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<string | null>;
}

const PROFILE_COLUMNS =
  'id, email, onboarding_complete, questionnaire_answers, recommended_program, created_at, updated_at, expo_push_token, push_opt_in, display_name, avatar_url';
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
  selectActiveProgram: async () => { },
  savePartialProgramDay: async () => { },
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
  const previousUserIdRef = useRef<string | null>(null);
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
        ownerUserId: null,
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
      const nextProgress = await AccessService.getProgressRecord(userId, snapshot.ownedProgram);
      console.log('[ProfileProvider] refreshAccess:resolved', {
        userId,
        snapshotOwnerUserId: snapshot.ownerUserId ?? null,
        snapshotOwnedProgram: snapshot.ownedProgram,
        snapshotPurchaseState: snapshot.purchaseState,
        progressUserId: nextProgress?.userId ?? null,
        progressProgramSlug: nextProgress?.programSlug ?? null,
      });
      setAccess(snapshot);
      setProgress(nextProgress);
      return snapshot;
    } catch (error) {
      console.error('Error refreshing access state:', error);
      const fallbackSnapshot = await AccessService.getAccessSnapshot();
      const fallbackProgress = await AccessService.getProgressRecord(userId, fallbackSnapshot.ownedProgram);
      setAccess(fallbackSnapshot);
      setProgress(fallbackProgress);
      return fallbackSnapshot;
    } finally {
      setIsAccessLoading(false);
    }
  }, [userId]);

  const setProgramAccess = useCallback(
    async (program: ProgramSlug | null) => {
      if (!userId || !program) {
        return;
      }

      const nextSnapshot = {
        ownerUserId: userId,
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
        AccessService.saveLocalActiveProgramPreference(userId, program),
        AccessService.saveAccessSnapshot(nextSnapshot),
        AccessService.saveProgressRecord(nextProgress),
        AccessService.syncStateToSupabase(nextProgress),
      ]);

      setAccess(nextSnapshot);
      setProgress(nextProgress);
    },
    [userId]
  );

  const selectActiveProgram = useCallback(
    async (program: ProgramSlug) => {
      if (!userId) {
        return;
      }

      setIsAccessLoading(true);

      try {
        const { snapshot, progress: nextProgress } = await AccessService.selectActiveProgram(userId, program);
        setAccess(snapshot);
        setProgress(nextProgress);
        await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
      } finally {
        setIsAccessLoading(false);
      }
    },
    [queryClient, userId]
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
          const partialDays = current.partialDays.filter((existingDay) => existingDay !== dayNumber);
          const hasCompletedProgram = dayNumber >= totalDays;
          const isSixDayArchive = program === 'six_day_reset' && hasCompletedProgram;

          return {
            ...current,
            currentDay: current.currentDay,
            completedDays,
            partialDays,
            completedAt: hasCompletedProgram ? new Date().toISOString() : current.completedAt,
            archivedAt: isSixDayArchive ? new Date().toISOString() : current.archivedAt,
          };
        }
      );

      setProgress(nextProgress);
      setAccess(nextSnapshot);
      await Promise.all([
        AccessService.syncStateToSupabase(nextProgress),
      ]);
    },
    [userId]
  );

  const savePartialProgramDay = useCallback(
    async (program: ProgramSlug, dayNumber: number) => {
      if (!userId) {
        return;
      }

      const { progress: nextProgress, snapshot: nextSnapshot } = await AccessService.updateProgress(
        userId,
        program,
        (current) => {
          if (current.completedDays.includes(dayNumber)) {
            return current;
          }

          const partialDays = current.partialDays.includes(dayNumber)
            ? current.partialDays
            : [...current.partialDays, dayNumber].sort((a, b) => a - b);

          return {
            ...current,
            currentDay: current.currentDay,
            partialDays,
            completedAt: current.completedAt,
            archivedAt: current.archivedAt,
          };
        }
      );

      setProgress(nextProgress);
      setAccess(nextSnapshot);
      await Promise.all([
        AccessService.syncStateToSupabase(nextProgress),
      ]);
    },
    [userId]
  );

  const bootstrapAccessState = useCallback(async () => {
    if (!userId) {
      setAccess({
        ownerUserId: null,
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
      const cachedSnapshot = await AccessService.getAccessSnapshot();
      const cachedProgress = await AccessService.getProgressRecord(userId, cachedSnapshot.ownedProgram);

      const safeCachedProgress = cachedProgress?.userId === userId ? cachedProgress : null;
      const safeCachedSnapshot =
        cachedSnapshot.ownerUserId && cachedSnapshot.ownerUserId === userId
          ? cachedSnapshot
          : {
              ownerUserId: userId,
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

      console.log('[ProfileProvider] bootstrapAccessState:cached', {
        userId,
        cachedSnapshotOwnerUserId: cachedSnapshot.ownerUserId ?? null,
        cachedSnapshotOwnedProgram: cachedSnapshot.ownedProgram,
        cachedProgressUserId: cachedProgress?.userId ?? null,
        cachedProgressProgramSlug: cachedProgress?.programSlug ?? null,
        safeCachedSnapshotOwnedProgram: safeCachedSnapshot.ownedProgram,
        safeCachedProgressProgramSlug: safeCachedProgress?.programSlug ?? null,
      });

      setAccess(safeCachedSnapshot);
      setProgress(safeCachedProgress);

      const liveSnapshot = await AccessService.refreshFromDeviceStore(userId);
      const liveProgress = await AccessService.getProgressRecord(userId, liveSnapshot.ownedProgram);
      console.log('[ProfileProvider] bootstrapAccessState:live', {
        userId,
        liveSnapshotOwnerUserId: liveSnapshot.ownerUserId ?? null,
        liveSnapshotOwnedProgram: liveSnapshot.ownedProgram,
        liveSnapshotPurchaseState: liveSnapshot.purchaseState,
        liveProgressUserId: liveProgress?.userId ?? null,
        liveProgressProgramSlug: liveProgress?.programSlug ?? null,
      });
      setAccess(liveSnapshot);
      setProgress(liveProgress);
    } catch (error) {
      console.error('Error bootstrapping access state', error);
    } finally {
      setIsAccessLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void bootstrapAccessState();

    if (!userId) {
      return;
    }

    const updateListener = (customerInfo: CustomerInfo) => {
      void AccessService.syncFromRevenueCat(customerInfo, userId)
        .then(async (snapshot) => {
          const nextProgress = await AccessService.getProgressRecord(userId, snapshot.ownedProgram);
          console.log('[ProfileProvider] customerInfoUpdate', {
            userId,
            snapshotOwnerUserId: snapshot.ownerUserId ?? null,
            snapshotOwnedProgram: snapshot.ownedProgram,
            snapshotPurchaseState: snapshot.purchaseState,
            progressUserId: nextProgress?.userId ?? null,
            progressProgramSlug: nextProgress?.programSlug ?? null,
          });
          setAccess(snapshot);
          setProgress(nextProgress);
          await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
        })
        .catch((error) => {
          console.error('Error syncing RevenueCat access update', error);
        });
    };

    Purchases.addCustomerInfoUpdateListener(updateListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(updateListener);
    };
  }, [bootstrapAccessState, queryClient, userId]);

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
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = userId;

    if (!previousUserId || !userId || previousUserId === userId) {
      return;
    }

    setAccess({
      ownerUserId: null,
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
    void AccessService.clear();
  }, [userId]);

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
      selectActiveProgram,
      savePartialProgramDay,
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
      selectActiveProgram,
      setProgramAccess,
      savePartialProgramDay,
      updateProfile,
      uploadAvatar,
      userId,
      isAccessLoading,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
