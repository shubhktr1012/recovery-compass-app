import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { supabase } from '@/lib/supabase';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/providers/auth';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { finalizedDayStatesQueryKey } from '@/hooks/useFinalizedDayStates';
import {
  ProgramAccessSnapshot,
  ProgramProgressRecord,
  ProgramSlug,
} from '@/lib/programs/types';
import { AccessService } from '@/lib/access/service';
import { hasAnyProgramEntitlement } from '@/lib/access/entitlements';
import { repairSkippedDayStatesOnForeground } from '@/lib/day-state-repair';
import { OWNED_PROGRAMS_QUERY_ROOT } from '@/hooks/useOwnedPrograms';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { buildWidgetPayload, syncWidgetData } from '@/lib/widget-bridge';
import { validateDisplayNameInput } from '@/lib/profile-identity';
import { rescheduleProgramNotificationsForAccess } from '@/lib/notification-runtime';
import { getCurrentNotificationPermissionStateAsync } from '@/lib/notification-permissions';
import { isMissingAnyColumnError } from '@/lib/db-compat';

export interface UserProfile {
  id: string;
  email: string | null;
  phone_number?: string | null;
  phone_verified_at?: string | null;
  onboarding_complete: boolean;
  questionnaire_answers?: Record<string, unknown> | null;
  recommended_program?: ProgramSlug | null;
  created_at: string;
  updated_at: string;
  free_tier_activated_at?: string | null;
  expo_push_token?: string | null;
  notifications_enabled?: boolean;
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
  refreshAccess: (options?: { source?: 'device_store' | 'supabase' }) => Promise<ProgramAccessSnapshot>;
  refreshProfile: () => Promise<void>;
  setProgramAccess: (program: ProgramSlug | null) => Promise<void>;
  selectActiveProgram: (program: ProgramSlug) => Promise<void>;
  configureProgramStart: (program: ProgramSlug, scheduledStartDate: string) => Promise<void>;
  pauseProgramManually: (program: ProgramSlug) => Promise<void>;
  resumeProgramFromPause: (program: ProgramSlug) => Promise<void>;
  prepareOwnedProgramSetup: (program: ProgramSlug) => Promise<void>;
  reorderOwnedProgramQueue: (programs: ProgramSlug[]) => Promise<ProgramSlug[]>;
  savePartialProgramDay: (program: ProgramSlug, dayNumber: number) => Promise<void>;
  completeProgramDay: (program: ProgramSlug, dayNumber: number) => Promise<void>;
  updateProfile: (fields: { display_name?: string | null }) => Promise<void>;
  activateFreeTier: () => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<string | null>;
}

const PROFILE_COLUMNS =
  'id, email, phone_number, phone_verified_at, onboarding_complete, questionnaire_answers, recommended_program, created_at, updated_at, free_tier_activated_at, expo_push_token, notifications_enabled, push_opt_in, display_name, avatar_url';
const LEGACY_PROFILE_COLUMNS =
  'id, email, onboarding_complete, questionnaire_answers, recommended_program, created_at, updated_at, expo_push_token, notifications_enabled, push_opt_in, display_name, avatar_url';
const OPTIONAL_PROFILE_COLUMNS = ['phone_number', 'phone_verified_at', 'free_tier_activated_at'];
export const PROFILE_QUERY_KEY = (userId: string | null) => ['profile', userId];
const PROFILE_IMAGE_BUCKET = 'profile-images';
const PROFILE_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_ELIGIBLE_PRODUCTS: ProgramSlug[] = ['smoking_alcohol_quit'];

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
    programState: 'not_owned',
    currentDay: null,
    startedAt: null,
    scheduledStartDate: null,
    pausedAt: null,
    completedAt: null,
    archivedAt: null,
    eligibleProducts: DEFAULT_ELIGIBLE_PRODUCTS,
    source: 'local',
  },
  progress: null,
  hasProgramAccess: false,
  refreshAccess: async () => ({
    ownedProgram: null,
    purchaseState: 'not_owned',
    completionState: 'not_started',
    programState: 'not_owned',
    currentDay: null,
    startedAt: null,
    scheduledStartDate: null,
    pausedAt: null,
    completedAt: null,
    archivedAt: null,
    eligibleProducts: DEFAULT_ELIGIBLE_PRODUCTS,
    source: 'local',
  }),
  refreshProfile: async () => { },
  setProgramAccess: async () => { },
  selectActiveProgram: async () => { },
  configureProgramStart: async () => { },
  pauseProgramManually: async () => { },
  resumeProgramFromPause: async () => { },
  prepareOwnedProgramSetup: async () => { },
  reorderOwnedProgramQueue: async () => [],
  savePartialProgramDay: async () => { },
  completeProgramDay: async () => { },
  updateProfile: async () => { },
  activateFreeTier: async () => { },
  uploadAvatar: async () => null,
});

