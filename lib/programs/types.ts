import type { ProgramSlug as ContentProgramSlug } from '@/types/content';

export type ProgramSlug = ContentProgramSlug;

export type PurchaseState =
  | 'not_owned'
  | 'owned_active'
  | 'owned_completed'
  | 'owned_archived';

export type CompletionState =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'archived';

export interface ProgramDaySection {
  title: string;
  body: string;
}

export interface ProgramDayAudio {
  storagePath: string;
  durationSeconds?: number | null;
  transcript?: string | null;
}

export interface ProgramDayContent {
  programSlug: ProgramSlug;
  dayNumber: number;
  title: string;
  subtitle?: string | null;
  summary: string;
  prompt?: string | null;
  close?: string | null;
  estimatedMinutes: number;
  focus?: string | null;
  sections: ProgramDaySection[];
  audio?: ProgramDayAudio | null;
}

export interface ProgramContent {
  slug: ProgramSlug;
  title: string;
  description: string;
  accentLabel: string;
  totalDays: number;
  hasAudio: boolean;
  days: ProgramDayContent[];
}

export type EligibleProduct = ProgramSlug;

export interface ProgramAccessSnapshot {
  ownerUserId?: string | null;
  ownedProgram: ProgramSlug | null;
  purchaseState: PurchaseState;
  completionState: CompletionState;
  currentDay: number | null;
  startedAt: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  eligibleProducts: EligibleProduct[];
  source: 'local' | 'supabase' | 'revenuecat';
}

export interface ProgramProgressRecord {
  userId: string;
  programSlug: ProgramSlug;
  currentDay: number;
  completedDays: number[];
  partialDays: number[];
  completedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
}
