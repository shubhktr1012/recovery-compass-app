import { describe, expect, it } from 'vitest';

import {
  getLatestConsecutiveSkippedDayCount,
  getPauseDayNumberForAbsence,
  getResumeStartedAtForDay,
} from '@/lib/programs/absence';
import {
  formatScheduledProgramStartLabel,
  getLocalProgramStartDate,
  getProgramScheduleStartSource,
  getProgramStartRecommendation,
  getScheduledProgramUnlockAt,
  isProgramStartPending,
  isProgramProgressComplete,
} from '@/lib/programs/lifecycle';

describe('program lifecycle helpers', () => {
  it('keeps a scheduled program locked until 5:00 AM on the selected local date', () => {
    const access = {
      programState: 'scheduled' as const,
      scheduledStartDate: '2026-05-20',
    };

    expect(isProgramStartPending(access, new Date(2026, 4, 20, 4, 59))).toBe(true);
    expect(isProgramStartPending(access, new Date(2026, 4, 20, 5, 0))).toBe(false);
  });

  it('builds a local 5:00 AM unlock timestamp from a date-only start date', () => {
    const unlockAt = getScheduledProgramUnlockAt('2026-05-20');

    expect(unlockAt?.getFullYear()).toBe(2026);
    expect(unlockAt?.getMonth()).toBe(4);
    expect(unlockAt?.getDate()).toBe(20);
    expect(unlockAt?.getHours()).toBe(5);
    expect(unlockAt?.getMinutes()).toBe(0);
  });

  it('formats start labels without exposing database wording', () => {
    expect(
      formatScheduledProgramStartLabel('2026-05-20', new Date(2026, 4, 19, 12, 0))
    ).toBe('Starts tomorrow at 5:00 AM');
  });

  it('returns an ISO schedule source based on local 5 AM instead of raw date strings', () => {
    const source = getProgramScheduleStartSource({
      startedAt: null,
      scheduledStartDate: '2026-05-20',
    });

    expect(source).toBe(getScheduledProgramUnlockAt('2026-05-20')?.toISOString());
  });

  it('uses reanchored start time for resumed queued programs after their scheduled resume opens', () => {
    const source = getProgramScheduleStartSource(
      {
        currentDay: 4,
        scheduledStartDate: '2026-05-20',
        startedAt: '2026-05-17T23:30:00.000Z',
      },
      new Date(2026, 4, 20, 7, 0)
    );

    expect(source).toBe('2026-05-17T23:30:00.000Z');
  });

  it('formats local dates for the configure start RPC', () => {
    expect(getLocalProgramStartDate('tomorrow', new Date(2026, 4, 19, 12, 0))).toBe('2026-05-20');
  });

  it('recommends today at 5 AM during the overnight pre-unlock window', () => {
    expect(getProgramStartRecommendation(new Date(2026, 4, 18, 2, 33))).toEqual({
      option: 'today',
      window: 'overnight_waiting',
    });
  });

  it('recommends today during the active program day', () => {
    expect(getProgramStartRecommendation(new Date(2026, 4, 18, 5, 0))).toEqual({
      option: 'today',
      window: 'day_active',
    });
  });

  it('recommends tomorrow once the evening cutoff has passed', () => {
    expect(getProgramStartRecommendation(new Date(2026, 4, 18, 19, 0))).toEqual({
      option: 'tomorrow',
      window: 'late_evening',
    });
  });

  it('recommends the upcoming 5 AM start after midnight', () => {
    expect(getProgramStartRecommendation(new Date(2026, 4, 18, 0, 30))).toEqual({
      option: 'today',
      window: 'overnight_waiting',
    });
  });

  it('counts only the latest consecutive skipped run for absence pause', () => {
    expect(
      getLatestConsecutiveSkippedDayCount([
        { dayNumber: 1, dayState: 'skipped' },
        { dayNumber: 2, dayState: 'partial' },
        { dayNumber: 3, dayState: 'skipped' },
        { dayNumber: 4, dayState: 'skipped' },
        { dayNumber: 5, dayState: 'skipped' },
      ])
    ).toBe(3);
  });

  it('pauses on the next day after three latest skipped days', () => {
    expect(
      getPauseDayNumberForAbsence(
        [
          { dayNumber: 1, dayState: 'completed' },
          { dayNumber: 2, dayState: 'skipped' },
          { dayNumber: 3, dayState: 'skipped' },
          { dayNumber: 4, dayState: 'skipped' },
        ],
        14
      )
    ).toBe(5);
  });

  it('does not pause when a recent partial breaks the skipped run', () => {
    expect(
      getPauseDayNumberForAbsence(
        [
          { dayNumber: 1, dayState: 'skipped' },
          { dayNumber: 2, dayState: 'skipped' },
          { dayNumber: 3, dayState: 'partial' },
        ],
        14
      )
    ).toBeNull();
  });

  it('reanchors resume so the frozen day is active today', () => {
    const startedAt = getResumeStartedAtForDay(4, new Date(2026, 4, 18, 12, 0));

    expect(startedAt.getFullYear()).toBe(2026);
    expect(startedAt.getMonth()).toBe(4);
    expect(startedAt.getDate()).toBe(15);
    expect(startedAt.getHours()).toBe(5);
  });

  it('treats a program as complete only when completedAt and final day are both present', () => {
    expect(
      isProgramProgressComplete({
        programSlug: 'energy_vitality',
        completedDays: [1, 2, 14],
        completedAt: '2026-05-18T10:00:00.000Z',
      })
    ).toBe(true);

    expect(
      isProgramProgressComplete({
        programSlug: 'energy_vitality',
        completedDays: [1, 2, 13],
        completedAt: '2026-05-18T10:00:00.000Z',
      })
    ).toBe(false);

    expect(
      isProgramProgressComplete({
        programSlug: 'energy_vitality',
        completedDays: [1, 2, 14],
        completedAt: null,
      })
    ).toBe(false);
  });
});
