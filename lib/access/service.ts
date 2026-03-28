import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo } from 'react-native-purchases';

import { getOwnedProgramFromCustomerInfo, getRevenueCatProgram } from '@/lib/revenuecat/config';
import { supabase } from '@/lib/supabase';
import { ProgramRepository } from '@/lib/programs/repository';
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
  ownedProgram: null,
  purchaseState: 'not_owned',
  completionState: 'not_started',
  currentDay: null,
  completedAt: null,
  archivedAt: null,
  eligibleProducts: ['six_day_reset', 'ninety_day_transform'],
  source: 'local',
};

function createDefaultSnapshot(
  source: ProgramAccessSnapshot['source'] = 'local'
): ProgramAccessSnapshot {
  return {
    ...DEFAULT_ACCESS_SNAPSHOT,
    source,
  };
}

function getStateForProgress(
  programSlug: ProgramSlug | null,
  progress: ProgramProgressRecord | null
): Pick<ProgramAccessSnapshot, 'currentDay' | 'purchaseState' | 'completionState' | 'completedAt' | 'archivedAt'> {
  if (!programSlug || !progress) {
    return {
      currentDay: programSlug ? 1 : null,
      purchaseState: programSlug ? 'owned_active' : 'not_owned',
      completionState: programSlug ? 'in_progress' : 'not_started',
      completedAt: null,
      archivedAt: null,
    };
  }

  const totalDays = ProgramRepository.getProgramLength(programSlug);
  const isProgramComplete = progress.completedDays.includes(totalDays) || Boolean(progress.completedAt);
  const isArchived = Boolean(progress.archivedAt);

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
    currentDay: Math.max(1, Math.min(progress.currentDay, totalDays)),
    purchaseState,
    completionState,
    completedAt: progress.completedAt,
    archivedAt: progress.archivedAt,
  };
}

function deriveEligibleProducts(snapshot: ProgramAccessSnapshot): ProgramSlug[] {
  if (snapshot.ownedProgram === 'ninety_day_transform') {
    return ['ninety_day_transform'];
  }

  if (
    snapshot.ownedProgram === 'six_day_reset' &&
    (snapshot.purchaseState === 'owned_completed' || snapshot.purchaseState === 'owned_archived')
  ) {
    return ['ninety_day_transform'];
  }

  if (snapshot.ownedProgram === 'six_day_reset') {
    return ['six_day_reset'];
  }

  return ['six_day_reset', 'ninety_day_transform'];
}

function normalizeProgramSlug(value: string | null | undefined): ProgramSlug | null {
  if (value === 'six_day_reset' || value === 'ninety_day_transform') {
    return value;
  }

  return null;
}