const fetchProfileFromApi = async (userId: string) => {
  const supabaseAny = supabase as any;
  let { data, error } = await supabaseAny
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error && isMissingAnyColumnError(error, OPTIONAL_PROFILE_COLUMNS)) {
    const legacyResult = await supabaseAny
      .from('profiles')
      .select(LEGACY_PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle();

    data = legacyResult.data;
    error = legacyResult.error;
  }

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
    programState: 'not_owned',
    currentDay: null,
    startedAt: null,
    scheduledStartDate: null,
    pausedAt: null,
    completedAt: null,
    archivedAt: null,
    eligibleProducts: DEFAULT_ELIGIBLE_PRODUCTS,
    source: 'local',
  });
  const [progress, setProgress] = useState<ProgramProgressRecord | null>(null);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [notificationRefreshNonce, setNotificationRefreshNonce] = useState(0);
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
    (notificationPermissionGranted ||
      profileQuery.data?.push_opt_in ||
      profileQuery.data?.notifications_enabled) &&
    Platform.OS !== 'web'
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
      Boolean(profile.expo_push_token || profile.push_opt_in || profile.notifications_enabled);

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
      Boolean(profile.push_opt_in) === nextOptIn &&
      Boolean(profile.notifications_enabled) === nextOptIn
    ) {
      return;
    }

    let isCancelled = false;

    const syncPushState = async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          expo_push_token: nextToken,
          notifications_enabled: nextOptIn,
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
                  notifications_enabled: nextOptIn,
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

  useEffect(() => {
    if (!userId || !profileQuery.data?.onboarding_complete) {
      setNotificationPermissionGranted(false);
      return;
    }

    let isCancelled = false;

    const reconcileNotificationPermission = async () => {
      try {
        const permission = await getCurrentNotificationPermissionStateAsync();
        if (isCancelled) return;

        const isGranted = permission.status === 'granted';
        setNotificationPermissionGranted(isGranted);

        const nextToken = permission.expoPushToken ?? profileQuery.data?.expo_push_token ?? null;
        const shouldUpdateProfile =
          Boolean(profileQuery.data?.notifications_enabled) !== isGranted ||
          Boolean(profileQuery.data?.push_opt_in) !== isGranted ||
          (isGranted && permission.expoPushToken && profileQuery.data?.expo_push_token !== permission.expoPushToken);

        if (!shouldUpdateProfile) {
          return;
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            expo_push_token: isGranted ? nextToken : null,
            notifications_enabled: isGranted,
            push_opt_in: isGranted,
          })
          .eq('id', userId);

        if (error) {
          throw error;
        }

        queryClient.setQueryData<UserProfile | null>(
          PROFILE_QUERY_KEY(userId),
          (currentProfile) =>
            currentProfile
              ? {
                  ...currentProfile,
                  expo_push_token: isGranted ? nextToken : null,
                  notifications_enabled: isGranted,
                  push_opt_in: isGranted,
                }
              : currentProfile
        );
      } catch (error) {
        if (!isCancelled) {
          console.warn('Failed to reconcile notification permission state', error);
        }
      }
    };

    void reconcileNotificationPermission();

    const appStateSubscription = AppState.addEventListener('change', (nextState: string) => {
      if (nextState === 'active') {
        void reconcileNotificationPermission();
      }
    });

    return () => {
      isCancelled = true;
      appStateSubscription.remove();
    };
  }, [
    profileQuery.data?.expo_push_token,
    profileQuery.data?.notifications_enabled,
    profileQuery.data?.onboarding_complete,
    profileQuery.data?.push_opt_in,
    queryClient,
    userId,
  ]);

  const resolveAccessLifecycle = useCallback(
    async ({
      progress: initialProgress,
      snapshot: initialSnapshot,
      source,
    }: {
      progress: ProgramProgressRecord | null;
      snapshot: ProgramAccessSnapshot;
      source: string;
    }) => {
      if (!userId) {
        return {
          progress: initialProgress,
          snapshot: initialSnapshot,
        };
      }

      let snapshot = initialSnapshot;
      let progress = initialProgress;

      try {
        const repairedDays = await repairSkippedDayStatesOnForeground({
          userId,
          access: snapshot,
          progress,
        });
        if (__DEV__ && repairedDays.length > 0) {
          console.log('[ProfileProvider] repaired skipped day states', {
            userId,
            programSlug: snapshot.ownedProgram,
            repairedDays,
            source,
          });
        }
        if (repairedDays.length > 0) {
          await queryClient.invalidateQueries({
            queryKey: finalizedDayStatesQueryKey(userId, snapshot.ownedProgram),
          });
        }
      } catch (repairError) {
        console.warn(`Failed to repair skipped day states during ${source}`, repairError);
      }

      try {
        const pauseResult = await AccessService.pauseProgramForAbsenceIfNeeded(userId, snapshot);
        if (pauseResult) {
          snapshot = pauseResult.snapshot;
          progress = pauseResult.progress;
          await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
          await queryClient.invalidateQueries({
            queryKey: finalizedDayStatesQueryKey(userId, snapshot.ownedProgram),
          });
          if (__DEV__) {
            console.log('[ProfileProvider] auto-paused program after absence', {
              userId,
              programSlug: snapshot.ownedProgram,
              currentDay: snapshot.currentDay,
              source,
            });
          }
        }
      } catch (pauseError) {
        console.warn(`Failed to auto-pause program during ${source}`, pauseError);
      }

      return { progress, snapshot };
    },
    [queryClient, userId]
  );

  const refreshAccess = useCallback(async (options?: { source?: 'device_store' | 'supabase' }) => {
    if (!userId) {
      return {
        ownerUserId: null,
        ownedProgram: null,
        purchaseState: 'not_owned',
        completionState: 'not_started',
        programState: 'not_owned',
        currentDay: null,
        startedAt: null,
        scheduledStartDate: null,
        pausedAt: null,
        completedAt: null,
        archivedAt: null,
        eligibleProducts: DEFAULT_ELIGIBLE_PRODUCTS,
        source: 'local',
      } satisfies ProgramAccessSnapshot;
    }

    setIsAccessLoading(true);

    try {
      const snapshot =
        options?.source === 'supabase'
          ? (await AccessService.hydrateFromSupabase(userId)).snapshot
          : await AccessService.refreshFromDeviceStore(userId);
      const nextProgress = await AccessService.getProgressRecord(userId, snapshot.ownedProgram);
      const resolvedLifecycle = await resolveAccessLifecycle({
        progress: nextProgress,
        snapshot,
        source: options?.source === 'supabase' ? 'supabase access refresh' : 'access refresh',
      });
      if (__DEV__) {
        console.log('[ProfileProvider] refreshAccess:resolved', {
          userId,
          snapshotOwnerUserId: resolvedLifecycle.snapshot.ownerUserId ?? null,
          snapshotOwnedProgram: resolvedLifecycle.snapshot.ownedProgram,
          snapshotPurchaseState: resolvedLifecycle.snapshot.purchaseState,
          progressUserId: resolvedLifecycle.progress?.userId ?? null,
          progressProgramSlug: resolvedLifecycle.progress?.programSlug ?? null,
        });
      }
      setAccess(resolvedLifecycle.snapshot);
      setProgress(resolvedLifecycle.progress);
      const widgetPayload = buildWidgetPayload({ access: resolvedLifecycle.snapshot, progress: resolvedLifecycle.progress, steps: 0 });
      if (widgetPayload) void syncWidgetData(widgetPayload);
      return resolvedLifecycle.snapshot;
    } catch (error) {
      console.error('Error refreshing access state:', error);
      const fallbackSnapshot = await AccessService.getAccessSnapshot();
      const fallbackProgress = await AccessService.getProgressRecord(userId, fallbackSnapshot.ownedProgram);
      setAccess(fallbackSnapshot);
      setProgress(fallbackProgress);
      const fallbackWidgetPayload = buildWidgetPayload({ access: fallbackSnapshot, progress: fallbackProgress, steps: 0 });
      if (fallbackWidgetPayload) void syncWidgetData(fallbackWidgetPayload);
      return fallbackSnapshot;
    } finally {
      setIsAccessLoading(false);
    }
  }, [resolveAccessLifecycle, userId]);

  const setProgramAccess = useCallback(
    async (program: ProgramSlug | null) => {
      if (!userId || !program) {
        return;
      }

      const nextSnapshot = {
        ownerUserId: userId,
        ownedProgram: program,
        purchaseState: 'owned_active',
        completionState: 'not_started',
        programState: 'purchased',
        currentDay: null,
        startedAt: null,
        scheduledStartDate: null,
        pausedAt: null,
        completedAt: null,
        archivedAt: null,
        eligibleProducts: [],
        source: 'local',
      } satisfies ProgramAccessSnapshot;

      const nextProgress = AccessService.buildProgressRecord(userId, program);
      await AccessService.recordOwnedProgramPurchase(userId, program);
      await Promise.all([
        AccessService.saveLocalActiveProgramPreference(userId, program),
        AccessService.saveAccessSnapshot(nextSnapshot),
        AccessService.saveProgressRecord(nextProgress),
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

  const configureProgramStart = useCallback(
    async (program: ProgramSlug, scheduledStartDate: string) => {
      if (!userId) {
        return;
      }

      setIsAccessLoading(true);

      try {
        const { snapshot, progress: nextProgress } = await AccessService.configureProgramStart(
          userId,
          program,
          scheduledStartDate
        );
        setAccess(snapshot);
        setProgress(nextProgress);
        setNotificationRefreshNonce((value) => value + 1);
        await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
      } finally {
        setIsAccessLoading(false);
      }
    },
    [queryClient, userId]
  );

  const resumeProgramFromPause = useCallback(
    async (program: ProgramSlug) => {
      if (!userId) {
        return;
      }

      setIsAccessLoading(true);

      try {
        const { snapshot, progress: nextProgress } = await AccessService.resumeProgramFromPause(
          userId,
          program
        );
        setAccess(snapshot);
        setProgress(nextProgress);
        setNotificationRefreshNonce((value) => value + 1);
        await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
      } finally {
        setIsAccessLoading(false);
      }
    },
    [queryClient, userId]
  );

  const pauseProgramManually = useCallback(
    async (program: ProgramSlug) => {
      if (!userId) {
        return;
      }

      setIsAccessLoading(true);

      try {
        const { snapshot, progress: nextProgress } = await AccessService.pauseProgramManually(
          userId,
          program
        );
        setAccess(snapshot);
        setProgress(nextProgress);
        setNotificationRefreshNonce((value) => value + 1);
        await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
      } finally {
        setIsAccessLoading(false);
      }
    },
    [queryClient, userId]
  );

  const prepareOwnedProgramSetup = useCallback(
    async (program: ProgramSlug) => {
      if (!userId) {
        return;
      }

      setIsAccessLoading(true);

      try {
        const { snapshot, progress: nextProgress } = await AccessService.prepareOwnedProgramSetup(
          userId,
          program
        );
        setAccess(snapshot);
        setProgress(nextProgress);
        await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
      } finally {
        setIsAccessLoading(false);
      }
    },
    [queryClient, userId]
  );

  const reorderOwnedProgramQueue = useCallback(
    async (programs: ProgramSlug[]) => {
      if (!userId) {
        return [];
      }

      const reorderedPrograms = await AccessService.reorderOwnedProgramQueue(userId, programs);
      await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
      return reorderedPrograms.map((program) => program.programSlug);
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

          return {
            ...current,
            currentDay: current.currentDay,
            completedDays,
            partialDays,
            completedAt: hasCompletedProgram ? new Date().toISOString() : current.completedAt,
            archivedAt: current.archivedAt,
          };
        }
      );

      await AccessService.syncStateToSupabase(nextProgress);

      if (dayNumber >= PROGRAM_METADATA[program].totalDays) {
        const completionSnapshot = await AccessService.getAccessSnapshot();
        const completionProgress = await AccessService.getProgressRecord(userId, program);
        setProgress(completionProgress ?? nextProgress);
        setAccess(completionSnapshot.ownedProgram === program ? completionSnapshot : nextSnapshot);
        setNotificationRefreshNonce((value) => value + 1);
        await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
        return;
      }

      setProgress(nextProgress);
      setAccess(nextSnapshot);
      setNotificationRefreshNonce((value) => value + 1);
    },
    [queryClient, userId]
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
      setNotificationRefreshNonce((value) => value + 1);
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
        programState: 'not_owned',
        currentDay: null,
        startedAt: null,
        scheduledStartDate: null,
        pausedAt: null,
        completedAt: null,
        archivedAt: null,
        eligibleProducts: DEFAULT_ELIGIBLE_PRODUCTS,
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
              programState: 'not_owned',
              currentDay: null,
              startedAt: null,
              scheduledStartDate: null,
              pausedAt: null,
              completedAt: null,
              archivedAt: null,
              eligibleProducts: DEFAULT_ELIGIBLE_PRODUCTS,
              source: 'local',
            } satisfies ProgramAccessSnapshot;

      if (__DEV__) {
        console.log('[ProfileProvider] bootstrapAccessState:cached', {
          userId,
          cachedSnapshotOwnerUserId: cachedSnapshot.ownerUserId ?? null,
          cachedSnapshotOwnedProgram: cachedSnapshot.ownedProgram,
          cachedProgressUserId: cachedProgress?.userId ?? null,
          cachedProgressProgramSlug: cachedProgress?.programSlug ?? null,
          safeCachedSnapshotOwnedProgram: safeCachedSnapshot.ownedProgram,
          safeCachedProgressProgramSlug: safeCachedProgress?.programSlug ?? null,
        });
      }

      setAccess(safeCachedSnapshot);
      setProgress(safeCachedProgress);

      const liveSnapshot = await AccessService.refreshFromDeviceStore(userId);
      const liveProgress = await AccessService.getProgressRecord(userId, liveSnapshot.ownedProgram);
      const resolvedLifecycle = await resolveAccessLifecycle({
        progress: liveProgress,
        snapshot: liveSnapshot,
        source: 'access bootstrap',
      });
      if (__DEV__) {
        console.log('[ProfileProvider] bootstrapAccessState:live', {
          userId,
          liveSnapshotOwnerUserId: resolvedLifecycle.snapshot.ownerUserId ?? null,
          liveSnapshotOwnedProgram: resolvedLifecycle.snapshot.ownedProgram,
          liveSnapshotPurchaseState: resolvedLifecycle.snapshot.purchaseState,
          liveProgressUserId: resolvedLifecycle.progress?.userId ?? null,
          liveProgressProgramSlug: resolvedLifecycle.progress?.programSlug ?? null,
        });
      }
      setAccess(resolvedLifecycle.snapshot);
      setProgress(resolvedLifecycle.progress);

      // Sync widget data whenever live access state is resolved
      const liveWidgetPayload = buildWidgetPayload({ access: resolvedLifecycle.snapshot, progress: resolvedLifecycle.progress, steps: 0 });
      if (liveWidgetPayload) void syncWidgetData(liveWidgetPayload);
    } catch (error) {
      console.error('Error bootstrapping access state', error);
    } finally {
      setIsAccessLoading(false);
    }
  }, [resolveAccessLifecycle, userId]);

  useEffect(() => {
    void bootstrapAccessState();

    if (!userId) {
      return;
    }

    // Re-sync widget data when app returns to foreground
    const appStateSubscription = AppState.addEventListener('change', (nextState: string) => {
      if (nextState === 'active') {
        setNotificationRefreshNonce((value) => value + 1);
        void bootstrapAccessState();
      }
    });

    const updateListener = (customerInfo: CustomerInfo) => {
      void AccessService.syncFromRevenueCat(customerInfo, userId)
        .then(async (snapshot) => {
          const nextProgress = await AccessService.getProgressRecord(userId, snapshot.ownedProgram);
          const resolvedLifecycle = await resolveAccessLifecycle({
            progress: nextProgress,
            snapshot,
            source: 'customer info update',
          });
          if (__DEV__) {
            console.log('[ProfileProvider] customerInfoUpdate', {
              userId,
              snapshotOwnerUserId: resolvedLifecycle.snapshot.ownerUserId ?? null,
              snapshotOwnedProgram: resolvedLifecycle.snapshot.ownedProgram,
              snapshotPurchaseState: resolvedLifecycle.snapshot.purchaseState,
              progressUserId: resolvedLifecycle.progress?.userId ?? null,
              progressProgramSlug: resolvedLifecycle.progress?.programSlug ?? null,
            });
          }
          setAccess(resolvedLifecycle.snapshot);
          setProgress(resolvedLifecycle.progress);
          await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
        })
        .catch((error) => {
          console.error('Error syncing RevenueCat access update', error);
        });
    };

    Purchases.addCustomerInfoUpdateListener(updateListener);

    return () => {
      appStateSubscription.remove();
      Purchases.removeCustomerInfoUpdateListener(updateListener);
    };
  }, [bootstrapAccessState, queryClient, resolveAccessLifecycle, userId]);

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
      programState: 'not_owned',
      currentDay: null,
      startedAt: null,
      scheduledStartDate: null,
      pausedAt: null,
      completedAt: null,
      archivedAt: null,
      eligibleProducts: DEFAULT_ELIGIBLE_PRODUCTS,
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

  useEffect(() => {
    if (!userId || profileQuery.isPending) {
      return;
    }

    let isCancelled = false;

    void rescheduleProgramNotificationsForAccess({
      access: {
        ownedProgram: access.ownedProgram,
        purchaseState: access.purchaseState,
        completionState: access.completionState,
        programState: access.programState,
        currentDay: access.currentDay,
        scheduledStartDate: access.scheduledStartDate,
        pausedAt: access.pausedAt,
        completedAt: access.completedAt,
      },
      openedToday: true,
      profile: {
        notifications_enabled: Boolean(profileQuery.data?.notifications_enabled) || notificationPermissionGranted,
        push_opt_in: Boolean(profileQuery.data?.push_opt_in) || notificationPermissionGranted,
      },
      userId,
    }).catch((error) => {
      if (isCancelled) return;
      console.warn('Failed to refresh program notification schedule', error);
    });

    return () => {
      isCancelled = true;
    };
  }, [
    access.completedAt,
    access.completionState,
    access.currentDay,
    access.ownedProgram,
    access.pausedAt,
    access.programState,
    access.purchaseState,
    access.scheduledStartDate,
    notificationRefreshNonce,
    notificationPermissionGranted,
    profileQuery.data?.notifications_enabled,
    profileQuery.data?.push_opt_in,
    profileQuery.isPending,
    userId,
  ]);

  const updateProfile = useCallback(
    async (fields: { display_name?: string | null }) => {
      if (!userId) return;

      const nextDisplayName =
        fields.display_name === undefined
          ? undefined
          : validateDisplayNameInput(fields.display_name ?? '');

      const { error } = await supabase
        .from('profiles')
        .update({
          ...fields,
          ...(nextDisplayName !== undefined ? { display_name: nextDisplayName } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      queryClient.setQueryData<UserProfile | null>(
        PROFILE_QUERY_KEY(userId),
        (current) =>
          current
            ? {
                ...current,
                ...fields,
                ...(nextDisplayName !== undefined ? { display_name: nextDisplayName } : {}),
                updated_at: new Date().toISOString(),
              }
            : current
      );
    },
    [queryClient, userId]
  );

  const activateFreeTier = useCallback(
    async () => {
      if (!userId) return;

      const activatedAt = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({
          free_tier_activated_at: activatedAt,
          updated_at: activatedAt,
        })
        .eq('id', userId);

      if (error) throw error;

      queryClient.setQueryData<UserProfile | null>(
        PROFILE_QUERY_KEY(userId),
        (current) =>
          current
            ? {
                ...current,
                free_tier_activated_at: activatedAt,
                updated_at: activatedAt,
              }
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
      isSubscribed: hasAnyProgramEntitlement(access),
      access,
      progress,
      hasProgramAccess: hasAnyProgramEntitlement(access),
      refreshAccess,
      refreshProfile,
      setProgramAccess,
      selectActiveProgram,
      configureProgramStart,
      pauseProgramManually,
      resumeProgramFromPause,
      prepareOwnedProgramSetup,
      reorderOwnedProgramQueue,
      savePartialProgramDay,
      completeProgramDay,
      updateProfile,
      activateFreeTier,
      uploadAvatar,
    }),
    [
      activateFreeTier,
      access,
      completeProgramDay,
      configureProgramStart,
      pauseProgramManually,
      prepareOwnedProgramSetup,
      profileQuery.data,
      profileQuery.isPending,
      progress,
      refreshAccess,
      refreshProfile,
      reorderOwnedProgramQueue,
      resumeProgramFromPause,
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
