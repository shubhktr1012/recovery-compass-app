import type { ContentCard, DayContent, ProgramSlug } from '@/types/content';
import {
  TIME_SLOT_WINDOWS,
  type ContentMode,
  type ProgressionRow,
  type ProgramTemplate,
  type ResolvedContentCard,
  type ResolvedDayContent,
  type TemplateSlot,
  type TemplateVariables,
  type TimeSlot,
  type TimeSlotMeta,
} from '@/types/resolver';

const DEFAULT_TIME_SLOT_META: TimeSlotMeta = {
  timeSlot: 'anytime',
  isTimeSensitive: false,
  hasEffortCheck: false,
};

export interface ResolveDayOptions {
  programSlug: ProgramSlug;
  dayNumber: number;
  contentMode: ContentMode;
  dayContent?: DayContent;
  template?: ProgramTemplate;
  progression?: ProgressionRow;
}

export class ResolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResolverError';
  }
}

export function resolveDay(options: ResolveDayOptions): ResolvedDayContent {
  if (options.contentMode === 'unique') {
    return resolveUniqueDay(options);
  }

  return resolveTemplateDay(options);
}

function resolveUniqueDay({ dayContent, dayNumber, programSlug }: ResolveDayOptions): ResolvedDayContent {
  if (!dayContent) {
    throw new ResolverError(`Unique mode requires dayContent for ${programSlug} day ${dayNumber}.`);
  }

  return {
    ...dayContent,
    cards: dayContent.cards.map(resolveExistingCard),
    contentMode: 'unique',
  };
}

function resolveTemplateDay({
  dayNumber,
  programSlug,
  progression,
  template,
}: ResolveDayOptions): ResolvedDayContent {
  if (!template) {
    throw new ResolverError(`Template mode requires program template for ${programSlug} day ${dayNumber}.`);
  }

  if (!progression) {
    throw new ResolverError(`Template mode requires progression row for ${programSlug} day ${dayNumber}.`);
  }

  if (template.program_slug !== programSlug) {
    throw new ResolverError(
      `Template slug ${template.program_slug} does not match requested program ${programSlug}.`
    );
  }

  if (progression.program_slug !== programSlug) {
    throw new ResolverError(
      `Progression slug ${progression.program_slug} does not match requested program ${programSlug}.`
    );
  }

  if (progression.day_number !== dayNumber) {
    throw new ResolverError(
      `Progression day ${progression.day_number} does not match requested day ${dayNumber}.`
    );
  }

  const slots = applyOverrides(template.template_slots, progression.overrides ?? undefined);
  const cards = slots.map((slot) => resolveTemplateSlot(slot, progression.variables));

  return {
    programSlug,
    dayNumber,
    dayTitle: progression.day_title,
    estimatedMinutes: getDayEstimatedMinutes(progression, cards),
    cards,
    contentMode: 'template',
    dayGoal: progression.day_goal,
    phase: progression.phase ?? undefined,
  };
}

function resolveExistingCard(card: ContentCard): ResolvedContentCard {
  const cardWithMeta = card as ContentCard & Partial<TimeSlotMeta>;

  return {
    ...card,
    timeSlot: cardWithMeta.timeSlot ?? DEFAULT_TIME_SLOT_META.timeSlot,
    isTimeSensitive: cardWithMeta.isTimeSensitive ?? DEFAULT_TIME_SLOT_META.isTimeSensitive,
    hasEffortCheck: cardWithMeta.hasEffortCheck ?? DEFAULT_TIME_SLOT_META.hasEffortCheck,
  };
}

function applyOverrides(
  slots: TemplateSlot[],
  overrides: ProgressionRow['overrides'] | undefined
): TemplateSlot[] {
  if (!overrides) {
    return [...slots];
  }

  const removedSlotIds = new Set(overrides.remove_slots ?? []);
  const replacementBySlotId = new Map(
    (overrides.replace_slots ?? []).map((replacement) => [replacement.slot_id, replacement])
  );

  const replacedSlots = slots
    .filter((slot) => !removedSlotIds.has(slot.slot_id))
    .map((slot) => {
      const replacement = replacementBySlotId.get(slot.slot_id);
      return replacement ? { ...slot, ...replacement, slot_id: slot.slot_id } : slot;
    });

  return [...replacedSlots, ...(overrides.add_slots ?? [])];
}

