import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { canonicalDir, repoRoot } from './lib/canonical-content.mjs';

function hasLetters(value = '') {
  return /[A-Za-z]/.test(value);
}

function isAllCaps(value = '') {
  return hasLetters(value) && value === value.toUpperCase();
}

function hasTrailingGoal(value = '') {
  return /\s+goal(?:\s+of\s+today)?\s*$/i.test(value);
}

async function loadCanonicalPrograms() {
  const entries = await readdir(canonicalDir, { withFileTypes: true });
  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(canonicalDir, entry.name))
    .sort();

  const programs = [];
  for (const filePath of jsonFiles) {
    const raw = await readFile(filePath, 'utf8');
    programs.push({
      filePath,
      data: JSON.parse(raw),
    });
  }

  return programs;
}

function parseArgs(argv) {
  const options = {
    include: new Set(),
    exclude: new Set(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--include') {
      const value = argv[index + 1];
      if (!value) throw new Error('Missing value for --include');
      options.include.add(value);
      index += 1;
      continue;
    }
    if (token === '--exclude') {
      const value = argv[index + 1];
      if (!value) throw new Error('Missing value for --exclude');
      options.exclude.add(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

function validateProgram(program) {
  const { slug, totalDays, days } = program.data ?? {};
  const errors = [];
  const warnings = [];

  if (!slug || !Array.isArray(days)) {
    errors.push('missing slug or days array');
    return { errors, warnings };
  }

  const sortedDays = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
  const expectedTotalDays =
    Number.isInteger(totalDays) && totalDays > 0 ? totalDays : sortedDays.length;

  if (sortedDays.length !== expectedTotalDays) {
    errors.push(`days length mismatch: expected ${expectedTotalDays}, got ${sortedDays.length}`);
  }

  for (let index = 0; index < sortedDays.length; index += 1) {
    const day = sortedDays[index];
    const expectedDay = index + 1;
    if (day.dayNumber !== expectedDay) {
      errors.push(`day sequence gap at index ${index}: expected day ${expectedDay}, got ${day.dayNumber}`);
      break;
    }

    const dayTitle = String(day.dayTitle ?? '').trim();
    if (!dayTitle) {
      errors.push(`day ${day.dayNumber}: empty dayTitle`);
      continue;
    }

    if (isAllCaps(dayTitle)) {
      warnings.push(`day ${day.dayNumber}: all-caps dayTitle "${dayTitle}"`);
    }

    if (hasTrailingGoal(dayTitle)) {
      warnings.push(`day ${day.dayNumber}: trailing "Goal" in dayTitle "${dayTitle}"`);
    }
  }

  return { errors, warnings };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const programs = await loadCanonicalPrograms();
  if (programs.length === 0) {
    console.log(
      `[canonical:qa] No canonical JSON files found in ${path.relative(repoRoot, canonicalDir)}`
    );
    return;
  }

  let hasErrors = false;
  let hasWarnings = false;

  for (const program of programs) {
    const slug = program.data?.slug ?? path.basename(program.filePath, '.json');
    if (options.include.size > 0 && !options.include.has(slug)) {
      continue;
    }
    if (options.exclude.has(slug)) {
      continue;
    }
    const { errors, warnings } = validateProgram(program);
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`[canonical:qa] ${slug}: OK`);
      continue;
    }

    if (errors.length > 0) {
      hasErrors = true;
      for (const error of errors) {
        console.log(`[canonical:qa] ${slug}: ERROR - ${error}`);
      }
    }

    if (warnings.length > 0) {
      hasWarnings = true;
      for (const warning of warnings) {
        console.log(`[canonical:qa] ${slug}: WARN - ${warning}`);
      }
    }
  }

  if (hasErrors || hasWarnings) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
