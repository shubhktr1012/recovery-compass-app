import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  canonicalDir,
  repoRoot,
  seedsDir,
  sqlQuote,
  validateCanonicalProgram,
} from './lib/canonical-content.mjs';

function parseArgs(argv) {
  const options = {
    programSlug: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--program') {
      const nextToken = argv[index + 1];
      if (!nextToken) {
        throw new Error('Missing value for --program. Example: --program six_day_reset');
      }
      options.programSlug = nextToken;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

function cardsJsonSql(cards) {
  return `${sqlQuote(JSON.stringify(cards))}::jsonb`;
}

function dayEstimatedMinutesSql(day) {
  if (typeof day.estimatedMinutes === 'number' && Number.isFinite(day.estimatedMinutes)) {
    return String(Math.max(1, Math.round(day.estimatedMinutes)));
  }
  return 'NULL';
}

function makeSeedSql(canonicalProgram) {
  const orderedDays = [...canonicalProgram.days].sort((left, right) => left.dayNumber - right.dayNumber);
  const seededDayNumbers = orderedDays.map((day) => day.dayNumber);
  const keepDaySql = seededDayNumbers.length > 0 ? seededDayNumbers.join(', ') : 'NULL';
  const statements = orderedDays
    .map((day) => {
      const title = `Day ${day.dayNumber} - ${day.dayTitle}`;
      return `INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = ${sqlQuote(canonicalProgram.slug)} LIMIT 1),
  ${sqlQuote(canonicalProgram.slug)},
  ${day.dayNumber},
  ${sqlQuote(day.dayTitle)},
  ${sqlQuote(title)},
  ${dayEstimatedMinutesSql(day)},
  ${cardsJsonSql(day.cards)}
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();`;
    })
    .join('\n\n');

  return `-- ${canonicalProgram.slug} seed (generated from canonical content)
-- Source: ${canonicalProgram.sourcePath ?? '(unspecified canonical source)'}
-- Generated at: ${new Date().toISOString()}

BEGIN;

DELETE FROM public.program_days
WHERE program_slug = ${sqlQuote(canonicalProgram.slug)}
  AND day_number NOT IN (${keepDaySql});

${statements}

COMMIT;
`;
}

async function listCanonicalFiles(programSlug) {
  if (programSlug) {
    return [path.join(canonicalDir, `${programSlug}.json`)];
  }

  const entries = await readdir(canonicalDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(canonicalDir, entry.name))
    .sort();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = await listCanonicalFiles(options.programSlug);
  if (files.length === 0) {
    throw new Error(
      `No canonical files found${options.programSlug ? ` for ${options.programSlug}` : ''} in ${path.relative(
        repoRoot,
        canonicalDir
      )}`
    );
  }

  await mkdir(seedsDir, { recursive: true });

  for (const filePath of files) {
    const raw = await readFile(filePath, 'utf8');
    const canonicalProgram = JSON.parse(raw);
    const validation = validateCanonicalProgram(canonicalProgram);
    if (!validation.valid) {
      throw new Error(
        `Canonical content invalid for ${canonicalProgram?.slug ?? filePath}:\n${validation.errors
          .map((error) => `- ${error}`)
          .join('\n')}`
      );
    }

    const sql = makeSeedSql(canonicalProgram);
    const outputPath = path.join(seedsDir, `${canonicalProgram.slug}_program_days.sql`);
    await writeFile(outputPath, sql, 'utf8');
    console.log(
      `[seed] ${canonicalProgram.slug}: ${canonicalProgram.days.length} days -> ${path.relative(
        repoRoot,
        outputPath
      )}`
    );
    for (const warning of validation.warnings) {
      console.log(`  [warning] ${warning}`);
    }
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