export class AccessService {
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
      return JSON.parse(rawValue) as ProgramProgressRecord;
    } catch (error) {
      console.error('Failed to read program progress record', error);
      return null;
    }
  }

  static async saveProgressRecord(progress: ProgramProgressRecord) {
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
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
      completedAt: null,
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    };
  }

  static async getServerAccessSnapshot(userId: string) {
    try {
      const { data, error } = await supabase
        .from('program_access')
        .select('owned_program, purchase_state, completion_state, current_day, completed_at, archived_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const snapshot: ProgramAccessSnapshot = {
        ownedProgram: normalizeProgramSlug(data.owned_program),
        purchaseState: (data.purchase_state as PurchaseState) ?? 'not_owned',
        completionState: (data.completion_state as CompletionState) ?? 'not_started',
        currentDay: data.current_day,
        completedAt: data.completed_at,
        archivedAt: data.archived_at,
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
        .select('day_id, completed_at')
        .eq('user_id', userId)
        .eq('program_id', programSlug)
        .eq('status', 'COMPLETED')
        .order('day_id', { ascending: true });

      if (error) throw error;

      const completedDays = (data ?? []).map((row) => row.day_id);
      const totalDays = ProgramRepository.getProgramLength(programSlug);
      const highestCompletedDay = completedDays.at(-1) ?? 0;
      const isComplete = Boolean(snapshot?.completedAt) || highestCompletedDay >= totalDays;
      const fallbackCurrentDay = isComplete
        ? totalDays
        : Math.min(totalDays, Math.max(1, highestCompletedDay + 1));

      if (!completedDays.length && !snapshot?.currentDay && !snapshot?.completedAt && !snapshot?.archivedAt) {
        return null;
      }

      return {
        userId,
        programSlug,
        currentDay: snapshot?.currentDay ?? fallbackCurrentDay,
        completedDays,
        completedAt: snapshot?.completedAt ?? (isComplete ? data?.at(-1)?.completed_at ?? new Date().toISOString() : null),
        archivedAt: snapshot?.archivedAt ?? null,
        updatedAt: new Date().toISOString(),
      } satisfies ProgramProgressRecord;
    } catch (error) {
      console.error('Failed to fetch program progress from Supabase', error);
      return null;
    }
  }

  static async syncAccessSnapshotToSupabase(userId: string, snapshot: ProgramAccessSnapshot) {
    try {
      const revenueCatProductId = snapshot.ownedProgram
        ? getRevenueCatProgram(snapshot.ownedProgram).productIds[0] ?? null
        : null;
      const { error } = await supabase.from('program_access').upsert(
        {
          user_id: userId,
          owned_program: snapshot.ownedProgram,
          purchase_state: snapshot.purchaseState,
          completion_state: snapshot.completionState,
          current_day: snapshot.currentDay,
          completed_at: snapshot.completedAt,
          archived_at: snapshot.archivedAt,
          revenuecat_product_id: revenueCatProductId,
        },
        { onConflict: 'user_id,owned_program' }
      );

      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync program access to Supabase', error);
    }
  }

  static async syncProgressRecordToSupabase(progress: ProgramProgressRecord) {
    if (!progress.completedDays.length) {
      return;
    }

    try {
      const rows = progress.completedDays.map((dayNumber) => ({
        user_id: progress.userId,
        program_id: progress.programSlug,
        day_id: dayNumber,
        status: 'COMPLETED',
        content_completed: true,
        completed_at: progress.completedAt ?? new Date().toISOString(),
        current_day: progress.currentDay,
        completed_days: progress.completedDays,
      }));

      const { error } = await supabase.from('program_progress').upsert(rows, {
        onConflict: 'user_id,program_id,day_id',
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync program progress to Supabase', error);
    }
  }

  static async syncStateToSupabase(
    userId: string,
    snapshot: ProgramAccessSnapshot,
    progress: ProgramProgressRecord | null
  ) {
    await this.syncAccessSnapshotToSupabase(userId, snapshot);

    if (progress) {
      await this.syncProgressRecordToSupabase(progress);
    }
  }

  static async hydrateFromSupabase(userId: string) {
    const snapshot = (await this.getServerAccessSnapshot(userId)) ?? createDefaultSnapshot();
    const progress = snapshot.ownedProgram
      ? await this.getServerProgressRecord(userId, snapshot.ownedProgram, snapshot)
      : null;

    const nextSnapshot: ProgramAccessSnapshot = snapshot.ownedProgram
      ? {
          ...snapshot,
          ...getStateForProgress(snapshot.ownedProgram, progress),
          source: 'supabase',
        }
      : createDefaultSnapshot('supabase');

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
    const ownedProgram: ProgramSlug | null = getOwnedProgramFromCustomerInfo(customerInfo);

    const serverSnapshot = ownedProgram ? await this.getServerAccessSnapshot(userId) : null;
    const serverProgress =
      ownedProgram
        ? await this.getServerProgressRecord(
            userId,
            ownedProgram,
            serverSnapshot?.ownedProgram === ownedProgram ? serverSnapshot : null
          )
        : null;
    const existingProgress = await this.getProgressRecord();
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
      ...createDefaultSnapshot('revenuecat'),
      ownedProgram,
      ...getStateForProgress(ownedProgram, nextProgress),
    };

    snapshot.eligibleProducts = deriveEligibleProducts(snapshot);
    await this.saveAccessSnapshot(snapshot);

    if (ownedProgram) {
      await this.syncStateToSupabase(userId, snapshot, nextProgress);
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
      programSlug,
    });

    nextProgress.updatedAt = new Date().toISOString();
    await this.saveProgressRecord(nextProgress);

    const currentSnapshot = await this.getAccessSnapshot();
    const nextSnapshot: ProgramAccessSnapshot = {
      ...currentSnapshot,
      ownedProgram: programSlug,
      source: currentSnapshot.source,
      ...getStateForProgress(programSlug, nextProgress),
    };

    nextSnapshot.eligibleProducts = deriveEligibleProducts(nextSnapshot);
    await this.saveAccessSnapshot(nextSnapshot);

    return {
      snapshot: nextSnapshot,
      progress: nextProgress,
    };
  }

  static async refreshFromDeviceStore(userId: string) {
    try {
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
        return createDefaultSnapshot();
      }

      return localSnapshot.ownedProgram === localProgress.programSlug
        ? localSnapshot
        : createDefaultSnapshot();
    }
  }
}
