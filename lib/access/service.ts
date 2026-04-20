import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo } from 'react-native-purchases';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { getProgramScheduledDay } from '@/lib/programs/schedule';
import { getOwnedProgramsFromCustomerInfo } from '@/lib/revenuecat/config';
import { supabase } from '@/lib/supabase';
import {
  CompletionState,
  ProgramAccessSnapshot,
  ProgramProgressRecord,
  ProgramSlug,
  PurchaseState,
} from '@/lib/programs/types';

const ACCESS_STORAGE_KEY = 'program-access-snapshot';
const PROGRESS_STORAGE_KEY = 'program-progress-record';

const DEFAULT_ACCESS_SNAPSHOT: ProgramAccessSnapshot = {
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
  startedAt: string | null | undefined
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
    : scheduledDay;

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
    currentDay: effectiveScheduledDay,
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
    return ['ninety_day_transform'];
  }

  if (snapshot.ownedProgram) {
    return [];
  }

  return ['six_day_reset', 'ninety_day_transform'];
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

type ProgramAccessRow = {
  archived_at: string | null;
  completed_at: string | null;
  completion_state: string | null;
  created_at?: string | null;
  current_day: number | null;
  owned_program: string | null;
  purchase_state: string | null;
  started_at?: string | null;
  updated_at?: string | null;
};

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

