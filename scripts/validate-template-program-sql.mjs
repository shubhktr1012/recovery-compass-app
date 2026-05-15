import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SUPPORTED_CARD_TYPES = new Set([
  'intro',
  'lesson',
  'action_step',
  'breathing_exercise',
  'mindfulness_exercise',
  'exercise_routine',
  'audio',
  'calm_trigger',
  'journal',
  'close',
]);

const SUPPORTED_TIME_SLOTS = new Set(['morning', 'afternoon', 'evening', 'anytime']);

function parseArgs(argv) {
  const options = {
    file: null,
    canonical: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--file') {
      options.file = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (token === '--canonical') {
      options.canonical = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (!options.file) {
      options.file = token;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  if (!options.file) {
    throw new Error(
      'Missing SQL file path. Example: node ./scripts/validate-template-program-sql.mjs --file ./docs/new-program-sqls/energy-program-new-sql.sql'
    );
  }

  return options;
}

function toError(errors, pathName, message) {
  errors.push(`${pathName}: ${message}`);
}

function toWarning(warnings, pathName, message) {
  warnings.push(`${pathName}: ${message}`);
}

function sqlUnquote(value) {
  return value.replace(/''/g, "'");
}

function parseSqlDocument(sql) {
  const trimmed = sql.trim();
  if (!trimmed.startsWith('INSERT INTO public.program_templates')) {
    throw new Error('SQL must begin with the program_templates insert.');
  }
  if (/\{\{[a-zA-Z0-9_]+\}\}/.test(trimmed)) {
    throw new Error('Found double-brace placeholders. Use {variable}, not {{variable}}.');
  }
  if (
    !trimmed.includes('ON CONFLICT (program_slug) DO UPDATE') ||
    !trimmed.includes('ON CONFLICT (program_slug, day_number) DO UPDATE')
  ) {
    throw new Error('Both inserts must be idempotent with ON CONFLICT ... DO UPDATE.');
  }

  const [templatePart, progressionTail] = sql.split(/\n\nINSERT INTO public\.program_progressions /);
  if (!progressionTail) {
    throw new Error('Could not find program_progressions insert.');
  }

  const templateMatch = templatePart.match(/VALUES\s*\n\s*\('([^']+)',\s*'([\s\S]*)'::jsonb\)\nON CONFLICT/);
  if (!templateMatch) {
    throw new Error('Could not parse program_templates insert.');
  }

  const programSlug = templateMatch[1];
  const templateSlots = JSON.parse(sqlUnquote(templateMatch[2]));

  const [progressionBody] = progressionTail.split(/\nON CONFLICT \(program_slug, day_number\) DO UPDATE/);
  const progressionRowsText = progressionBody.replace(
    /^\(program_slug, day_number, day_title, phase, day_goal, variables, overrides\)\nVALUES\n/,
    ''
  );

  const rows = progressionRowsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cleaned = line.replace(/[;,]$/, '');
      const match = cleaned.match(
        /^\('([^']+)',\s*(\d+),\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)'::jsonb,\s*'((?:[^']|'')*)'::jsonb\)$/
      );
      if (!match) {
        throw new Error(`Could not parse progression row: ${cleaned.slice(0, 160)}`);
      }

      return {
        program_slug: match[1],
        day_number: Number(match[2]),
        day_title: sqlUnquote(match[3]),
        phase: sqlUnquote(match[4]),
        day_goal: sqlUnquote(match[5]),
        variables: JSON.parse(sqlUnquote(match[6])),
        overrides: JSON.parse(sqlUnquote(match[7])),
      };
    });

  return { programSlug, templateSlots, rows };
}

function validateTemplateSlot(slot, pathName, errors, warnings) {
  if (!slot || typeof slot !== 'object') {
    toError(errors, pathName, 'slot must be an object');
    return;
  }
  if (typeof slot.slot_id !== 'string' || slot.slot_id.length === 0) {
    toError(errors, pathName, 'slot_id is required');
  }
  if (!SUPPORTED_CARD_TYPES.has(slot.card_type)) {
    toError(errors, pathName, `unsupported card_type "${slot.card_type}"`);
  }
  if (!SUPPORTED_TIME_SLOTS.has(slot.timeSlot)) {
    toError(errors, pathName, `unsupported timeSlot "${slot.timeSlot}"`);
  }
  if (typeof slot.isTimeSensitive !== 'boolean') {
    toError(errors, pathName, 'isTimeSensitive must be boolean');
  }
  if (typeof slot.hasEffortCheck !== 'boolean') {
    toError(errors, pathName, 'hasEffortCheck must be boolean');
  }
  if (!slot.card_template || typeof slot.card_template !== 'object' || Array.isArray(slot.card_template)) {
    toError(errors, pathName, 'card_template must be an object');
  }
  if (slot.card_template && typeof slot.card_template === 'object' && 'type' in slot.card_template) {
    toWarning(warnings, pathName, 'card_template.type is redundant and should usually be omitted');
  }
}

