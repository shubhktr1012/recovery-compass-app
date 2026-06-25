import { describe, expect, it } from 'vitest';

import {
  ResolverError,
  getAudioThresholds,
  isWindowOpen,
  resolveDay,
  toLocalHHMM,
} from '@/lib/card-resolver';
import type { DayContent } from '@/types/content';
import type { ProgressionRow, ProgramTemplate } from '@/types/resolver';

const uniqueDay: DayContent = {
  programSlug: 'six_day_reset',
  dayNumber: 1,
  dayTitle: 'Day 1: The First Step',
  estimatedMinutes: 20,
  cards: [
    {
      type: 'intro',
      dayNumber: 1,
      dayTitle: 'Day 1: The First Step',
      goal: 'Begin your reset with intention.',
    },
    {
      type: 'lesson',
      title: 'Why you started',
      paragraphs: ['Recovery starts with a single honest moment.'],
    },
    {
      type: 'journal',
      prompt: 'What brought you here today?',
    },
  ],
};

const template: ProgramTemplate = {
  id: 'tmpl-energy',
  program_slug: 'energy_vitality',
  template_slots: [
    {
      slot_id: 'morning_cold_water',
      card_type: 'action_step',
      timeSlot: 'morning',
      isTimeSensitive: true,
      hasEffortCheck: false,
      card_template: {
        title: 'Cold shower',
        instructions: ['{cold_water_seconds} seconds of cold water.'],
        duration: '{cold_water_seconds} seconds',
      },
    },
    {
      slot_id: 'evening_audio',
      card_type: 'audio',
      timeSlot: 'evening',
      isTimeSensitive: false,
      hasEffortCheck: false,
      card_template: {
        title: 'Evening wind-down',
        description: 'A {breathing_minutes}-minute guided session.',
        audioStoragePath: 'programs/energy_vitality/audio/{audio_variant}.mp3',
        durationSeconds: 600,
        autoAdvance: false,
      },
    },
  ],
};

const progression: ProgressionRow = {
  id: 'prog-energy-5',
  program_slug: 'energy_vitality',
  day_number: 5,
  day_title: 'Energy Day 5',
  phase: 'Phase 1: Foundation',
  day_goal: 'Build cold tolerance.',
  variables: {
    audio_variant: 'calm',
    breathing_minutes: 10,
    cold_water_seconds: 50,
  },
};

describe('resolveDay unique mode', () => {
  it('returns resolved day content with unique mode', () => {
    const result = resolveDay({
      programSlug: 'six_day_reset',
      dayNumber: 1,
      contentMode: 'unique',
      dayContent: uniqueDay,
    });

    expect(result.contentMode).toBe('unique');
    expect(result.programSlug).toBe('six_day_reset');
    expect(result.dayNumber).toBe(1);
    expect(result.cards).toHaveLength(3);
  });

  it('attaches default time metadata to legacy cards', () => {
    const result = resolveDay({
      programSlug: 'six_day_reset',
      dayNumber: 1,
      contentMode: 'unique',
      dayContent: uniqueDay,
    });

    for (const card of result.cards) {
      expect(card.timeSlot).toBe('anytime');
      expect(card.isTimeSensitive).toBe(false);
      expect(card.hasEffortCheck).toBe(false);
    }
  });

  it('preserves existing card metadata when cards are already annotated', () => {
    const annotatedDay: DayContent = {
      ...uniqueDay,
      cards: [
        {
          ...uniqueDay.cards[0],
          timeSlot: 'morning',
          isTimeSensitive: true,
          hasEffortCheck: true,
        } as unknown as DayContent['cards'][number],
      ],
    };

    const result = resolveDay({
      programSlug: 'six_day_reset',
      dayNumber: 1,
      contentMode: 'unique',
      dayContent: annotatedDay,
    });

    expect(result.cards[0].timeSlot).toBe('morning');
    expect(result.cards[0].isTimeSensitive).toBe(true);
    expect(result.cards[0].hasEffortCheck).toBe(true);
  });

  it('preserves original card fields', () => {
    const result = resolveDay({
      programSlug: 'six_day_reset',
      dayNumber: 1,
      contentMode: 'unique',
      dayContent: uniqueDay,
    });

    const journalCard = result.cards.find((card) => card.type === 'journal');
    expect(journalCard?.prompt).toBe('What brought you here today?');
  });

  it('throws when unique content is missing', () => {
    expect(() =>
      resolveDay({
        programSlug: 'six_day_reset',
        dayNumber: 1,
        contentMode: 'unique',
      })
    ).toThrow(ResolverError);
  });
});