function resolveTemplateSlot(slot: TemplateSlot, variables: TemplateVariables): ResolvedContentCard {
  const payload = interpolateValue(slot.card_template, variables) as Record<string, unknown>;
  const card = {
    type: slot.card_type,
    ...payload,
  } as ContentCard;

  return {
    ...card,
    timeSlot: slot.timeSlot,
    isTimeSensitive: slot.isTimeSensitive,
    hasEffortCheck: slot.hasEffortCheck,
  };
}

function interpolateValue(value: unknown, variables: TemplateVariables): unknown {
  if (typeof value === 'string') {
    const directVariable = matchWholeVariable(value, variables);
    if (directVariable.matched) {
      return directVariable.value;
    }

    return interpolateString(value, variables);
  }

  if (Array.isArray(value)) {
    return value.map((item) => interpolateValue(item, variables));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, interpolateValue(nestedValue, variables)])
    );
  }

  return value;
}

function matchWholeVariable(
  template: string,
  variables: TemplateVariables
): { matched: boolean; value: TemplateVariables[string] | string } {
  const match = template.match(/^\{([a-zA-Z0-9_]+)\}$/);
  if (!match) {
    return { matched: false, value: template };
  }

  const [, key] = match;
  const value = variables[key];
  if (value === undefined) {
    return { matched: false, value: template };
  }

  return { matched: true, value };
}

function interpolateString(template: string, variables: TemplateVariables): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => {
    const value = variables[key];
    return value === undefined || value === null ? match : String(value);
  });
}

function estimateMinutes(cards: ResolvedContentCard[]): number {
  const estimatedTotal = cards.reduce((total, card) => total + estimateCardMinutes(card), 0);
  return Math.max(estimatedTotal, cards.length);
}

function getDayEstimatedMinutes(progression: ProgressionRow, cards: ResolvedContentCard[]): number {
  const explicitEstimate = progression.variables.estimated_minutes;
  if (typeof explicitEstimate === 'number' && Number.isFinite(explicitEstimate)) {
    return explicitEstimate;
  }

  const introCard = cards.find((card) => card.type === 'intro');
  if (introCard?.type === 'intro' && typeof introCard.estimatedMinutes === 'number') {
    return introCard.estimatedMinutes;
  }

  return estimateMinutes(cards);
}

function estimateCardMinutes(card: ResolvedContentCard): number {
  if (card.type === 'intro' && typeof card.estimatedMinutes === 'number') {
    return card.estimatedMinutes;
  }

  if (card.type === 'audio' && typeof card.durationSeconds === 'number') {
    return Math.max(1, Math.ceil(card.durationSeconds / 60));
  }

  if ('duration' in card && typeof card.duration === 'string') {
    const match = card.duration.match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : 3;
  }

  if (card.type === 'mindfulness_exercise' && typeof card.timerSeconds === 'number') {
    return Math.max(1, Math.ceil(card.timerSeconds / 60));
  }

  return 3;
}

export function isWindowOpen(slot: TimeSlot, currentHHMM: string): boolean {
  const { opens, closes } = TIME_SLOT_WINDOWS[slot];

  if (opens <= closes) {
    return currentHHMM >= opens && currentHHMM < closes;
  }

  return currentHHMM >= opens || currentHHMM < closes;
}

export function toLocalHHMM(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  });
}

export function getAudioThresholds(durationSeconds: number): {
  markAsDone: number;
  autoComplete: number;
} {
  return {
    markAsDone: durationSeconds * 0.3,
    autoComplete: durationSeconds * 0.75,
  };
}
