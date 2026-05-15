import type { ContentCard, DayContent, ProgramSlug } from '@/types/content';

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'anytime';

export type ContentMode = 'template' | 'unique';

export const TIME_SLOT_WINDOWS = {
  morning: { opens: '06:30', closes: '14:00' },
  afternoon: { opens: '12:00', closes: '18:00' },
  evening: { opens: '19:00', closes: '01:00' },
  anytime: { opens: '06:30', closes: '01:00' },
} as const satisfies Record<TimeSlot, { opens: string; closes: string }>;

export interface TimeSlotMeta {
  timeSlot: TimeSlot;
  isTimeSensitive: boolean;
  hasEffortCheck: boolean;
}

export type ResolvedContentCard = ContentCard & TimeSlotMeta;

export interface ResolvedDayContent extends Omit<DayContent, 'cards'> {
  cards: ResolvedContentCard[];
  contentMode: ContentMode;
  dayGoal?: string;
  phase?: string;
}

export type TemplateVariableValue = string | number | boolean | null;

export type TemplateVariables = Record<string, TemplateVariableValue>;

export type TemplateCardPayload = Partial<Omit<ContentCard, 'type'>> & Record<string, unknown>;

export interface TemplateSlot {
  slot_id: string;
  card_type: ContentCard['type'];
  timeSlot: TimeSlot;
  isTimeSensitive: boolean;
  hasEffortCheck: boolean;
  card_template: TemplateCardPayload;
}

export interface ProgramTemplate {
  id?: string;
  program_slug: ProgramSlug;
  template_slots: TemplateSlot[];
  created_at?: string;
  updated_at?: string;
}

export interface ProgressionOverrides {
  add_slots?: TemplateSlot[];
  remove_slots?: string[];
  replace_slots?: Array<{ slot_id: string } & Partial<Omit<TemplateSlot, 'slot_id'>>>;
}

export interface ProgressionRow {
  id?: string;
  program_slug: ProgramSlug;
  day_number: number;
  day_title: string;
  phase?: string | null;
  day_goal: string;
  variables: TemplateVariables;
  overrides?: ProgressionOverrides | null;
  created_at?: string;
  updated_at?: string;
}

export type DayState = 'completed' | 'partial' | 'skipped';

export type CardState = 'locked' | 'available' | 'catch_up' | 'blocked' | 'completed' | 'skipped';
