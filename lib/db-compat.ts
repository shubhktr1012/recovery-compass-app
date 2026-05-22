type SupabaseLikeError = {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

function getErrorText(error: unknown) {
  if (!error || typeof error !== 'object') {
    return String(error ?? '');
  }

  const supabaseError = error as SupabaseLikeError;
  return [
    supabaseError.code,
    supabaseError.message,
    supabaseError.details,
    supabaseError.hint,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function isMissingColumnError(error: unknown, columnName: string) {
  const text = getErrorText(error);
  return (
    text.includes(columnName.toLowerCase()) &&
    (text.includes('column') || text.includes('schema cache') || text.includes('42703'))
  );
}

export function isMissingAnyColumnError(error: unknown, columnNames: string[]) {
  return columnNames.some((columnName) => isMissingColumnError(error, columnName));
}

export function isMissingFunctionError(error: unknown, functionName: string) {
  const text = getErrorText(error);
  return (
    text.includes(functionName.toLowerCase()) &&
    (text.includes('function') || text.includes('schema cache') || text.includes('pgrst202'))
  );
}
