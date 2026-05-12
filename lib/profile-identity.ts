const PLACEHOLDER_DISPLAY_NAMES = new Set([
  'user',
  'guest',
  'anonymous',
  'unknown',
  'test',
  'me',
]);

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeDisplayName(value: string | null | undefined) {
  if (typeof value !== 'string') return '';

  return value.replace(/\s+/g, ' ').trim();
}

export function isPlaceholderDisplayName(value: string | null | undefined) {
  const normalized = normalizeDisplayName(value).toLowerCase();
  return Boolean(normalized) && PLACEHOLDER_DISPLAY_NAMES.has(normalized);
}

function deriveNameFromEmail(email: string | null | undefined) {
  if (!email) return '';

  const prefix = email.split('@')[0] ?? '';
  const cleaned = prefix
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const firstToken = cleaned.split(' ')[0] ?? '';
  return toTitleCase(firstToken);
}

export function resolveProfileIdentity(args: {
  displayName?: string | null;
  fullName?: string | null;
  email?: string | null;
  fallbackLabel?: string;
}) {
  const normalizedDisplayName = normalizeDisplayName(args.displayName);
  const normalizedFullName = normalizeDisplayName(args.fullName);

  const resolvedDisplayName =
    !isPlaceholderDisplayName(normalizedDisplayName) && normalizedDisplayName
      ? normalizedDisplayName
      : normalizedFullName
        ? normalizedFullName.split(/\s+/)[0] ?? normalizedFullName
        : deriveNameFromEmail(args.email) || args.fallbackLabel || 'Account';

  const normalizedResolvedName = normalizeDisplayName(resolvedDisplayName);
  const initialSource =
    normalizedResolvedName.match(/[A-Za-z]/)?.[0] ??
    normalizedResolvedName.charAt(0) ??
    '?';

  return {
    displayName: normalizedResolvedName,
    initial: initialSource.toUpperCase(),
  };
}

export function validateDisplayNameInput(value: string) {
  const normalized = normalizeDisplayName(value);

  if (!normalized) {
    return null;
  }

  if (isPlaceholderDisplayName(normalized)) {
    throw new Error('Please use your actual name instead of a generic label.');
  }

  if (normalized.length < 2) {
    throw new Error('Display name must be at least 2 characters.');
  }

  if (normalized.length > 32) {
    throw new Error('Display name must be 32 characters or fewer.');
  }

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  if (wordCount > 3) {
    throw new Error('Display name must be 3 words or fewer.');
  }

  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(normalized)) {
    throw new Error('Display name can only use letters, spaces, apostrophes, periods, and hyphens.');
  }

  return normalized;
}
