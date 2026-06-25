import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { purchasesMock } = vi.hoisted(() => ({
  purchasesMock: {
    getAppUserID: vi.fn(),
    isConfigured: vi.fn(),
  },
}));

vi.mock('react-native-purchases', () => ({
  default: purchasesMock,
}));

const { assertRevenueCatReady, waitForRevenueCatReady } = await import('@/lib/revenuecat/runtime');

describe('RevenueCat runtime readiness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    purchasesMock.isConfigured.mockReset();
    purchasesMock.getAppUserID.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits until the SDK is configured for the expected app user', async () => {
    purchasesMock.isConfigured
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    purchasesMock.getAppUserID.mockResolvedValue('user-123');

    const readinessExpectation = expect(waitForRevenueCatReady({
      expectedAppUserId: 'user-123',
      pollIntervalMs: 10,
      timeoutMs: 100,
    })).resolves.toBe(true);

    await vi.advanceTimersByTimeAsync(20);

    await readinessExpectation;
  });

  it('times out when the SDK is configured for a different app user', async () => {
    purchasesMock.isConfigured.mockResolvedValue(true);
    purchasesMock.getAppUserID.mockResolvedValue('other-user');

    const readinessExpectation = expect(waitForRevenueCatReady({
      expectedAppUserId: 'user-123',
      pollIntervalMs: 10,
      timeoutMs: 30,
    })).resolves.toBe(false);

    await vi.advanceTimersByTimeAsync(40);

    await readinessExpectation;
  });

  it('throws a clear error when readiness does not arrive in time', async () => {
    purchasesMock.isConfigured.mockResolvedValue(false);

    const readinessExpectation = expect(assertRevenueCatReady({
      errorMessage: 'RevenueCat never became ready.',
      expectedAppUserId: 'user-123',
      pollIntervalMs: 10,
      timeoutMs: 30,
    })).rejects.toThrow('RevenueCat never became ready.');

    await vi.advanceTimersByTimeAsync(40);

    await readinessExpectation;
  });
});
