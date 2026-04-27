import { Platform } from 'react-native';
import { PermissionStatus } from 'expo-modules-core';
import { Pedometer } from 'expo-sensors';

import { getEffectiveScheduleDate, PROGRAM_UNLOCK_HOUR } from '@/lib/programs/schedule';
import { supabase } from '@/lib/supabase';

export type StepSource =
  | 'ios_core_motion'
  | 'android_health_connect'
  | 'android_pedometer'
  | 'manual'
  | 'cached';

export type StepPermissionState =
  | 'ready'
  | 'needs_permission'
  | 'denied'
  | 'unavailable'
  | 'error';

export interface DailyStepSummary {
  canAskAgain: boolean;
  localDate: string;
  permissionState: StepPermissionState;
  providerLabel: string;
  recordedAt: string | null;
  source: StepSource;
  steps: number;
  timezone: string;
}

interface ReadDailyStepsOptions {
  requestPermission?: boolean;
}

interface PersistDailyStepsArgs {
  source: StepSource;
  steps: number;
  userId: string;
}

const DEFAULT_TIMEZONE = 'UTC';

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getEffectiveStepDate(date = new Date()) {
  return getEffectiveScheduleDate(date);
}

export function getEffectiveStepDateKey(date = new Date()) {
  return formatDateKey(getEffectiveStepDate(date));
}

export function getStepWindowStart(date = new Date()) {
  const effectiveDate = getEffectiveStepDate(date);
  return new Date(
    effectiveDate.getFullYear(),
    effectiveDate.getMonth(),
    effectiveDate.getDate(),
    PROGRAM_UNLOCK_HOUR,
    0,
    0,
    0
  );
}

export function getNextStepResetAt(date = new Date()) {
  const effectiveDate = getEffectiveStepDate(date);
  return new Date(
    effectiveDate.getFullYear(),
    effectiveDate.getMonth(),
    effectiveDate.getDate() + 1,
    PROGRAM_UNLOCK_HOUR,
    0,
    0,
    0
  );
}

export function formatStepCount(steps: number | null | undefined) {
  return new Intl.NumberFormat('en-IN').format(Math.max(0, Math.round(steps ?? 0)));
}

function createSummary(args: {
  canAskAgain?: boolean;
  permissionState: StepPermissionState;
  providerLabel?: string;
  recordedAt?: string | null;
  source?: StepSource;
  steps?: number;
}): DailyStepSummary {
  return {
    canAskAgain: args.canAskAgain ?? false,
    localDate: getEffectiveStepDateKey(),
    permissionState: args.permissionState,
    providerLabel: args.providerLabel ?? 'Step tracking',
    recordedAt: args.recordedAt ?? null,
    source: args.source ?? 'cached',
    steps: Math.max(0, Math.round(args.steps ?? 0)),
    timezone: getTimezone(),
  };
}

function hasHealthConnectStepsPermission(
  permissions: { accessType: string; recordType: string }[]
) {
  return permissions.some(
    (permission) =>
      permission.accessType === 'read' && permission.recordType === 'Steps'
  );
}

function getProviderLabelForSource(source: StepSource) {
  switch (source) {
    case 'ios_core_motion':
      return 'Motion & Fitness';
    case 'android_health_connect':
      return 'Health Connect';
    case 'android_pedometer':
      return 'Live device steps';
    case 'manual':
      return 'Manual';
    case 'cached':
    default:
      return 'Step tracking';
  }
}

async function readAndroidHealthConnectSteps(options: ReadDailyStepsOptions) {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    const healthConnect = await import('react-native-health-connect');
    const initialized = await healthConnect.initialize();

    if (!initialized) {
      return null;
    }

    const requiredPermission = { accessType: 'read', recordType: 'Steps' } as const;
    const grantedPermissions = await healthConnect.getGrantedPermissions();
    let hasPermission = hasHealthConnectStepsPermission(grantedPermissions);

    if (!hasPermission && options.requestPermission) {
      const requestedPermissions = await healthConnect.requestPermission([requiredPermission]);
      hasPermission = hasHealthConnectStepsPermission(requestedPermissions);
    }

    if (!hasPermission) {
      return null;
    }

    const now = new Date();
    const result = await healthConnect.readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: getStepWindowStart(now).toISOString(),
        endTime: now.toISOString(),
      },
    });
    const steps = result.records.reduce((total, record) => total + record.count, 0);

    return createSummary({
      canAskAgain: true,
      permissionState: 'ready',
      providerLabel: getProviderLabelForSource('android_health_connect'),
      recordedAt: now.toISOString(),
      source: 'android_health_connect',
      steps,
    });
  } catch (error) {
    console.warn('[Steps] Health Connect read failed', error);
    return null;
  }
}

