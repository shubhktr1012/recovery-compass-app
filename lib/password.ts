const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_REQUIREMENTS_HINT =
  'Use 10+ characters and at least 3 of: uppercase, lowercase, number, symbol.';

export function countCharacterGroups(password: string) {
  let groups = 0;

  if (/[A-Z]/.test(password)) groups += 1;
  if (/[a-z]/.test(password)) groups += 1;
  if (/[0-9]/.test(password)) groups += 1;
  if (/[^A-Za-z0-9]/.test(password)) groups += 1;

  return groups;
}

export function isStrongPassword(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH && countCharacterGroups(password) >= 3;
}

export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length > 5) score += 1;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  const groups = countCharacterGroups(password);
  if (groups >= 2) score += 1;
  if (groups >= 3 && password.length >= MIN_PASSWORD_LENGTH) score = 4;
  else if (groups >= 3 && password.length < MIN_PASSWORD_LENGTH) score = Math.max(score, 3);
  return Math.min(score, 4);
}

