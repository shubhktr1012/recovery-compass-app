import { supabase } from '@/lib/supabase';
import type { Database, Json } from '@/types/database.types';
import type { ProgramSlug } from '@/types/content';

export type AnalyticsEventType =
  | 'card_opened'
  | 'card_completed'
  | 'card_skipped'
  | 'audio_played'
  | 'day_completed'
  | 'day_saved_partial'
  | 'session_opened'
  | 'program_started'
  | 'program_completed'
  | 'program_paused'
  | 'program_resumed'
  | 'notification_tap';

export type AnalyticsEventData = Record<string, Json | undefined>;

type UserEventInsert = Database['public']['Tables']['user_events']['Insert'];

type AnalyticsClient = {
  from: (table: 'user_events') => {
    insert: (row: UserEventInsert) => PromiseLike<{ error: unknown }>;
  };
};

export interface LogEventArgs {
  cardId?: string | null;
  client?: AnalyticsClient;
  dayNumber?: number | null;
  eventData?: AnalyticsEventData;
  eventType: AnalyticsEventType;
  occurredAt?: Date | string;
  programSlug?: ProgramSlug | null;
  userId?: string | null;
}

export type LogEventResult =
  | { ok: true }
  | { ok: false; error?: unknown; skipped?: 'missing_user' };

export async function logEvent(args: LogEventArgs): Promise<LogEventResult> {
  if (!args.userId) {
    return { ok: false, skipped: 'missing_user' };
  }

  const occurredAt =
    args.occurredAt instanceof Date
      ? args.occurredAt.toISOString()
      : args.occurredAt ?? new Date().toISOString();
  const client = args.client ?? (supabase as unknown as AnalyticsClient);

  try {
    const { error } = await client
      .from('user_events')
      .insert({
        card_id: args.cardId ?? null,
        day_number: args.dayNumber ?? null,
        event_data: normalizeAnalyticsEventData(args.eventData),
        event_type: args.eventType,
        occurred_at: occurredAt,
        program_slug: args.programSlug ?? null,
        user_id: args.userId,
      });

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    console.warn('Failed to log analytics event', {
      error,
      eventType: args.eventType,
      userId: args.userId,
    });
    return { ok: false, error };
  }
}

export function normalizeAnalyticsEventData(eventData?: AnalyticsEventData): Record<string, Json> {
  const normalized: Record<string, Json> = {};

  for (const [key, value] of Object.entries(eventData ?? {})) {
    const normalizedValue = normalizeJsonValue(value);

    if (normalizedValue !== undefined) {
      normalized[key] = normalizedValue;
    }
  }

  return normalized;
}

function normalizeJsonValue(value: Json | undefined): Json | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeJsonValue(entry))
      .filter((entry): entry is Json => entry !== undefined);
  }

  if (value && typeof value === 'object') {
    const normalizedObject: Record<string, Json> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      const normalizedValue = normalizeJsonValue(nestedValue);

      if (normalizedValue !== undefined) {
        normalizedObject[key] = normalizedValue;
      }
    }

    return normalizedObject;
  }

  return value;
}
