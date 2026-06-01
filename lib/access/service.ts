import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo } from 'react-native-purchases';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import {
  getPauseDayNumberForAbsence,
  getResumeStartedAtForDay,
  shouldEvaluateAbsencePause,
} from '@/lib/programs/absence';
import {
  formatLocalDateForProgramStart,
  getScheduledProgramUnlockAt,
  isProgramProgressComplete,
} from '@/lib/programs/lifecycle';
import { getProgramScheduledDay } from '@/lib/programs/schedule';
import { getOwnedProgramsFromCustomerInfo } from '@/lib/revenuecat/config';
import { supabase } from '@/lib/supabase';
import { isMissingColumnError, isMissingFunctionError } from '@/lib/db-compat';
import {
  CompletionState,
  ProgramLifecycleState,
  ProgramAccessSnapshot,
  ProgramProgressRecord,
  ProgramSlug,
  PurchaseState,
} from '@/lib/programs/types';

const ACCESS_STORAGE_KEY = 'program-access-snapshot';
const ACTIVE_PROGRAM_STORAGE_KEY_PREFIX = 'program-active-preference:';
const PROGRESS_STORAGE_KEY = 'program-progress-record';
const PROGRESS_STORAGE_KEY_PREFIX = `${PROGRESS_STORAGE_KEY}:`;
const REFRESH_IN_FLIGHT = new Map<string, Promise<ProgramAccessSnapshot>>();
const SYNC_FROM_REVENUECAT_IN_FLIGHT = new Map<string, Promise<ProgramAccessSnapshot>>();
const DEFAULT_ELIGIBLE_PRODUCTS: ProgramSlug[] = ['smoking_alcohol_quit'];

type UserDayStateLifecycleRow = {
  day_number: number;
  day_state: string;
};

const DEFAULT_ACCESS_SNAPSHOT: ProgramAccessSnapshot = {
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
};

function createDefaultSnapshot(
  source: ProgramAccessSnapshot['source'] = 'local',
  ownerUserId: string | null = null
): ProgramAccessSnapshot {
  return {
    ...DEFAULT_ACCESS_SNAPSHOT,
    ownerUserId,
    source,
  };
}

function getProgramLength(programSlug: ProgramSlug) {
  return PROGRAM_METADATA[programSlug].totalDays;
}

function getStateForProgress(
  programSlug: ProgramSlug | null,
  progress: ProgramProgressRecord | null,
  startedAt: string | null | undefined,
  frozenCurrentDay?: number | null
): Pick<ProgramAccessSnapshot, 'currentDay' | 'purchaseState' | 'completionState' | 'completedAt' | 'archivedAt'> {
  if (!programSlug) {
    return {
      currentDay: null,
      purchaseState: 'not_owned',
      completionState: 'not_started',
      completedAt: null,
      archivedAt: null,
    };
  }

  const totalDays = getProgramLength(programSlug);
  const scheduledDay = getProgramScheduledDay(startedAt, totalDays);
  const highestTouchedDay = Math.max(
    0,
    ...(progress?.completedDays ?? []),
    ...(progress?.partialDays ?? []),
    progress?.currentDay ?? 0
  );
  const unlockedThroughDay = Math.min(
    totalDays,
    Math.max(scheduledDay, highestTouchedDay || 1)
  );

  if (!progress) {
    return {
      currentDay: scheduledDay,
      purchaseState: 'owned_active',
      completionState: 'in_progress',
      completedAt: null,
      archivedAt: null,
    };
  }

  const isProgramComplete = progress.completedDays.includes(totalDays) || Boolean(progress.completedAt);
  const isArchived = Boolean(progress.archivedAt);
  const effectiveScheduledDay = isProgramComplete
    ? totalDays
    : unlockedThroughDay;
  const currentDay = frozenCurrentDay
    ? Math.min(totalDays, Math.max(1, frozenCurrentDay))
    : effectiveScheduledDay;

  let completionState: CompletionState = 'in_progress';
  let purchaseState: PurchaseState = 'owned_active';

  if (isArchived) {
    completionState = 'archived';
    purchaseState = 'owned_archived';
  } else if (isProgramComplete) {
    completionState = 'completed';
    purchaseState = 'owned_completed';
  }

  return {
    currentDay,
    purchaseState,
    completionState,
    completedAt: progress.completedAt,
    archivedAt: progress.archivedAt,
  };
}

function deriveEligibleProducts(snapshot: ProgramAccessSnapshot): ProgramSlug[] {
  if (
    snapshot.ownedProgram === 'six_day_reset' &&
    (snapshot.purchaseState === 'owned_completed' || snapshot.purchaseState === 'owned_archived')
  ) {
    return ['smoking_alcohol_quit'];
  }

  if (snapshot.ownedProgram) {
    return [];
  }

  return DEFAULT_ELIGIBLE_PRODUCTS;
}

function normalizeProgramSlug(value: string | null | undefined): ProgramSlug | null {
  if (!value) {
    return null;
  }

  return value in PROGRAM_METADATA ? (value as ProgramSlug) : null;
}

function isProgressOwnedByUser(progress: ProgramProgressRecord | null, userId: string) {
  return Boolean(progress && progress.userId === userId);
}

function isSnapshotOwnedByUser(snapshot: ProgramAccessSnapshot | null, userId: string) {
  return Boolean(snapshot?.ownerUserId && snapshot.ownerUserId === userId);
}

function normalizeProgressRecord(progress: ProgramProgressRecord): ProgramProgressRecord {
  return {
    ...progress,
    completedDays: Array.isArray(progress.completedDays) ? progress.completedDays : [],
    partialDays: Array.isArray(progress.partialDays) ? progress.partialDays : [],
  };
}

function getProgressStorageKey(userId: string, programSlug: ProgramSlug) {
  return `${PROGRESS_STORAGE_KEY_PREFIX}${userId}:${programSlug}`;
}

function getActiveProgramStorageKey(userId: string) {
  return `${ACTIVE_PROGRAM_STORAGE_KEY_PREFIX}${userId}`;
}

type LocalActiveProgramPreference = {
  userId: string;
  programSlug: ProgramSlug;
  updatedAt: string;
};

type ProgramAccessRow = {
  archived_at: string | null;
  completed_at: string | null;
  completion_state: string | null;
  created_at?: string | null;
  current_day: number | null;
  owned_program: string | null;
  paused_at?: string | null;
  priority_rank?: number | null;
  program_state?: string | null;
  purchase_state: string | null;
  scheduled_start_date?: string | null;
  started_at?: string | null;
  updated_at?: string | null;
};

type CompleteProgramLifecycleRow = {
  completed_at: string | null;
  completion_state: string | null;
  current_day: number | null;
  owned_program: string | null;
  program_state: string | null;
  purchase_state: string | null;
  updated_at: string | null;
};

