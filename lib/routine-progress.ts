export type RoutineEffortLevel = 'full' | 'shorter';

export type RoutineProgressRecord = {
  completedItems: string[];
  effortLevel: RoutineEffortLevel | null;
};

export const EMPTY_ROUTINE_PROGRESS: RoutineProgressRecord = {
  completedItems: [],
  effortLevel: null,
};

function isRoutineEffortLevel(value: unknown): value is RoutineEffortLevel {
  return value === 'full' || value === 'shorter';
}

export function parseRoutineProgress(rawValue: string | null): RoutineProgressRecord {
  if (!rawValue) {
    return EMPTY_ROUTINE_PROGRESS;
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (Array.isArray(parsed)) {
      return {
        completedItems: parsed.filter((value): value is string => typeof value === 'string'),
        effortLevel: null,
      };
    }

    if (parsed && typeof parsed === 'object') {
      const record = parsed as {
        completedItems?: unknown;
        effortLevel?: unknown;
      };

      return {
        completedItems: Array.isArray(record.completedItems)
          ? record.completedItems.filter((value): value is string => typeof value === 'string')
          : [],
        effortLevel: isRoutineEffortLevel(record.effortLevel) ? record.effortLevel : null,
      };
    }
  } catch {
    return EMPTY_ROUTINE_PROGRESS;
  }

  return EMPTY_ROUTINE_PROGRESS;
}

export function serializeRoutineProgress(progress: RoutineProgressRecord): string {
  return JSON.stringify({
    completedItems: progress.completedItems,
    effortLevel: progress.effortLevel,
  });
}
