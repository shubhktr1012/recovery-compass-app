import { describe, expect, it } from 'vitest';

import {
  getProgramContentMode,
  mapProgramRowToProgramContent,
  resolveTemplateDayRow,
  resolveTemplateDays,
  type ProgramProgressionRow,
  type ProgramRow,
  type ProgramTemplateRow,
} from '@/hooks/contentQueryUtils';

const programRow: ProgramRow = {
  id: 'prog-energy',
  slug: 'energy_vitality',
  title: 'Energy Restore Program',
  description: 'A program focused on restoring energy.',
  total_days: 14,
  category: 'energy',
  has_audio: false,
  display_order: 3,
  is_active: true,
  content_mode: 'template',
  time_slots_enabled: true,
  created_at: null,
  updated_at: null,
};

const templateRow: ProgramTemplateRow = {
  id: 'tmpl-energy',
  program_slug: 'energy_vitality',
  template_slots: [
    {
      slot_id: 'intro_slot',
      card_type: 'intro',
      timeSlot: 'morning',
      isTimeSensitive: true,
      hasEffortCheck: false,
      card_template: {
        dayNumber: '{day_number}',
        dayTitle: '{day_title}',
        goal: '{goal}',
      },
    },
    {
      slot_id: 'lesson_slot',
      card_type: 'lesson',
      timeSlot: 'anytime',
      isTimeSensitive: false,
      hasEffortCheck: false,
      card_template: {
        paragraphs: ['{lesson_text}'],
      },
    },
  ],
};

const progressionRows: ProgramProgressionRow[] = [
  {
    id: 'prog-energy-1',
    program_slug: 'energy_vitality',
    day_number: 1,
    day_title: 'Restore Your Baseline',
    phase: 'Phase 1',
    day_goal: 'Start with simple rhythm.',
    variables: {
      day_number: 1,
      day_title: 'Restore Your Baseline',
      goal: 'Start with simple rhythm.',
      lesson_text: 'Begin with a steady wake time.',
    },
    overrides: null,
  },
  {
    id: 'prog-energy-2',
    program_slug: 'energy_vitality',
    day_number: 2,
    day_title: 'Light Before Screens',
    phase: 'Phase 1',
    day_goal: 'Anchor your morning light.',
    variables: {
      day_number: 2,
      day_title: 'Light Before Screens',
      goal: 'Anchor your morning light.',
      lesson_text: 'Get outside before your first scroll.',
    },
    overrides: null,
  },
];

describe('content query utils template support', () => {
  it('detects template content mode from program rows', () => {
    expect(getProgramContentMode(programRow)).toBe('template');
    expect(getProgramContentMode({ content_mode: 'unique' })).toBe('unique');
    expect(getProgramContentMode({ content_mode: null })).toBe('unique');
  });

  it('resolves a template day from raw Supabase-shaped rows', () => {
    const day = resolveTemplateDayRow('energy_vitality', templateRow, progressionRows[0]);

    expect(day.programSlug).toBe('energy_vitality');
    expect(day.dayNumber).toBe(1);
    expect(day.dayTitle).toBe('Restore Your Baseline');
    expect(day.cards).toHaveLength(2);

    const introCard = day.cards[0];
    expect(introCard.type).toBe('intro');
    if (introCard.type === 'intro') {
      expect(introCard.goal).toBe('Start with simple rhythm.');
    }
  });

  it('builds a full template-backed program payload from progression rows', () => {
    const days = resolveTemplateDays('energy_vitality', templateRow, progressionRows);
    const program = mapProgramRowToProgramContent(programRow, days);

    expect(program).not.toBeNull();
    expect(program?.totalDays).toBe(14);
    expect(program?.timeSlotsEnabled).toBe(true);
    expect(program?.days).toHaveLength(2);
    expect(program?.days[1]?.dayTitle).toBe('Light Before Screens');
  });

  it('preserves disabled time slots from Supabase rows for unique programs', () => {
    const program = mapProgramRowToProgramContent(
      {
        ...programRow,
        id: 'prog-gut',
        slug: 'gut_health_reset',
        title: 'Gut Reset Program',
        category: 'gut_health',
        content_mode: 'unique',
        time_slots_enabled: false,
        total_days: 21,
      },
      []
    );

    expect(program).not.toBeNull();
    expect(program?.timeSlotsEnabled).toBe(false);
  });
});