type QueuedProgramRow = {
  owned_program: string | null;
  priority_rank: number | null;
  program_state: string | null;
  updated_at: string | null;
};

type OwnedProgramPurchaseRow = {
  completion_state: string | null;
  owned_program: string | null;
  priority_rank: number | null;
  program_state: string | null;
  purchase_state: string | null;
  updated_at: string | null;
};

const PROGRAM_ACCESS_SELECT =
  'owned_program, purchase_state, completion_state, program_state, current_day, completed_at, archived_at, scheduled_start_date, paused_at, priority_rank, started_at, created_at, updated_at';
const LEGACY_PROGRAM_ACCESS_SELECT =
  'owned_program, purchase_state, completion_state, program_state, current_day, completed_at, archived_at, scheduled_start_date, paused_at, started_at, created_at, updated_at';

function buildSnapshotFromAccessRow(
  userId: string,
  selectedRow: ProgramAccessRow
): ProgramAccessSnapshot | null {
  const ownedProgram = normalizeProgramSlug(selectedRow.owned_program);
  if (!ownedProgram) return null;

  const snapshot: ProgramAccessSnapshot = {
    ownerUserId: userId,
    ownedProgram,
    purchaseState: (selectedRow.purchase_state as PurchaseState) ?? 'not_owned',
    completionState: (selectedRow.completion_state as CompletionState) ?? 'not_started',
    programState: normalizeProgramLifecycleState(selectedRow.program_state),
    currentDay: selectedRow.current_day,
    startedAt: selectedRow.started_at ?? selectedRow.scheduled_start_date ?? selectedRow.created_at ?? null,
    scheduledStartDate: selectedRow.scheduled_start_date ?? null,
    pausedAt: selectedRow.paused_at ?? null,
    completedAt: selectedRow.completed_at,
    archivedAt: selectedRow.archived_at,
    eligibleProducts: DEFAULT_ELIGIBLE_PRODUCTS,
    source: 'supabase',
  };

  snapshot.eligibleProducts = deriveEligibleProducts(snapshot);
  return snapshot;
}

function normalizeProgramLifecycleState(value: string | null | undefined): ProgramLifecycleState {
  switch (value) {
    case 'purchased':
    case 'scheduled':
    case 'active':
    case 'paused':
    case 'completed':
    case 'not_owned':
      return value;
    default:
      return 'active';
  }
}

function getPurchaseStateRank(purchaseState: string | null | undefined) {
  switch (purchaseState) {
    case 'owned_active':
      return 3;
    case 'owned_completed':
      return 2;
    case 'owned_archived':
      return 1;
    default:
      return 0;
  }
}

function isBlockingLifecycleState(value: string | null | undefined) {
  const state = normalizeProgramLifecycleState(value);
  return state === 'scheduled' || state === 'active' || state === 'paused';
}

function getLifecycleSelectionRank(row: ProgramAccessRow) {
  const state = normalizeProgramLifecycleState(row.program_state);

  switch (state) {
    case 'active':
    case 'paused':
    case 'scheduled':
      return 5;
    case 'purchased':
      return 4;
    case 'completed':
      return 3;
    default:
      return 0;
  }
}

function shouldHydrateProgressForSnapshot(snapshot: ProgramAccessSnapshot | null | undefined) {
  if (!snapshot?.ownedProgram) {
    return false;
  }

  return snapshot.programState !== 'purchased';
}

function selectPreferredProgramSlug(
  candidates: ProgramSlug[],
  preferences: (ProgramSlug | null | undefined)[]
): ProgramSlug | null {
  const uniqueCandidates = Array.from(new Set(candidates)).sort((left, right) =>
    left.localeCompare(right)
  );

  for (const preference of preferences) {
    if (preference && uniqueCandidates.includes(preference)) {
      return preference;
    }
  }

  return uniqueCandidates[0] ?? null;
}

async function getProfileRecommendedProgram(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('recommended_program')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return normalizeProgramSlug(data?.recommended_program ?? null);
  } catch (error) {
    console.warn('Failed to fetch recommended program for access resolution', error);
    return null;
  }
}

async function getServerActiveProgramPreference(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_program_preferences')
      .select('active_program')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return normalizeProgramSlug(data?.active_program ?? null);
  } catch (error) {
    console.warn('Failed to fetch active program preference', error);
    return null;
  }
}

function selectPreferredAccessRow(
  rows: ProgramAccessRow[],
  preferredProgram: ProgramSlug | null
): ProgramAccessRow | null {
  if (!rows.length) {
    return null;
  }

  const rankedRows = [...rows].sort((left, right) => {
    const leftProgram = normalizeProgramSlug(left.owned_program);
    const rightProgram = normalizeProgramSlug(right.owned_program);
    const leftBlocking = isBlockingLifecycleState(left.program_state) ? 1 : 0;
    const rightBlocking = isBlockingLifecycleState(right.program_state) ? 1 : 0;

    if (leftBlocking !== rightBlocking) {
      return rightBlocking - leftBlocking;
    }

    if (preferredProgram) {
      const leftPreferred = leftProgram === preferredProgram ? 1 : 0;
      const rightPreferred = rightProgram === preferredProgram ? 1 : 0;

      if (leftPreferred !== rightPreferred) {
        return rightPreferred - leftPreferred;
      }
    }

    const lifecycleStateDelta = getLifecycleSelectionRank(right) - getLifecycleSelectionRank(left);

    if (lifecycleStateDelta !== 0) {
      return lifecycleStateDelta;
    }

    const leftPriorityRank = left.priority_rank ?? Number.MAX_SAFE_INTEGER;
    const rightPriorityRank = right.priority_rank ?? Number.MAX_SAFE_INTEGER;

    if (leftPriorityRank !== rightPriorityRank) {
      return leftPriorityRank - rightPriorityRank;
    }

    const purchaseStateDelta =
      getPurchaseStateRank(right.purchase_state) - getPurchaseStateRank(left.purchase_state);

    if (purchaseStateDelta !== 0) {
      return purchaseStateDelta;
    }

    const leftUpdatedAt = left.updated_at ? Date.parse(left.updated_at) : 0;
    const rightUpdatedAt = right.updated_at ? Date.parse(right.updated_at) : 0;

    if (leftUpdatedAt !== rightUpdatedAt) {
      return rightUpdatedAt - leftUpdatedAt;
    }

    return (right.current_day ?? 0) - (left.current_day ?? 0);
  });

  return rankedRows[0] ?? null;
}