async function readPedometerSteps(options: ReadDailyStepsOptions) {
  try {
    const availability = await Pedometer.isAvailableAsync();
    if (!availability) {
      return createSummary({
        permissionState: 'unavailable',
        providerLabel:
          Platform.OS === 'ios' ? 'Motion sensor unavailable' : 'Step sensor unavailable',
        source: Platform.OS === 'ios' ? 'ios_core_motion' : 'android_pedometer',
      });
    }

    let permission = await Pedometer.getPermissionsAsync();
    if (
      !permission.granted &&
      options.requestPermission &&
      permission.canAskAgain
    ) {
      permission = await Pedometer.requestPermissionsAsync();
    }

    if (!permission.granted) {
      return createSummary({
        canAskAgain: permission.canAskAgain,
        permissionState:
          permission.status === PermissionStatus.DENIED ? 'denied' : 'needs_permission',
        providerLabel: Platform.OS === 'ios' ? 'Motion & Fitness' : 'Physical activity',
        source: Platform.OS === 'ios' ? 'ios_core_motion' : 'android_pedometer',
      });
    }

    if (Platform.OS !== 'ios') {
      return createSummary({
        canAskAgain: permission.canAskAgain,
        permissionState: 'ready',
        providerLabel: getProviderLabelForSource('android_pedometer'),
        recordedAt: new Date().toISOString(),
        source: 'android_pedometer',
      });
    }

    const now = new Date();
    const result = await Pedometer.getStepCountAsync(getStepWindowStart(now), now);

    return createSummary({
      canAskAgain: permission.canAskAgain,
      permissionState: 'ready',
      providerLabel: getProviderLabelForSource('ios_core_motion'),
      recordedAt: now.toISOString(),
      source: 'ios_core_motion',
      steps: result.steps,
    });
  } catch (error) {
    console.warn('[Steps] Pedometer read failed', error);
    return createSummary({
      permissionState: 'error',
      providerLabel: 'Step tracking error',
      source: Platform.OS === 'ios' ? 'ios_core_motion' : 'android_pedometer',
    });
  }
}

export async function readDailyStepsFromDevice(
  options: ReadDailyStepsOptions = {}
): Promise<DailyStepSummary> {
  if (Platform.OS === 'android') {
    const healthConnectSummary = await readAndroidHealthConnectSteps(options);
    if (
      healthConnectSummary &&
      healthConnectSummary.permissionState !== 'unavailable'
    ) {
      return healthConnectSummary;
    }
  }

  return readPedometerSteps(options);
}

export async function getCachedDailySteps(userId: string) {
  const localDate = getEffectiveStepDateKey();
  const { data, error } = await supabase
    .from('daily_step_counts')
    .select('steps, source, provider_status, recorded_at, timezone')
    .eq('user_id', userId)
    .eq('local_date', localDate)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return createSummary({
      permissionState: 'needs_permission',
      providerLabel: 'Step tracking',
    });
  }

  return createSummary({
    permissionState: data.provider_status as StepPermissionState,
    providerLabel: getProviderLabelForSource(data.source as StepSource),
    recordedAt: data.recorded_at,
    source: data.source as StepSource,
    steps: data.steps,
  });
}

export async function persistDailySteps({
  source,
  steps,
  userId,
}: PersistDailyStepsArgs) {
  const recordedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('daily_step_counts')
    .upsert(
      {
        local_date: getEffectiveStepDateKey(),
        provider_status: 'ready',
        recorded_at: recordedAt,
        source,
        steps: Math.max(0, Math.round(steps)),
        timezone: getTimezone(),
        user_id: userId,
      },
      { onConflict: 'user_id,local_date' }
    )
    .select('steps, source, provider_status, recorded_at, timezone')
    .single();

  if (error) {
    throw error;
  }

  return createSummary({
    permissionState: data.provider_status as StepPermissionState,
    providerLabel: getProviderLabelForSource(data.source as StepSource),
    recordedAt: data.recorded_at,
    source: data.source as StepSource,
    steps: data.steps,
  });
}
