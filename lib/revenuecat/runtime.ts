import Purchases from 'react-native-purchases';

const DEFAULT_READY_TIMEOUT_MS = 5000;
const DEFAULT_READY_POLL_INTERVAL_MS = 75;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type RevenueCatReadyOptions = {
  expectedAppUserId?: string | null;
  pollIntervalMs?: number;
  timeoutMs?: number;
};

export async function waitForRevenueCatReady({
  expectedAppUserId = null,
  pollIntervalMs = DEFAULT_READY_POLL_INTERVAL_MS,
  timeoutMs = DEFAULT_READY_TIMEOUT_MS,
}: RevenueCatReadyOptions = {}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    try {
      const isConfigured = await Purchases.isConfigured();

      if (isConfigured) {
        if (!expectedAppUserId) {
          return true;
        }

        const currentAppUserId = await Purchases.getAppUserID();
        if (currentAppUserId?.trim() === expectedAppUserId) {
          return true;
        }
      }
    } catch {
      // Ignore transient readiness checks while the SDK is still being configured.
    }

    if (Date.now() >= deadline) {
      break;
    }

    await wait(pollIntervalMs);
  }

  return false;
}

export async function assertRevenueCatReady(
  options: RevenueCatReadyOptions & { errorMessage?: string } = {}
) {
  const isReady = await waitForRevenueCatReady(options);

  if (isReady) {
    return;
  }

  throw new Error(
    options.errorMessage ?? 'The purchase service is still starting. Please wait a moment and try again.'
  );
}
