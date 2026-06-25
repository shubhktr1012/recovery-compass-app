import { describe, expect, it, vi } from 'vitest';
import { logEvent, normalizeAnalyticsEventData } from '@/lib/analytics';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

function createAnalyticsClient(error: unknown = null) {
  const insert = vi.fn(async () => ({ error }));
  const from = vi.fn(() => ({ insert }));

  return {
    client: { from },
    from,
    insert,
  };
}

describe('analytics events', () => {
  it('normalizes event data into a JSON object', () => {
    expect(
      normalizeAnalyticsEventData({
        keep: 'value',
        nested: {
          enabled: true,
          remove: undefined,
        },
        remove: undefined,
      })
    ).toEqual({
      keep: 'value',
      nested: {
        enabled: true,
      },
    });
  });

  it('inserts user events with durable event fields', async () => {
    const { client, from, insert } = createAnalyticsClient();

    const result = await logEvent({
      client,
      dayNumber: 2,
      eventData: {
        notificationType: 'morning_session_ready',
        planId: 'program:energy_vitality:day:2:morning_session_ready',
      },
      eventType: 'notification_tap',
      occurredAt: new Date('2026-05-20T09:00:00.000Z'),
      programSlug: 'energy_vitality',
      userId: 'user-1',
    });

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith('user_events');
    expect(insert).toHaveBeenCalledWith({
      card_id: null,
      day_number: 2,
      event_data: {
        notificationType: 'morning_session_ready',
        planId: 'program:energy_vitality:day:2:morning_session_ready',
      },
      event_type: 'notification_tap',
      occurred_at: '2026-05-20T09:00:00.000Z',
      program_slug: 'energy_vitality',
      user_id: 'user-1',
    });
  });

  it('does not insert when there is no authenticated user', async () => {
    const { client, insert } = createAnalyticsClient();

    const result = await logEvent({
      client,
      eventType: 'notification_tap',
      userId: null,
    });

    expect(result).toEqual({ ok: false, skipped: 'missing_user' });
    expect(insert).not.toHaveBeenCalled();
  });

  it('does not throw when the analytics insert fails', async () => {
    const warningSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { client } = createAnalyticsClient({ message: 'network failed' });

    const result = await logEvent({
      client,
      eventType: 'notification_tap',
      userId: 'user-1',
    });

    expect(result.ok).toBe(false);
    expect(warningSpy).toHaveBeenCalledWith(
      'Failed to log analytics event',
      expect.objectContaining({
        eventType: 'notification_tap',
        userId: 'user-1',
      })
    );

    warningSpy.mockRestore();
  });
});