export class AccessService {
  static async isRevenueCatReadyForUser(userId: string) {
    try {
      const isConfigured = await Purchases.isConfigured();

      if (!isConfigured) {
        return false;
      }

      const revenueCatUserId = await Purchases.getAppUserID();

      return Boolean(revenueCatUserId?.trim()) && revenueCatUserId === userId;
    } catch (error) {
      console.warn('Unable to verify RevenueCat app user state', error);
      return false;
    }
  }

  static async getAccessSnapshot() {
    try {
      const rawValue = await AsyncStorage.getItem(ACCESS_STORAGE_KEY);
      if (!rawValue) return createDefaultSnapshot();
      return JSON.parse(rawValue) as ProgramAccessSnapshot;
    } catch (error) {
      console.error('Failed to read program access snapshot', error);
      return createDefaultSnapshot();
    }
  }

  static async saveAccessSnapshot(snapshot: ProgramAccessSnapshot) {
    await AsyncStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(snapshot));
  }

  static async getLocalActiveProgramPreference(userId: string) {
    try {
      const rawValue = await AsyncStorage.getItem(getActiveProgramStorageKey(userId));
      if (!rawValue) return null;

      const parsed = JSON.parse(rawValue) as Partial<LocalActiveProgramPreference>;
      const programSlug = normalizeProgramSlug(parsed.programSlug);

      if (parsed.userId !== userId || !programSlug) {
        return null;
      }

      return programSlug;
    } catch (error) {
      console.warn('Failed to read local active program preference', error);
      return null;
    }
  }

  static async saveLocalActiveProgramPreference(userId: string, programSlug: ProgramSlug) {
    const preference: LocalActiveProgramPreference = {
      userId,
      programSlug,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(getActiveProgramStorageKey(userId), JSON.stringify(preference));
  }

  private static async getLegacyProgressRecord() {
    try {
      const rawValue = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!rawValue) return null;
      return normalizeProgressRecord(JSON.parse(rawValue) as ProgramProgressRecord);
    } catch (error) {
      console.error('Failed to read program progress record', error);
      return null;
    }
  }

  static async getProgressRecord(userId?: string | null, programSlug?: ProgramSlug | null) {
    if (!userId || !programSlug) {
      return await this.getLegacyProgressRecord();
    }

    try {
      const rawValue = await AsyncStorage.getItem(getProgressStorageKey(userId, programSlug));
      if (rawValue) {
        return normalizeProgressRecord(JSON.parse(rawValue) as ProgramProgressRecord);
      }

      const legacyProgress = await this.getLegacyProgressRecord();
      if (legacyProgress?.userId === userId && legacyProgress.programSlug === programSlug) {
        await this.saveProgressRecord(legacyProgress);
        await AsyncStorage.removeItem(PROGRESS_STORAGE_KEY);
        return legacyProgress;
      }

      return null;
    } catch (error) {
      console.error('Failed to read program progress record', error);
      return null;
    }
  }

  static async saveProgressRecord(progress: ProgramProgressRecord) {
    const normalizedProgress = normalizeProgressRecord(progress);
    await AsyncStorage.setItem(
      getProgressStorageKey(normalizedProgress.userId, normalizedProgress.programSlug),
      JSON.stringify(normalizedProgress)
    );

    const legacyProgress = await this.getLegacyProgressRecord();
    if (
      legacyProgress?.userId === normalizedProgress.userId &&
      legacyProgress.programSlug === normalizedProgress.programSlug
    ) {
      await AsyncStorage.removeItem(PROGRESS_STORAGE_KEY);
    }
  }

  static async removeProgressRecord(userId?: string | null, programSlug?: ProgramSlug | null) {
    if (userId && programSlug) {
      await AsyncStorage.removeItem(getProgressStorageKey(userId, programSlug));
      return;
    }

    await AsyncStorage.removeItem(PROGRESS_STORAGE_KEY);
  }

  static async clear() {
    const keys = await AsyncStorage.getAllKeys();
    const progressKeys = keys.filter((key) => key.startsWith(PROGRESS_STORAGE_KEY_PREFIX));
    const activeProgramKeys = keys.filter((key) => key.startsWith(ACTIVE_PROGRAM_STORAGE_KEY_PREFIX));
    await AsyncStorage.multiRemove([
      ACCESS_STORAGE_KEY,
      PROGRESS_STORAGE_KEY,
      ...progressKeys,
      ...activeProgramKeys,
    ]);
  }

  static buildProgressRecord(userId: string, programSlug: ProgramSlug): ProgramProgressRecord {
    return {
      userId,
      programSlug,
      currentDay: 1,
      completedDays: [],
      partialDays: [],
      completedAt: null,
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    };
  }

  static async getServerAccessSnapshot(userId: string, preferredProgram?: ProgramSlug | null) {
    try {
      let { data, error }: { data: unknown[] | null; error: unknown } = await supabase
        .from('program_access')
        .select(PROGRAM_ACCESS_SELECT)
        .eq('user_id', userId);

      if (error && isMissingColumnError(error, 'priority_rank')) {
        const legacyResult = await supabase
          .from('program_access')
          .select(LEGACY_PROGRAM_ACCESS_SELECT)
          .eq('user_id', userId);

        data = legacyResult.data as unknown[] | null;
        error = legacyResult.error;
      }

      if (error) throw error;
      const ownedRows = ((data ?? []) as ProgramAccessRow[]).filter((row) => {
        return normalizeProgramSlug(row.owned_program) && (row.purchase_state as PurchaseState | null) !== 'not_owned';
      });
      const selectedRow = selectPreferredAccessRow(ownedRows, preferredProgram ?? null);
      if (!selectedRow) return null;
      return buildSnapshotFromAccessRow(userId, selectedRow);
    } catch (error) {
      console.error('Failed to fetch program access from Supabase', error);
      return null;
    }
  }

  static async getServerProgressRecord(
    userId: string,
    programSlug: ProgramSlug,
    snapshot?: ProgramAccessSnapshot | null
  ) {
    try {
      const { data, error } = await supabase
        .from('program_progress')
        .select('day_id, status, completed_at')
        .eq('user_id', userId)
        .eq('program_id', programSlug)
        .in('status', ['COMPLETED', 'PARTIAL'])
        .order('day_id', { ascending: true });

      if (error) throw error;

      const completedDays = (data ?? [])
        .filter((row) => row.status === 'COMPLETED')
        .map((row) => row.day_id);
      const partialDays = (data ?? [])
        .filter((row) => row.status === 'PARTIAL' && !completedDays.includes(row.day_id))
        .map((row) => row.day_id);
      const totalDays = getProgramLength(programSlug);
      const highestCompletedDay = completedDays.at(-1) ?? 0;
      const highestPartialDay = partialDays.at(-1) ?? 0;
      const isComplete = Boolean(snapshot?.completedAt) || highestCompletedDay >= totalDays;
      const scheduledDay = getProgramScheduledDay(snapshot?.startedAt, totalDays);
      const fallbackCurrentDay = isComplete
        ? totalDays
        : Math.min(
            totalDays,
            Math.max(
              scheduledDay,
              snapshot?.currentDay ?? 0,
              highestCompletedDay,
              highestPartialDay,
              1
            )
          );

      if (
        !completedDays.length &&
        !partialDays.length &&
        !snapshot?.currentDay &&
        !snapshot?.completedAt &&
        !snapshot?.archivedAt
      ) {
        return null;
      }

      return {
        userId,
        programSlug,
        currentDay: snapshot?.currentDay ?? fallbackCurrentDay,
        completedDays,
        partialDays,
        completedAt: snapshot?.completedAt ?? (isComplete ? data?.at(-1)?.completed_at ?? new Date().toISOString() : null),
        archivedAt: snapshot?.archivedAt ?? null,
        updatedAt: new Date().toISOString(),
      } satisfies ProgramProgressRecord;
    } catch (error) {
      console.error('Failed to fetch program progress from Supabase', error);
      return null;
    }
  }

  static async syncProgressRecordToSupabase(progress: ProgramProgressRecord) {
    let didSyncProgress = false;

    try {
      const nextPartialDays = progress.partialDays.filter(
        (dayNumber) => !progress.completedDays.includes(dayNumber)
      );
      const { error } = await supabase.rpc('sync_program_progress_v2', {
        p_program_id: progress.programSlug,
        p_current_day: progress.currentDay,
        p_completed_days: progress.completedDays,
        p_partial_days: nextPartialDays,
        p_completed_at: progress.completedAt ?? undefined,
        p_archived_at: progress.archivedAt ?? undefined,
      });

      if (error) throw error;
      didSyncProgress = true;
    } catch (error) {
      console.warn('Failed to sync extended program progress to Supabase, falling back to legacy sync', error);

      try {
        const { error: fallbackError } = await supabase.rpc('sync_program_progress', {
          p_program_id: progress.programSlug,
          p_current_day: progress.currentDay,
          p_completed_days: progress.completedDays,
          p_completed_at: progress.completedAt ?? undefined,
          p_archived_at: progress.archivedAt ?? undefined,
        });

        if (fallbackError) throw fallbackError;
        didSyncProgress = true;
      } catch (fallbackError) {
        console.error('Failed to sync program progress to Supabase', fallbackError);
      }
    }

    if (didSyncProgress && isProgramProgressComplete(progress)) {
      // Keep program_access canonical; progress rows alone should not be the only completion truth.
      await this.completeProgramLifecycle(
        progress.userId,
        progress.programSlug,
        progress.completedAt ?? undefined
      );
    }
  }

  static async syncStateToSupabase(progress: ProgramProgressRecord | null) {
    if (progress) {
      await this.syncProgressRecordToSupabase(progress);
    }
  }

  static async recordOwnedProgramPurchase(userId: string, programSlug: ProgramSlug) {
    try {
      const { data, error } = await supabase.functions.invoke<{
        access?: OwnedProgramPurchaseRow | null;
        error?: string;
        success?: boolean;
      }>('verify-revenuecat-purchase', {
        body: {
          programSlug,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.success || !data.access) {
        throw new Error(data?.error ?? 'Purchase could not be verified.');
      }

      return ([data.access] as OwnedProgramPurchaseRow[])
        .map((row) => ({
          completionState: (row.completion_state as CompletionState | null) ?? 'not_started',
          programSlug: normalizeProgramSlug(row.owned_program),
          priorityRank: row.priority_rank,
          programState: normalizeProgramLifecycleState(row.program_state),
          purchaseState: (row.purchase_state as PurchaseState | null) ?? 'not_owned',
          updatedAt: row.updated_at,
        }))
        .find((row): row is {
          completionState: CompletionState;
          programSlug: ProgramSlug;
          priorityRank: number | null;
          programState: ProgramLifecycleState;
          purchaseState: PurchaseState;
          updatedAt: string | null;
        } => Boolean(row.programSlug)) ?? null;
    } catch (error) {
      console.warn('Failed to record owned program purchase', {
        userId,
        programSlug,
        error,
      });
      throw error;
    }
  }

  static async configureProgramStart(userId: string, programSlug: ProgramSlug, scheduledStartDate: string) {
    const { error } = await supabase.rpc('configure_program_start', {
      p_program_id: programSlug,
      p_scheduled_start_date: scheduledStartDate,
    });

    if (error) {
      const currentSnapshot = await this.getAccessSnapshot();
      const canUseLocalFallback =
        (error.message?.toLowerCase().includes('program is not owned') ||
          isMissingFunctionError(error, 'configure_program_start')) &&
        isSnapshotOwnedByUser(currentSnapshot, userId) &&
        currentSnapshot.ownedProgram === programSlug &&
        currentSnapshot.purchaseState !== 'not_owned';

      if (!canUseLocalFallback) {
        throw error;
      }

      const localProgress =
        (await this.getProgressRecord(userId, programSlug)) ?? this.buildProgressRecord(userId, programSlug);
      const scheduledUnlockAt = getScheduledProgramUnlockAt(scheduledStartDate);
      const localStartedAt = scheduledUnlockAt?.toISOString() ?? currentSnapshot.startedAt ?? new Date().toISOString();
      const localSnapshot: ProgramAccessSnapshot = {
        ...currentSnapshot,
        ownerUserId: userId,
        ownedProgram: programSlug,
        programState:
          scheduledUnlockAt && scheduledUnlockAt.getTime() > Date.now()
            ? 'scheduled'
            : 'active',
        scheduledStartDate,
        pausedAt: null,
        startedAt: localStartedAt,
        ...getStateForProgress(programSlug, localProgress, localStartedAt),
      };

      localSnapshot.eligibleProducts = deriveEligibleProducts(localSnapshot);
      await Promise.all([
        this.saveAccessSnapshot(localSnapshot),
        this.saveProgressRecord(localProgress),
      ]);

      return {
        snapshot: localSnapshot,
        progress: localProgress,
      };
    }

    const snapshot =
      (await this.getServerAccessSnapshot(userId, programSlug)) ??
      createDefaultSnapshot('supabase', userId);
    const shouldHydrateProgress = shouldHydrateProgressForSnapshot(snapshot);
    const progress = shouldHydrateProgress
      ? await this.getServerProgressRecord(userId, snapshot.ownedProgram!, snapshot)
      : null;
    const nextSnapshot: ProgramAccessSnapshot = shouldHydrateProgress
      ? {
          ...snapshot,
          ...getStateForProgress(
            snapshot.ownedProgram,
            progress,
            snapshot.startedAt,
            snapshot.pausedAt ? snapshot.currentDay : null
          ),
          source: 'supabase',
        }
      : snapshot;

    await this.saveAccessSnapshot(nextSnapshot);

    if (progress) {
      if (nextSnapshot.currentDay) {
        progress.currentDay = nextSnapshot.currentDay;
      }
      await this.saveProgressRecord(progress);
    }

    return {
      snapshot: nextSnapshot,
      progress,
    };
  }

  static async completeProgramLifecycle(
    userId: string,
    programSlug: ProgramSlug,
    completedAt?: string | null
  ) {
    try {
      const { data, error } = await supabase.rpc('complete_program_lifecycle', {
        p_completed_at: completedAt ?? new Date().toISOString(),
        p_program_id: programSlug,
      });

      if (error) {
        throw error;
      }

      const row = (data?.[0] ?? null) as CompleteProgramLifecycleRow | null;
      if (!row) {
        throw new Error(`Program completion returned no row for ${programSlug}`);
      }
    } catch (error) {
      console.warn('Failed to persist program completion to Supabase, using local fallback', {
        userId,
        programSlug,
        error,
      });
    }

    const totalDays = getProgramLength(programSlug);
    const serverSnapshot = await this.getServerAccessSnapshot(userId, programSlug);
    const currentSnapshot = await this.getAccessSnapshot();
    const safeSnapshot = serverSnapshot?.ownedProgram === programSlug
      ? serverSnapshot
      : isSnapshotOwnedByUser(currentSnapshot, userId)
        ? currentSnapshot
        : createDefaultSnapshot('local', userId);
    const progress =
      (await this.getProgressRecord(userId, programSlug)) ?? this.buildProgressRecord(userId, programSlug);
    const finalCompletedAt =
      serverSnapshot?.completedAt ??
      progress.completedAt ??
      completedAt ??
      new Date().toISOString();
    const nextSnapshot: ProgramAccessSnapshot = {
      ...safeSnapshot,
      ownerUserId: userId,
      ownedProgram: programSlug,
      purchaseState: 'owned_completed',
      completionState: 'completed',
      programState: 'completed',
      currentDay: totalDays,
      pausedAt: null,
      completedAt: finalCompletedAt,
      archivedAt: safeSnapshot.archivedAt ?? null,
      eligibleProducts: [],
    };

    progress.currentDay = totalDays;
    progress.completedAt = progress.completedAt ?? finalCompletedAt;
    nextSnapshot.eligibleProducts = deriveEligibleProducts(nextSnapshot);

    await Promise.all([
      this.saveAccessSnapshot(nextSnapshot),
      this.saveProgressRecord(progress),
    ]);

    return {
      snapshot: nextSnapshot,
      progress,
    };
  }

  static async pauseProgramForAbsenceIfNeeded(userId: string, snapshot: ProgramAccessSnapshot) {
    if (!shouldEvaluateAbsencePause(snapshot) || !snapshot.ownedProgram) {
      return null;
    }

    const totalDays = getProgramLength(snapshot.ownedProgram);
    const { data, error } = await supabase
      .from('user_day_states')
      .select('day_number, day_state')
      .eq('user_id', userId)
      .eq('program_slug', snapshot.ownedProgram)
      .order('day_number', { ascending: true });

    if (error) {
      throw error;
    }

    const pauseDayNumber = getPauseDayNumberForAbsence(
      ((data ?? []) as UserDayStateLifecycleRow[]).map((dayState) => ({
        dayNumber: dayState.day_number,
        dayState: dayState.day_state,
      })),
      totalDays
    );

    if (!pauseDayNumber) {
      return null;
    }

    return this.pauseProgramForAbsence(userId, snapshot.ownedProgram, pauseDayNumber);
  }

  static async pauseProgramForAbsence(userId: string, programSlug: ProgramSlug, currentDay: number) {
    const pausedAt = new Date().toISOString();

    try {
      const { error } = await supabase.rpc('pause_program_for_absence', {
        p_current_day: currentDay,
        p_paused_at: pausedAt,
        p_program_id: programSlug,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.warn('Failed to persist program pause to Supabase, using local fallback', {
        userId,
        programSlug,
        error,
      });
    }

    const serverSnapshot = await this.getServerAccessSnapshot(userId, programSlug);
    const currentSnapshot = await this.getAccessSnapshot();
    const safeSnapshot = serverSnapshot?.ownedProgram === programSlug
      ? serverSnapshot
      : isSnapshotOwnedByUser(currentSnapshot, userId)
        ? currentSnapshot
        : createDefaultSnapshot('local', userId);
    const progress =
      (await this.getProgressRecord(userId, programSlug)) ?? this.buildProgressRecord(userId, programSlug);
    const nextSnapshot: ProgramAccessSnapshot = {
      ...safeSnapshot,
      ownerUserId: userId,
      ownedProgram: programSlug,
      purchaseState: 'owned_active',
      programState: 'paused',
      currentDay,
      pausedAt: safeSnapshot.pausedAt ?? pausedAt,
      eligibleProducts: [],
    };

    nextSnapshot.eligibleProducts = deriveEligibleProducts(nextSnapshot);
    progress.currentDay = currentDay;

    await Promise.all([
      this.saveAccessSnapshot(nextSnapshot),
      this.saveProgressRecord(progress),
    ]);

    return {
      snapshot: nextSnapshot,
      progress,
    };
  }

  static async resumeProgramFromPause(userId: string, programSlug: ProgramSlug) {
    const currentSnapshot = await this.getAccessSnapshot();
    const safeSnapshot = isSnapshotOwnedByUser(currentSnapshot, userId)
      ? currentSnapshot
      : createDefaultSnapshot('local', userId);
    const currentDay = Math.max(1, safeSnapshot.currentDay ?? 1);
    const resumedStartDate = getResumeStartedAtForDay(currentDay);
    const resumedStartedAt = resumedStartDate.toISOString();
    const resumedScheduledStartDate = formatLocalDateForProgramStart(resumedStartDate);

    try {
      const { error } = await supabase.rpc('resume_program_from_pause', {
        p_program_id: programSlug,
        p_started_at: resumedStartedAt,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.warn('Failed to persist program resume to Supabase, using local fallback', {
        userId,
        programSlug,
        error,
      });
    }

    const serverSnapshot = await this.getServerAccessSnapshot(userId, programSlug);
    const progress =
      (await this.getProgressRecord(userId, programSlug)) ?? this.buildProgressRecord(userId, programSlug);
    const baseSnapshot = serverSnapshot?.ownedProgram === programSlug ? serverSnapshot : safeSnapshot;
    const nextSnapshot: ProgramAccessSnapshot = {
      ...baseSnapshot,
      ownerUserId: userId,
      ownedProgram: programSlug,
      programState: 'active',
      pausedAt: null,
      startedAt: serverSnapshot?.startedAt ?? resumedStartedAt,
      scheduledStartDate: serverSnapshot?.scheduledStartDate ?? resumedScheduledStartDate,
      ...getStateForProgress(programSlug, progress, serverSnapshot?.startedAt ?? resumedStartedAt),
    };

    if (nextSnapshot.currentDay) {
      progress.currentDay = nextSnapshot.currentDay;
    }

    nextSnapshot.eligibleProducts = deriveEligibleProducts(nextSnapshot);

    await Promise.all([
      this.saveAccessSnapshot(nextSnapshot),
      this.saveProgressRecord(progress),
    ]);

    return {
      snapshot: nextSnapshot,
      progress,
    };
  }

  static async selectActiveProgram(userId: string, programSlug: ProgramSlug) {
    let preferenceWriteError: unknown = null;

    try {
      const { error } = await supabase.rpc('select_active_program', {
        p_program_id: programSlug,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      preferenceWriteError = error;
      console.warn('Failed to persist active program preference to Supabase, using local fallback', {
        userId,
        programSlug,
        error,
      });
    }

    let snapshot = await this.getServerAccessSnapshot(userId, programSlug);

    if (snapshot?.ownedProgram === programSlug && snapshot.programState === 'purchased') {
      throw new Error(`${programSlug} is waiting for Program Setup and cannot be opened as an active program yet.`);
    }

    if (snapshot?.ownedProgram !== programSlug) {
      const customerInfo = await Purchases.getCustomerInfo();
      const revenueCatOwnedPrograms = getOwnedProgramsFromCustomerInfo(customerInfo);

      if (!revenueCatOwnedPrograms.includes(programSlug)) {
        throw preferenceWriteError instanceof Error
          ? preferenceWriteError
          : new Error(`Unable to load selected program access for ${programSlug}`);
      }

      const cachedSnapshot = await this.getAccessSnapshot();
      const safeCachedSnapshot = isSnapshotOwnedByUser(cachedSnapshot, userId)
        ? cachedSnapshot
        : createDefaultSnapshot('local', userId);

      snapshot = {
        ...createDefaultSnapshot('revenuecat', userId),
        ownedProgram: programSlug,
        purchaseState: 'owned_active',
        completionState: 'in_progress',
        programState: 'active',
        currentDay: null,
        startedAt:
          safeCachedSnapshot.ownedProgram === programSlug && safeCachedSnapshot.startedAt
            ? safeCachedSnapshot.startedAt
            : new Date().toISOString(),
        scheduledStartDate:
          safeCachedSnapshot.ownedProgram === programSlug
            ? safeCachedSnapshot.scheduledStartDate ?? null
            : null,
        pausedAt: null,
      };
    }

    const shouldHydrateProgress = shouldHydrateProgressForSnapshot(snapshot);
    const serverProgress = shouldHydrateProgress
      ? await this.getServerProgressRecord(userId, programSlug, snapshot)
      : null;
    const cachedProgress = await this.getProgressRecord(userId, programSlug);
    const progress =
      serverProgress ??
      (cachedProgress?.userId === userId && cachedProgress.programSlug === programSlug
        ? cachedProgress
        : this.buildProgressRecord(userId, programSlug));

    const nextSnapshot: ProgramAccessSnapshot = shouldHydrateProgress
      ? {
          ...snapshot,
          ...getStateForProgress(
            programSlug,
            progress,
            snapshot.startedAt,
            snapshot.pausedAt ? snapshot.currentDay : null
          ),
          source: 'supabase',
        }
      : {
          ...snapshot,
          source: 'supabase',
        };

    if (progress && nextSnapshot.currentDay) {
      progress.currentDay = nextSnapshot.currentDay;
    }

    nextSnapshot.eligibleProducts = deriveEligibleProducts(nextSnapshot);

    await Promise.all([
      this.saveLocalActiveProgramPreference(userId, programSlug),
      this.saveAccessSnapshot(nextSnapshot),
      this.saveProgressRecord(progress),
    ]);

    return {
      snapshot: nextSnapshot,
      progress,
    };
  }

  static async hydrateFromSupabase(userId: string, preferredProgram?: ProgramSlug | null) {
    const [localActivePreference, serverActivePreference] = await Promise.all([
      this.getLocalActiveProgramPreference(userId),
      getServerActiveProgramPreference(userId),
    ]);
    const activePreference = preferredProgram ?? localActivePreference ?? serverActivePreference;
    const snapshot = (await this.getServerAccessSnapshot(userId, activePreference)) ?? createDefaultSnapshot('supabase', userId);
    const shouldHydrateProgress = shouldHydrateProgressForSnapshot(snapshot);
    const progress = shouldHydrateProgress
      ? await this.getServerProgressRecord(userId, snapshot.ownedProgram!, snapshot)
      : null;

    const nextSnapshot: ProgramAccessSnapshot = shouldHydrateProgress
      ? {
          ...snapshot,
          ...getStateForProgress(
            snapshot.ownedProgram,
            progress,
            snapshot.startedAt,
            snapshot.pausedAt ? snapshot.currentDay : null
          ),
          source: 'supabase',
        }
      : snapshot.ownedProgram
        ? snapshot
        : createDefaultSnapshot('supabase', userId);

    if (progress && nextSnapshot.currentDay) {
      progress.currentDay = nextSnapshot.currentDay;
    }

    nextSnapshot.eligibleProducts = deriveEligibleProducts(nextSnapshot);

    await this.saveAccessSnapshot(nextSnapshot);

    if (progress) {
      await this.saveProgressRecord(progress);
    } else if (snapshot.ownedProgram) {
      await this.removeProgressRecord(userId, snapshot.ownedProgram);
    } else {
      await this.removeProgressRecord();
    }

    return {
      snapshot: nextSnapshot,
      progress,
    };
  }

  static async syncFromRevenueCat(customerInfo: CustomerInfo, userId: string) {
    const existingSync = SYNC_FROM_REVENUECAT_IN_FLIGHT.get(userId);
    if (existingSync) {
      return existingSync;
    }

    const syncPromise = (async () => {
      const [
        cachedSnapshot,
        profileRecommendedProgram,
        localActiveProgramPreference,
        activeProgramPreference,
      ] = await Promise.all([
        this.getAccessSnapshot(),
        getProfileRecommendedProgram(userId),
        this.getLocalActiveProgramPreference(userId),
        getServerActiveProgramPreference(userId),
      ]);
      const localSnapshot = isSnapshotOwnedByUser(cachedSnapshot, userId)
        ? cachedSnapshot
        : createDefaultSnapshot('local', userId);
      const cachedProgress = await this.getProgressRecord(
        userId,
        localActiveProgramPreference ??
          localSnapshot.ownedProgram ??
          activeProgramPreference ??
          profileRecommendedProgram
      );
      const existingProgress = isProgressOwnedByUser(cachedProgress, userId) ? cachedProgress : null;
      const ownedPrograms = getOwnedProgramsFromCustomerInfo(customerInfo);

      if (__DEV__) console.log('[AccessService] syncFromRevenueCat:start', {
        userId,
        revenueCatAppUserId: customerInfo.originalAppUserId,
        ownedPrograms,
        cachedSnapshotOwnerUserId: cachedSnapshot?.ownerUserId ?? null,
        cachedSnapshotOwnedProgram: cachedSnapshot?.ownedProgram ?? null,
        cachedProgressUserId: cachedProgress?.userId ?? null,
        cachedProgressProgramSlug: cachedProgress?.programSlug ?? null,
        safeLocalOwnedProgram: localSnapshot.ownedProgram,
        localActiveProgramPreference,
        safeExistingProgressProgramSlug: existingProgress?.programSlug ?? null,
        profileRecommendedProgram,
        activeProgramPreference,
      });

      let ownedProgram = selectPreferredProgramSlug(ownedPrograms, [
        localActiveProgramPreference,
        localSnapshot.ownedProgram,
        existingProgress?.programSlug,
        activeProgramPreference,
        profileRecommendedProgram,
      ]);
      const preferredServerProgram =
        localActiveProgramPreference ??
        activeProgramPreference ??
        localSnapshot.ownedProgram ??
        existingProgress?.programSlug ??
        profileRecommendedProgram ??
        ownedProgram ??
        null;
      const serverSnapshot = await this.getServerAccessSnapshot(
        userId,
        preferredServerProgram
      );

      const candidateOwnedPrograms = Array.from(
        new Set<ProgramSlug>([
          ...ownedPrograms,
          ...(serverSnapshot?.ownedProgram ? [serverSnapshot.ownedProgram] : []),
          ...(localSnapshot.ownedProgram ? [localSnapshot.ownedProgram] : []),
        ])
      );

      const blockingServerProgram = serverSnapshot?.ownedProgram && isBlockingLifecycleState(serverSnapshot.programState)
        ? serverSnapshot.ownedProgram
        : null;
      ownedProgram = blockingServerProgram ?? selectPreferredProgramSlug(candidateOwnedPrograms, [
        localActiveProgramPreference,
        localSnapshot.ownedProgram,
        existingProgress?.programSlug,
        activeProgramPreference,
        serverSnapshot?.ownedProgram,
        profileRecommendedProgram,
      ]);
      const selectedServerSnapshot = serverSnapshot?.ownedProgram === ownedProgram ? serverSnapshot : null;
      const selectedProgramState = ownedProgram
        ? selectedServerSnapshot?.programState ?? localSnapshot.programState ?? 'active'
        : 'not_owned';
      const shouldHydrateSelectedProgress = Boolean(ownedProgram && selectedProgramState !== 'purchased');
      const serverProgress =
        ownedProgram && shouldHydrateSelectedProgress
          ? await this.getServerProgressRecord(
              userId,
              ownedProgram,
              selectedServerSnapshot
            )
          : null;
      const nextProgress =
        ownedProgram && shouldHydrateSelectedProgress && serverProgress
          ? serverProgress
          : ownedProgram && shouldHydrateSelectedProgress && existingProgress?.programSlug === ownedProgram
            ? existingProgress
            : ownedProgram && shouldHydrateSelectedProgress
              ? this.buildProgressRecord(userId, ownedProgram)
              : null;

      if (nextProgress) {
        await this.saveProgressRecord(nextProgress);
      } else if (ownedProgram) {
        await this.removeProgressRecord(userId, ownedProgram);
      } else {
        await this.removeProgressRecord();
      }

      const baseSnapshot: ProgramAccessSnapshot = selectedServerSnapshot ?? {
        ...createDefaultSnapshot('revenuecat', userId),
        ownedProgram,
        purchaseState: ownedProgram ? 'owned_active' : 'not_owned',
        completionState: ownedProgram && selectedProgramState !== 'purchased' ? 'in_progress' : 'not_started',
        programState: selectedProgramState,
        currentDay: null,
        scheduledStartDate:
          ownedProgram
            ? localSnapshot.scheduledStartDate ?? null
            : null,
        pausedAt:
          ownedProgram
            ? localSnapshot.pausedAt ?? null
            : null,
        startedAt: ownedProgram
          ? localSnapshot.startedAt ?? (selectedProgramState === 'purchased' ? null : new Date().toISOString())
          : null,
      };
      const snapshot: ProgramAccessSnapshot = shouldHydrateSelectedProgress
        ? {
            ...baseSnapshot,
            ...getStateForProgress(
              ownedProgram,
              nextProgress,
              ownedProgram ? baseSnapshot.startedAt ?? new Date().toISOString() : null,
              ownedProgram && baseSnapshot.pausedAt
                ? baseSnapshot.currentDay
                : null
            ),
          }
        : baseSnapshot;

      if (nextProgress && snapshot.currentDay) {
        nextProgress.currentDay = snapshot.currentDay;
      }

      snapshot.eligibleProducts = deriveEligibleProducts(snapshot);
      await Promise.all([
        ownedProgram
          ? this.saveLocalActiveProgramPreference(userId, ownedProgram)
          : Promise.resolve(),
        this.saveAccessSnapshot(snapshot),
      ]);

      if (__DEV__) console.log('[AccessService] syncFromRevenueCat:resolved', {
        userId,
        ownedPrograms,
        resolvedOwnedProgram: ownedProgram,
        serverSnapshotOwnedProgram: serverSnapshot?.ownedProgram ?? null,
        serverSnapshotPurchaseState: serverSnapshot?.purchaseState ?? null,
        serverProgressProgramSlug: serverProgress?.programSlug ?? null,
        nextProgressProgramSlug: nextProgress?.programSlug ?? null,
        savedSnapshotOwnedProgram: snapshot.ownedProgram,
        savedSnapshotSource: snapshot.source,
        savedSnapshotOwnerUserId: snapshot.ownerUserId ?? null,
        profileRecommendedProgram,
        localActiveProgramPreference,
        activeProgramPreference,
      });

      if (ownedProgram) {
        await this.syncStateToSupabase(nextProgress);
      }

      return snapshot;
    })();

    SYNC_FROM_REVENUECAT_IN_FLIGHT.set(userId, syncPromise);

    try {
      return await syncPromise;
    } finally {
      if (SYNC_FROM_REVENUECAT_IN_FLIGHT.get(userId) === syncPromise) {
        SYNC_FROM_REVENUECAT_IN_FLIGHT.delete(userId);
      }
    }
  }

  static async reorderOwnedProgramQueue(userId: string, programSlugs: ProgramSlug[]) {
    try {
      const { data, error } = await supabase.rpc('reorder_owned_program_queue', {
        p_program_ids: programSlugs,
      });

      if (error) {
        if (isMissingFunctionError(error, 'reorder_owned_program_queue')) {
          return programSlugs.map((programSlug, index) => ({
            programSlug,
            priorityRank: index + 1,
            programState: 'purchased' as ProgramLifecycleState,
            updatedAt: new Date().toISOString(),
          }));
        }
        throw error;
      }

      return ((data ?? []) as QueuedProgramRow[])
        .map((row) => ({
          programSlug: normalizeProgramSlug(row.owned_program),
          priorityRank: row.priority_rank,
          programState: normalizeProgramLifecycleState(row.program_state),
          updatedAt: row.updated_at,
        }))
        .filter((row): row is {
          programSlug: ProgramSlug;
          priorityRank: number | null;
          programState: ProgramLifecycleState;
          updatedAt: string | null;
        } => Boolean(row.programSlug));
    } catch (error) {
      if (__DEV__) {
        console.log('Failed to reorder owned program queue', {
          userId,
          programSlugs,
          error,
        });
      }
      throw error;
    }
  }

  static async prepareOwnedProgramSetup(userId: string, programSlug: ProgramSlug) {
    let { data, error }: { data: unknown | null; error: unknown } = await supabase
      .from('program_access')
      .select(PROGRAM_ACCESS_SELECT)
      .eq('user_id', userId)
      .eq('owned_program', programSlug)
      .maybeSingle();

    if (error && isMissingColumnError(error, 'priority_rank')) {
      const legacyResult = await supabase
        .from('program_access')
        .select(LEGACY_PROGRAM_ACCESS_SELECT)
        .eq('user_id', userId)
        .eq('owned_program', programSlug)
        .maybeSingle();

      data = legacyResult.data as unknown | null;
      error = legacyResult.error;
    }

    if (error) {
      throw error;
    }

    const snapshot = data ? buildSnapshotFromAccessRow(userId, data as ProgramAccessRow) : null;

    if (!snapshot?.ownedProgram || snapshot.purchaseState === 'not_owned') {
      throw new Error(`Program is not owned: ${programSlug}`);
    }

    if (snapshot.programState !== 'purchased') {
      throw new Error(`${programSlug} is not waiting for Program Setup.`);
    }

    const activeSnapshot = await this.getServerAccessSnapshot(userId);
    if (
      activeSnapshot?.ownedProgram &&
      activeSnapshot.ownedProgram !== programSlug &&
      isBlockingLifecycleState(activeSnapshot.programState)
    ) {
      throw new Error('Another program is already active or scheduled.');
    }

    await Promise.all([
      this.saveLocalActiveProgramPreference(userId, programSlug),
      this.saveAccessSnapshot(snapshot),
      this.removeProgressRecord(userId, programSlug),
    ]);

    return {
      snapshot,
      progress: null,
    };
  }

  static async updateProgress(
    userId: string,
    programSlug: ProgramSlug,
    updater: (current: ProgramProgressRecord) => ProgramProgressRecord
  ) {
    const currentProgress =
      (await this.getProgressRecord(userId, programSlug)) ?? this.buildProgressRecord(userId, programSlug);
    const nextProgress = updater({
      ...currentProgress,
      userId,
      programSlug,
    });

    nextProgress.updatedAt = new Date().toISOString();
    await this.saveProgressRecord(nextProgress);

    const currentSnapshot = await this.getAccessSnapshot();
    const safeSnapshot = isSnapshotOwnedByUser(currentSnapshot, userId)
      ? currentSnapshot
      : createDefaultSnapshot('local', userId);
    const nextSnapshot: ProgramAccessSnapshot = {
      ...safeSnapshot,
      ownerUserId: userId,
      ownedProgram: programSlug,
      source: safeSnapshot.source,
      startedAt: safeSnapshot.startedAt ?? new Date().toISOString(),
      scheduledStartDate: safeSnapshot.scheduledStartDate ?? null,
      pausedAt: safeSnapshot.pausedAt ?? null,
      ...getStateForProgress(programSlug, nextProgress, safeSnapshot.startedAt ?? new Date().toISOString()),
    };

    if (nextSnapshot.currentDay) {
      nextProgress.currentDay = nextSnapshot.currentDay;
    }

    nextSnapshot.eligibleProducts = deriveEligibleProducts(nextSnapshot);
    await this.saveAccessSnapshot(nextSnapshot);

    return {
      snapshot: nextSnapshot,
      progress: nextProgress,
    };
  }

  static async refreshFromDeviceStore(userId: string) {
    const existingRefresh = REFRESH_IN_FLIGHT.get(userId);
    if (existingRefresh) {
      return existingRefresh;
    }

    const refreshPromise = (async () => {
      try {
        const isRevenueCatReady = await this.isRevenueCatReadyForUser(userId);

        if (__DEV__) console.log('[AccessService] refreshFromDeviceStore', {
          userId,
          isRevenueCatReady,
        });

        if (!isRevenueCatReady) {
          const serverState = await this.hydrateFromSupabase(userId);
          return serverState.snapshot;
        }

        const customerInfo = await Purchases.getCustomerInfo();
        return await this.syncFromRevenueCat(customerInfo, userId);
      } catch (error) {
        console.error('Failed to refresh access from RevenueCat', error);
        const serverState = await this.hydrateFromSupabase(userId);
        if (serverState.snapshot.ownedProgram) {
          return serverState.snapshot;
        }

        const localSnapshot = await this.getAccessSnapshot();
        const localProgress = await this.getProgressRecord(userId, localSnapshot.ownedProgram);

        if (!localProgress || localProgress.userId !== userId) {
          await this.clear();
          return createDefaultSnapshot('local', userId);
        }

        return isSnapshotOwnedByUser(localSnapshot, userId) &&
          localSnapshot.ownedProgram === localProgress.programSlug
          ? localSnapshot
          : createDefaultSnapshot('local', userId);
      }
    })();

    REFRESH_IN_FLIGHT.set(userId, refreshPromise);

    try {
      return await refreshPromise;
    } finally {
      if (REFRESH_IN_FLIGHT.get(userId) === refreshPromise) {
        REFRESH_IN_FLIGHT.delete(userId);
      }
    }
  }
}
