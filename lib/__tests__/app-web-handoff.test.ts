import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadHandoffModule({
  enableHandoff,
  fetchImpl,
  session,
}: {
  enableHandoff: boolean;
  fetchImpl?: typeof fetch;
  session?: { access_token: string } | null;
}) {
  vi.resetModules();
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  process.env.EXPO_PUBLIC_RECOVERY_COMPASS_WEB_URL = 'https://recoverycompass.co';
  process.env.EXPO_PUBLIC_ENABLE_APP_WEB_HANDOFF = enableHandoff ? 'true' : 'false';

  const getSession = vi.fn(async () => ({
    data: { session: session ?? null },
    error: null,
  }));

  vi.doMock('@/lib/supabase', () => ({
    supabase: {
      auth: {
        getSession,
      },
    },
  }));

  const fetchMock = fetchImpl ?? vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  const module = await import('@/lib/app-web-handoff');
  return { ...module, fetchMock, getSession };
}

describe('app web handoff helper', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/supabase');
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_RECOVERY_COMPASS_WEB_URL;
    delete process.env.EXPO_PUBLIC_ENABLE_APP_WEB_HANDOFF;
  });

  it('returns the normal website URL when the feature flag is disabled', async () => {
    const { fetchMock, getAppWebHandoffUrl, getSession } = await loadHandoffModule({
      enableHandoff: false,
      session: { access_token: 'app-token' },
    });

    await expect(getAppWebHandoffUrl('/diet-plan')).resolves.toBe('https://recoverycompass.co/diet-plan');
    expect(getSession).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the handoff URL when the web API succeeds', async () => {
    const fetchImpl = vi.fn(async () => new Response(
      JSON.stringify({ url: 'https://recoverycompass.co/auth/app-handoff?token=abc' }),
      { status: 200 }
    ));
    const { getAppWebHandoffUrl } = await loadHandoffModule({
      enableHandoff: true,
      fetchImpl,
      session: { access_token: 'app-token' },
    });

    await expect(getAppWebHandoffUrl('/diet-plan')).resolves.toBe(
      'https://recoverycompass.co/auth/app-handoff?token=abc'
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://recoverycompass.co/api/auth/app-handoff',
      expect.objectContaining({
        body: JSON.stringify({ next: '/diet-plan' }),
        method: 'POST',
      })
    );
  });

  it('falls back to the normal URL when the app has no session or the web API fails', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 500 }));
    const { getAppWebHandoffUrl } = await loadHandoffModule({
      enableHandoff: true,
      fetchImpl,
      session: null,
    });

    await expect(getAppWebHandoffUrl('/diet-plan')).resolves.toBe('https://recoverycompass.co/diet-plan');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
