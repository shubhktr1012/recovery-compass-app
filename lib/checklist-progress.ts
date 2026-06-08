export type ChecklistProgressRecord = {
  checkedItems: string[];
};

export const EMPTY_CHECKLIST_PROGRESS: ChecklistProgressRecord = {
  checkedItems: [],
};

export function parseChecklistProgress(rawValue: string | null): ChecklistProgressRecord {
  if (!rawValue) {
    return EMPTY_CHECKLIST_PROGRESS;
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (Array.isArray(parsed)) {
      return {
        checkedItems: parsed.filter((value): value is string => typeof value === 'string'),
      };
    }

    if (parsed && typeof parsed === 'object') {
      const record = parsed as {
        checkedItems?: unknown;
      };

      return {
        checkedItems: Array.isArray(record.checkedItems)
          ? record.checkedItems.filter((value): value is string => typeof value === 'string')
          : [],
      };
    }
  } catch {
    return EMPTY_CHECKLIST_PROGRESS;
  }

  return EMPTY_CHECKLIST_PROGRESS;
}

export function serializeChecklistProgress(progress: ChecklistProgressRecord): string {
  return JSON.stringify({
    checkedItems: progress.checkedItems,
  });
}
