import { hasAnyProgramEntitlement } from '@/lib/access/entitlements';
import type { ProgramAccessSnapshot, ProgramSlug } from '@/lib/programs/types';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export const FREE_DETOX_PROGRAM_SLUG = 'free_detox_reset' as const satisfies ProgramSlug;
export const FREE_DETOX_TOTAL_DAYS = 6;

export interface FreeProgramProgressRecord {
  userId: string;
  programSlug: typeof FREE_DETOX_PROGRAM_SLUG;
  currentDay: number;
  completedDays: number[];
  partialDays: number[];
  completedAt: string | null;
  updatedAt: string;
}

type FreeProgramProgressSelect = Pick<
  Database['public']['Tables']['free_program_progress']['Row'],
  'user_id' | 'program_slug' | 'current_day' | 'completed_days' | 'partial_days' | 'completed_at' | 'updated_at'
>;

type FreeDetoxAccessInput = {
  access: Pick<ProgramAccessSnapshot, 'ownedProgram' | 'purchaseState'> & {
    source?: ProgramAccessSnapshot['source'] | null;
  };
  freeTierActivatedAt?: string | null;
  userId?: string | null;
};

function normalizeDayArray(days: readonly number[] | null | undefined) {
  return Array.from(
    new Set(
      (days ?? [])
        .filter((day) => Number.isInteger(day) && day >= 1 && day <= FREE_DETOX_TOTAL_DAYS)
        .map((day) => Math.trunc(day))
    )
  ).sort((left, right) => left - right);
}

function clampCurrentDay(day: number | null | undefined) {
  if (!Number.isInteger(day)) {
    return 1;
  }

  return Math.max(1, Math.min(FREE_DETOX_TOTAL_DAYS, day as number));
}

function mapRow(row: FreeProgramProgressSelect): FreeProgramProgressRecord {
  return {
    userId: row.user_id,
    programSlug: FREE_DETOX_PROGRAM_SLUG,
    currentDay: clampCurrentDay(row.current_day),
    completedDays: normalizeDayArray(row.completed_days),
    partialDays: normalizeDayArray(row.partial_days),
    completedAt: row.completed_at,
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export function canAccessFreeDetoxProgram(input: FreeDetoxAccessInput) {
  if (!input.userId) {
    return false;
  }

  return Boolean(input.freeTierActivatedAt || hasAnyProgramEntitlement(input.access));
}

export function createEmptyFreeDetoxProgress(userId: string): FreeProgramProgressRecord {
  return {
    userId,
    programSlug: FREE_DETOX_PROGRAM_SLUG,
    currentDay: 1,
    completedDays: [],
    partialDays: [],
    completedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

export function getNextFreeDetoxDay(progress: FreeProgramProgressRecord | null | undefined) {
  if (!progress) {
    return 1;
  }

  if (progress.completedAt || progress.completedDays.includes(FREE_DETOX_TOTAL_DAYS)) {
    return FREE_DETOX_TOTAL_DAYS;
  }

  const highestCompleted = Math.max(0, ...progress.completedDays);
  const nextFromCompleted = Math.min(FREE_DETOX_TOTAL_DAYS, highestCompleted + 1);
  return Math.max(clampCurrentDay(progress.currentDay), nextFromCompleted);
}

export function getFreeDetoxUnlockedThroughDay(progress: FreeProgramProgressRecord | null | undefined) {
  if (!progress) {
    return 1;
  }

  if (progress.completedAt || progress.completedDays.includes(FREE_DETOX_TOTAL_DAYS)) {
    return FREE_DETOX_TOTAL_DAYS;
  }

  return Math.max(
    1,
    Math.min(
      FREE_DETOX_TOTAL_DAYS,
      progress.currentDay,
      Math.max(0, ...progress.completedDays, ...progress.partialDays) + 1
    )
  );
}

export function buildFreeDetoxProgressAfterDayState(input: {
  dayNumber: number;
  progress: FreeProgramProgressRecord | null;
  requestedDayState: 'completed' | 'partial';
  userId: string;
}) {
  const current = input.progress ?? createEmptyFreeDetoxProgress(input.userId);
  const completedDays = new Set(current.completedDays);
  const partialDays = new Set(current.partialDays);

  if (input.requestedDayState === 'completed') {
    completedDays.add(input.dayNumber);
    partialDays.delete(input.dayNumber);
  } else if (!completedDays.has(input.dayNumber)) {
    partialDays.add(input.dayNumber);
  }

  const completedDayList = normalizeDayArray(Array.from(completedDays));
  const partialDayList = normalizeDayArray(Array.from(partialDays));
  const isComplete = completedDayList.includes(FREE_DETOX_TOTAL_DAYS);
  const nextCurrentDay = isComplete
    ? FREE_DETOX_TOTAL_DAYS
    : Math.max(current.currentDay, Math.min(FREE_DETOX_TOTAL_DAYS, input.dayNumber + 1));

  return {
    completedAt: isComplete ? current.completedAt ?? new Date().toISOString() : null,
    completedDays: completedDayList,
    currentDay: nextCurrentDay,
    partialDays: partialDayList,
    programSlug: FREE_DETOX_PROGRAM_SLUG,
    userId: input.userId,
  };
}

export async function loadFreeDetoxProgress(userId: string): Promise<FreeProgramProgressRecord | null> {
  const { data, error } = await supabase
    .from('free_program_progress')
    .select('user_id, program_slug, current_day, completed_days, partial_days, completed_at, updated_at')
    .eq('user_id', userId)
    .eq('program_slug', FREE_DETOX_PROGRAM_SLUG)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRow(data) : null;
}

export async function saveFreeDetoxProgress(input: {
  completedAt: string | null;
  completedDays: number[];
  currentDay: number;
  partialDays: number[];
  userId: string;
}): Promise<FreeProgramProgressRecord> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('free_program_progress')
    .upsert(
      {
        completed_at: input.completedAt,
        completed_days: normalizeDayArray(input.completedDays),
        current_day: clampCurrentDay(input.currentDay),
        partial_days: normalizeDayArray(input.partialDays),
        program_slug: FREE_DETOX_PROGRAM_SLUG,
        updated_at: now,
        user_id: input.userId,
      },
      { onConflict: 'user_id,program_slug' }
    )
    .select('user_id, program_slug, current_day, completed_days, partial_days, completed_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return mapRow(data);
}