describe('resolveDay template mode', () => {
  it('returns resolved day content from template and progression rows', () => {
    const result = resolveDay({
      programSlug: 'energy_vitality',
      dayNumber: 5,
      contentMode: 'template',
      template,
      progression,
    });

    expect(result.contentMode).toBe('template');
    expect(result.programSlug).toBe('energy_vitality');
    expect(result.dayNumber).toBe(5);
    expect(result.dayTitle).toBe('Energy Day 5');
    expect(result.dayGoal).toBe('Build cold tolerance.');
    expect(result.phase).toBe('Phase 1: Foundation');
  });

  it('interpolates variables in nested string fields', () => {
    const result = resolveDay({
      programSlug: 'energy_vitality',
      dayNumber: 5,
      contentMode: 'template',
      template,
      progression,
    });

    const coldCard = result.cards[0];
    expect(coldCard.type).toBe('action_step');
    if (coldCard.type === 'action_step') {
      const instructions = coldCard.instructions ?? [];
      expect(instructions[0]).toBe('50 seconds of cold water.');
      expect(coldCard.duration).toBe('50 seconds');
    }

    const audioCard = result.cards[1];
    expect(audioCard.type).toBe('audio');
    if (audioCard.type === 'audio') {
      expect(audioCard.description).toBe('A 10-minute guided session.');
      expect(audioCard.audioStoragePath).toBe('programs/energy_vitality/audio/calm.mp3');
    }
  });

  it('preserves variable types when a field is a single placeholder', () => {
    const result = resolveDay({
      programSlug: 'energy_vitality',
      dayNumber: 5,
      contentMode: 'template',
      template: {
        ...template,
        template_slots: [
          {
            slot_id: 'intro_card',
            card_type: 'intro',
            timeSlot: 'anytime',
            isTimeSensitive: false,
            hasEffortCheck: false,
            card_template: {
              dayNumber: '{day_number}',
              dayTitle: '{day_title}',
              goal: '{day_goal}',
              estimatedMinutes: '{estimated_minutes}',
            },
          },
          {
            slot_id: 'audio_card',
            card_type: 'audio',
            timeSlot: 'evening',
            isTimeSensitive: false,
            hasEffortCheck: false,
            card_template: {
              title: 'Night audio',
              audioStoragePath: 'programs/energy_vitality/audio/{audio_variant}.mp3',
              durationSeconds: '{audio_seconds}',
              autoAdvance: '{auto_advance}',
            },
          },
        ],
      },
      progression: {
        ...progression,
        day_goal: 'Build cold tolerance.',
        variables: {
          ...progression.variables,
          day_number: 5,
          day_title: 'Energy Day 5',
          day_goal: 'Build cold tolerance.',
          estimated_minutes: 14,
          audio_seconds: 600,
          auto_advance: false,
        },
      },
    });

    const introCard = result.cards[0];
    expect(introCard.type).toBe('intro');
    if (introCard.type === 'intro') {
      expect(introCard.dayNumber).toBe(5);
      expect(typeof introCard.dayNumber).toBe('number');
      expect(introCard.estimatedMinutes).toBe(14);
      expect(typeof introCard.estimatedMinutes).toBe('number');
    }

    const audioCard = result.cards[1];
    expect(audioCard.type).toBe('audio');
    if (audioCard.type === 'audio') {
      expect(audioCard.durationSeconds).toBe(600);
      expect(typeof audioCard.durationSeconds).toBe('number');
      expect(audioCard.autoAdvance).toBe(false);
      expect(typeof audioCard.autoAdvance).toBe('boolean');
    }
  });

  it('uses the progression estimate as the day-level duration for template days', () => {
    const result = resolveDay({
      programSlug: 'energy_vitality',
      dayNumber: 5,
      contentMode: 'template',
      template: {
        ...template,
        template_slots: [
          {
            slot_id: 'intro_card',
            card_type: 'intro',
            timeSlot: 'anytime',
            isTimeSensitive: false,
            hasEffortCheck: false,
            card_template: {
              dayNumber: '{day_number}',
              dayTitle: '{day_title}',
              goal: '{day_goal}',
              estimatedMinutes: '{estimated_minutes}',
            },
          },
          ...template.template_slots,
        ],
      },
      progression: {
        ...progression,
        variables: {
          ...progression.variables,
          day_number: 5,
          day_title: 'Energy Day 5',
          day_goal: 'Build cold tolerance.',
          estimated_minutes: 14,
        },
      },
    });

    expect(result.estimatedMinutes).toBe(14);
  });

  it('attaches metadata from template slots', () => {
    const result = resolveDay({
      programSlug: 'energy_vitality',
      dayNumber: 5,
      contentMode: 'template',
      template,
      progression,
    });

    expect(result.cards[0].timeSlot).toBe('morning');
    expect(result.cards[0].isTimeSensitive).toBe(true);
    expect(result.cards[1].timeSlot).toBe('evening');
    expect(result.cards[1].isTimeSensitive).toBe(false);
  });

  it('applies remove slot overrides', () => {
    const result = resolveDay({
      programSlug: 'energy_vitality',
      dayNumber: 5,
      contentMode: 'template',
      template,
      progression: {
        ...progression,
        overrides: {
          remove_slots: ['evening_audio'],
        },
      },
    });

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].type).toBe('action_step');
  });

  it('applies add slot overrides', () => {
    const result = resolveDay({
      programSlug: 'energy_vitality',
      dayNumber: 5,
      contentMode: 'template',
      template,
      progression: {
        ...progression,
        variables: {
          ...progression.variables,
          day_number: 5,
        },
        overrides: {
          add_slots: [
            {
              slot_id: 'anytime_reflection',
              card_type: 'journal',
              timeSlot: 'anytime',
              isTimeSensitive: false,
              hasEffortCheck: false,
              card_template: {
                prompt: 'How did Day {day_number} feel?',
              },
            },
          ],
        },
      },
    });

    expect(result.cards).toHaveLength(3);
    const journalCard = result.cards[2];
    expect(journalCard.type).toBe('journal');
    if (journalCard.type === 'journal') {
      expect(journalCard.prompt).toBe('How did Day 5 feel?');
    }
  });

  it('applies replacement overrides without losing the slot id', () => {
    const result = resolveDay({
      programSlug: 'energy_vitality',
      dayNumber: 5,
      contentMode: 'template',
      template,
      progression: {
        ...progression,
        overrides: {
          replace_slots: [
            {
              slot_id: 'morning_cold_water',
              timeSlot: 'anytime',
              isTimeSensitive: false,
            },
          ],
        },
      },
    });

    expect(result.cards[0].timeSlot).toBe('anytime');
    expect(result.cards[0].isTimeSensitive).toBe(false);
  });

  it('throws when required template mode inputs are missing', () => {
    expect(() =>
      resolveDay({
        programSlug: 'energy_vitality',
        dayNumber: 5,
        contentMode: 'template',
        progression,
      })
    ).toThrow(ResolverError);

    expect(() =>
      resolveDay({
        programSlug: 'energy_vitality',
        dayNumber: 5,
        contentMode: 'template',
        template,
      })
    ).toThrow(ResolverError);
  });

  it('throws when template or progression identity mismatches the request', () => {
    expect(() =>
      resolveDay({
        programSlug: 'energy_vitality',
        dayNumber: 5,
        contentMode: 'template',
        template: { ...template, program_slug: 'sleep_disorder_reset' },
        progression,
      })
    ).toThrow(ResolverError);

    expect(() =>
      resolveDay({
        programSlug: 'energy_vitality',
        dayNumber: 5,
        contentMode: 'template',
        template,
        progression: { ...progression, day_number: 6 },
      })
    ).toThrow(ResolverError);
  });
});