function validateOverrides(overrides, slotIds, pathName, errors, warnings) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    toError(errors, pathName, 'overrides must be an object');
    return;
  }

  for (const replacement of overrides.replace_slots ?? []) {
    const replacementPath = `${pathName}.replace_slots[${replacement.slot_id ?? '?'}]`;
    if (!replacement.slot_id || !slotIds.has(replacement.slot_id)) {
      toError(errors, replacementPath, 'slot_id must reference a template slot');
    }
    if ('card' in replacement) {
      toError(errors, replacementPath, 'nested "card" objects are not supported; override slot fields directly');
    }
    if (replacement.card_template && typeof replacement.card_template === 'object' && 'type' in replacement.card_template) {
      toWarning(warnings, replacementPath, 'card_template.type is redundant and should usually be omitted');
    }
  }

  for (const removedSlotId of overrides.remove_slots ?? []) {
    if (!slotIds.has(removedSlotId)) {
      toError(errors, `${pathName}.remove_slots`, `unknown slot_id "${removedSlotId}"`);
    }
  }

  for (const [index, addedSlot] of (overrides.add_slots ?? []).entries()) {
    validateTemplateSlot(addedSlot, `${pathName}.add_slots[${index}]`, errors, warnings);
  }
}

function compareCanonical(rows, canonicalProgram, errors, warnings) {
  if (!canonicalProgram || typeof canonicalProgram !== 'object' || !Array.isArray(canonicalProgram.days)) {
    throw new Error('Canonical file must contain a top-level days array.');
  }

  if (canonicalProgram.slug && canonicalProgram.slug !== rows[0]?.program_slug) {
    toError(errors, 'canonical.slug', `expected ${rows[0]?.program_slug}, got ${canonicalProgram.slug}`);
  }

  const canonicalByDay = new Map(canonicalProgram.days.map((day) => [day.dayNumber, day]));
  for (const row of rows) {
    const canonicalDay = canonicalByDay.get(row.day_number);
    if (!canonicalDay) {
      toError(errors, `progressions.day_${row.day_number}`, 'missing in canonical source');
      continue;
    }
    if (canonicalDay.dayTitle !== row.day_title) {
      toWarning(
        warnings,
        `progressions.day_${row.day_number}`,
        `title differs from canonical ("${canonicalDay.dayTitle}" vs "${row.day_title}")`
      );
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const sql = await readFile(path.resolve(options.file), 'utf8');
  const { programSlug, templateSlots, rows } = parseSqlDocument(sql);

  const errors = [];
  const warnings = [];

  if (!Array.isArray(templateSlots) || templateSlots.length === 0) {
    toError(errors, 'template_slots', 'must be a non-empty array');
  }

  const slotIds = new Set();
  templateSlots.forEach((slot, index) => {
    validateTemplateSlot(slot, `template_slots[${index}]`, errors, warnings);
    if (slot?.slot_id) {
      if (slotIds.has(slot.slot_id)) {
        toError(errors, `template_slots[${index}]`, `duplicate slot_id "${slot.slot_id}"`);
      }
      slotIds.add(slot.slot_id);
    }
  });

  const dayNumbers = [];
  for (const row of rows) {
    if (row.program_slug !== programSlug) {
      toError(errors, `progressions.day_${row.day_number}`, 'program_slug does not match template program_slug');
    }
    dayNumbers.push(row.day_number);
    if (!row.day_goal || typeof row.day_goal !== 'string') {
      toError(errors, `progressions.day_${row.day_number}`, 'day_goal is required');
    }
    if (!row.variables || typeof row.variables !== 'object' || Array.isArray(row.variables)) {
      toError(errors, `progressions.day_${row.day_number}`, 'variables must be an object');
    }
    validateOverrides(row.overrides, slotIds, `progressions.day_${row.day_number}.overrides`, errors, warnings);
  }

  dayNumbers.sort((left, right) => left - right);
  for (let index = 0; index < dayNumbers.length; index += 1) {
    if (dayNumbers[index] !== index + 1) {
      toError(errors, 'progressions', `expected contiguous day numbers starting at 1; found ${dayNumbers.join(', ')}`);
      break;
    }
  }

  if (options.canonical) {
    const canonical = JSON.parse(await readFile(path.resolve(options.canonical), 'utf8'));
    compareCanonical(rows, canonical, errors, warnings);
  }

  if (warnings.length > 0) {
    console.log('[template-sql] warnings');
    for (const warning of warnings) {
      console.log(`  - ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error('[template-sql] validation failed');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `[template-sql] OK: ${path.basename(options.file)} (${programSlug}, ${rows.length} days, ${templateSlots.length} template slots)`
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