function selectPreferredProgramSlug(
  candidates: ProgramSlug[],
  preferences: (ProgramSlug | null | undefined)[]
): ProgramSlug | null {
  for (const preference of preferences) {
    if (preference && candidates.includes(preference)) {
      return preference;
    }
  }

  return candidates[0] ?? null;
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

    if (preferredProgram) {
      const leftPreferred = leftProgram === preferredProgram ? 1 : 0;
      const rightPreferred = rightProgram === preferredProgram ? 1 : 0;

      if (leftPreferred !== rightPreferred) {
        return rightPreferred - leftPreferred;
      }
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

  static async getProgressRecord() {
    try {
      const rawValue = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!rawValue) return null;
      return normalizeProgressRecord(JSON.parse(rawValue) as ProgramProgressRecord);
    } catch (error) {
      console.error('Failed to read program progress record', error);
      return null;
    }
  }

  static async saveProgressRecord(progress: ProgramProgressRecord) {
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalizeProgressRecord(progress)));
  }

  static async clear() {
    await AsyncStorage.multiRemove([ACCESS_STORAGE_KEY, PROGRESS_STORAGE_KEY]);
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
      const { data, error } = await supabase
        .from('program_access')
        .select('owned_program, purchase_state, completion_state, current_day, completed_at, archived_at, started_at, created_at, updated_at')
        .eq('user_id', userId);

      if (error) throw error;
      const selectedRow = selectPreferredAccessRow((data ?? []) as ProgramAccessRow[], preferredProgram ?? null);
      if (!selectedRow) return null;
      if (!normalizeProgramSlug(selectedRow.owned_program)) return null;
      if ((selectedRow.purchase_state as PurchaseState | null) === 'not_owned') return null;

      const snapshot: ProgramAccessSnapshot = {
        ownerUserId: userId,
        ownedProgram: normalizeProgramSlug(selectedRow.owned_program),
        purchaseState: (selectedRow.purchase_state as PurchaseState) ?? 'not_owned',
        completionState: (selectedRow.completion_state as CompletionState) ?? 'not_started',
        currentDay: selectedRow.current_day,
        startedAt: selectedRow.started_at ?? selectedRow.created_at ?? null,
        completedAt: selectedRow.completed_at,
        archivedAt: selectedRow.archived_at,
        eligibleProducts: ['six_day_reset', 'ninety_day_transform'],
        source: 'supabase',
      };

      snapshot.eligibleProducts = deriveEligibleProducts(snapshot);
      return snapshot;
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
      const isComplete = Boolean(snapshot?.completedAt) || highestCompletedDay >= totalDays;
      const fallbackCurrentDay = isComplete
        ? totalDays
        : getProgramScheduledDay(snapshot?.startedAt, totalDays);

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
    try {
      const nextPartialDays = progress.partialDays.filter(
        (dayNumber) => !progress.completedDays.includes(dayNumber)
      );
      const { error } = await supabase.rpc('sync_program_progress', {
        p_program_id: progress.programSlug,
        p_current_day: progress.currentDay,
        p_completed_days: progress.completedDays,
        p_partial_days: nextPartialDays,
        p_completed_at: progress.completedAt ?? undefined,
        p_archived_at: progress.archivedAt ?? undefined,
      });

      if (error) throw error;
    } catch (error) {
      console.warn('Failed to sync extended program progress to Supabase, falling back to completed-only sync', error);

      try {
        const { error: fallbackError } = await supabase.rpc('sync_program_progress', {
          p_program_id: progress.programSlug,
          p_current_day: progress.currentDay,
          p_completed_days: progress.completedDays,
          p_completed_at: progress.completedAt ?? undefined,
          p_archived_at: progress.archivedAt ?? undefined,
        });

        if (fallbackError) throw fallbackError;
      } catch (fallbackError) {
        console.error('Failed to sync program progress to Supabase', fallbackError);
      }
    }
  }

  static async syncStateToSupabase(progress: ProgramProgressRecord | null) {
    if (progress) {
      await this.syncProgressRecordToSupabase(progress);
    }
  }

  static async hydrateFromSupabase(userId: string) {
    const snapshot = (await this.getServerAccessSnapshot(userId)) ?? createDefaultSnapshot('supabase', userId);
    const progress = snapshot.ownedProgram
      ? await this.getServerProgressRecord(userId, snapshot.ownedProgram, snapshot)
      : null;

    const nextSnapshot: ProgramAccessSnapshot = snapshot.ownedProgram
      ? {
          ...snapshot,
          ...getStateForProgress(snapshot.ownedProgram, progress, snapshot.startedAt),
          source: 'supabase',
        }
      : createDefaultSnapshot('supabase', userId);

    if (progress && nextSnapshot.currentDay) {
      progress.currentDay = nextSnapshot.currentDay;
    }

    nextSnapshot.eligibleProducts = deriveEligibleProducts(nextSnapshot);

    await this.saveAccessSnapshot(nextSnapshot);

    if (progress) {
      await this.saveProgressRecord(progress);
    } else {
      await AsyncStorage.removeItem(PROGRESS_STORAGE_KEY);
    }

    return {
      snapshot: nextSnapshot,
      progress,
    };
  }

  static async syncFromRevenueCat(customerInfo: CustomerInfo, userId: string) {
    const [cachedSnapshot, cachedProgress] = await Promise.all([this.getAccessSnapshot(), this.getProgressRecord()]);
    const existingProgress = isProgressOwnedByUser(cachedProgress, userId) ? cachedProgress : null;
    const localSnapshot = isSnapshotOwnedByUser(cachedSnapshot, userId)
      ? cachedSnapshot
      : createDefaultSnapshot('local', userId);
    const ownedPrograms = getOwnedProgramsFromCustomerInfo(customerInfo);

    console.log('[AccessService] syncFromRevenueCat:start', {
      userId,
      revenueCatAppUserId: customerInfo.originalAppUserId,
      ownedPrograms,
      cachedSnapshotOwnerUserId: cachedSnapshot?.ownerUserId ?? null,
      cachedSnapshotOwnedProgram: cachedSnapshot?.ownedProgram ?? null,
      cachedProgressUserId: cachedProgress?.userId ?? null,
      cachedProgressProgramSlug: cachedProgress?.programSlug ?? null,
      safeLocalOwnedProgram: localSnapshot.ownedProgram,
      safeExistingProgressProgramSlug: existingProgress?.programSlug ?? null,
    });

    let ownedProgram = selectPreferredProgramSlug(ownedPrograms, [
      localSnapshot.ownedProgram,
      existingProgress?.programSlug,
    ]);
    const serverSnapshot = await this.getServerAccessSnapshot(userId, ownedProgram);

    const candidateOwnedPrograms = Array.from(
      new Set<ProgramSlug>([
        ...ownedPrograms,
        ...(serverSnapshot?.ownedProgram ? [serverSnapshot.ownedProgram] : []),
      ])
    );

    ownedProgram = selectPreferredProgramSlug(candidateOwnedPrograms, [
      localSnapshot.ownedProgram,
      existingProgress?.programSlug,
      serverSnapshot?.ownedProgram,
    ]);
    const serverProgress =
      ownedProgram
        ? await this.getServerProgressRecord(
            userId,
            ownedProgram,
            serverSnapshot?.ownedProgram === ownedProgram ? serverSnapshot : null
          )
        : null;
    const nextProgress =
      ownedProgram && serverProgress
        ? serverProgress
        : ownedProgram && existingProgress?.programSlug === ownedProgram
          ? existingProgress
          : ownedProgram
            ? this.buildProgressRecord(userId, ownedProgram)
            : null;

    if (nextProgress) {
      await this.saveProgressRecord(nextProgress);
    } else {
      await AsyncStorage.removeItem(PROGRESS_STORAGE_KEY);
    }

    const snapshot: ProgramAccessSnapshot = {
      ...createDefaultSnapshot('revenuecat', userId),
      ownedProgram,
      startedAt: ownedProgram
        ? serverSnapshot?.startedAt ?? localSnapshot.startedAt ?? new Date().toISOString()
        : null,
      ...getStateForProgress(
        ownedProgram,
        nextProgress,
        ownedProgram ? serverSnapshot?.startedAt ?? localSnapshot.startedAt ?? new Date().toISOString() : null
      ),
    };

    if (nextProgress && snapshot.currentDay) {
      nextProgress.currentDay = snapshot.currentDay;
    }

    snapshot.eligibleProducts = deriveEligibleProducts(snapshot);
    await this.saveAccessSnapshot(snapshot);

    console.log('[AccessService] syncFromRevenueCat:resolved', {
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
    });

    if (ownedProgram) {
      await this.syncStateToSupabase(nextProgress);
    }

    return snapshot;
  }

  static async updateProgress(
    userId: string,
    programSlug: ProgramSlug,
    updater: (current: ProgramProgressRecord) => ProgramProgressRecord
  ) {
    const currentProgress =
      (await this.getProgressRecord()) ?? this.buildProgressRecord(userId, programSlug);
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
    try {
      const isRevenueCatReady = await this.isRevenueCatReadyForUser(userId);

      console.log('[AccessService] refreshFromDeviceStore', {
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

      const [localSnapshot, localProgress] = await Promise.all([
        this.getAccessSnapshot(),
        this.getProgressRecord(),
      ]);

      if (!localProgress || localProgress.userId !== userId) {
        await this.clear();
        return createDefaultSnapshot('local', userId);
      }

      return isSnapshotOwnedByUser(localSnapshot, userId) &&
        localSnapshot.ownedProgram === localProgress.programSlug
        ? localSnapshot
        : createDefaultSnapshot('local', userId);
    }
  }
}
