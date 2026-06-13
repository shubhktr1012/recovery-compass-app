import { getPublicEnv } from '@/lib/env';
import { supabase } from '@/lib/supabase';

type AppWebHandoffResponse = {
  url?: unknown;
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

export function buildRecoveryCompassWebUrl(path: string) {
  const { recoveryCompassWebUrl } = getPublicEnv();
  const baseUrl = normalizeBaseUrl(recoveryCompassWebUrl);
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${safePath}`;
}

function isTrustedHandoffUrl(url: string, baseUrl: string) {
  try {
    const parsedUrl = new URL(url);
    const parsedBaseUrl = new URL(baseUrl);
    return parsedUrl.origin === parsedBaseUrl.origin && parsedUrl.pathname === '/auth/app-handoff';
  } catch {
    return false;
  }
}

export async function getAppWebHandoffUrl(nextPath: string) {
  const { enableAppWebHandoff, recoveryCompassWebUrl } = getPublicEnv();
  const baseUrl = normalizeBaseUrl(recoveryCompassWebUrl);
  const fallbackUrl = buildRecoveryCompassWebUrl(nextPath);

  if (!enableAppWebHandoff) {
    return fallbackUrl;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return fallbackUrl;
    }

    const response = await fetch(`${baseUrl}/api/auth/app-handoff`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ next: nextPath }),
    });

    if (!response.ok) {
      return fallbackUrl;
    }

    const payload = (await response.json().catch(() => ({}))) as AppWebHandoffResponse;
    const handoffUrl = typeof payload.url === 'string' ? payload.url : null;

    if (!handoffUrl || !isTrustedHandoffUrl(handoffUrl, baseUrl)) {
      return fallbackUrl;
    }

    return handoffUrl;
  } catch {
    return fallbackUrl;
  }
}