describe('time slot helpers', () => {
  it('detects same-day windows', () => {
    expect(isWindowOpen('morning', '09:00')).toBe(true);
    expect(isWindowOpen('morning', '15:00')).toBe(false);
    expect(isWindowOpen('afternoon', '13:00')).toBe(true);
    expect(isWindowOpen('afternoon', '19:00')).toBe(false);
  });

  it('detects windows that cross midnight', () => {
    expect(isWindowOpen('evening', '20:00')).toBe(true);
    expect(isWindowOpen('evening', '00:30')).toBe(true);
    expect(isWindowOpen('evening', '02:00')).toBe(false);
    expect(isWindowOpen('anytime', '23:00')).toBe(true);
    expect(isWindowOpen('anytime', '04:00')).toBe(false);
  });

  it('formats local dates as HH:MM', () => {
    expect(toLocalHHMM(new Date())).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('audio threshold helpers', () => {
  it('returns 50 percent and 75 percent thresholds', () => {
    expect(getAudioThresholds(600)).toEqual({
      markAsDone: 300,
      autoComplete: 450,
    });
  });

  it('handles short audio durations', () => {
    const thresholds = getAudioThresholds(60);

    expect(thresholds.markAsDone).toBeCloseTo(30);
    expect(thresholds.autoComplete).toBeCloseTo(45);
  });
});
