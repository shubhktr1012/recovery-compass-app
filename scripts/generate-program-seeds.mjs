import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const outputDir = path.join(repoRoot, 'app', 'supabase', 'seeds');

const PROGRAMS = [
  {
    slug: 'six_day_reset',
    totalDays: 6,
    sourcePath: path.join(
      repoRoot,
      'documents',
      'Sent By Anjan',
      'program_content',
      '6 days program text on screen.md'
    ),
    parser: 'six_day',
    outputFile: 'six_day_reset_program_days.sql',
  },
  {
    slug: 'ninety_day_transform',
    programId: 'b6955e65-bc79-4e9d-94b6-7d927c299216',
    totalDays: 90,
    sourcePath: path.join(
      repoRoot,
      'documents',
      'Sent By Anjan',
      '🧭 RECOVERY COMPASS 90-days Program.md'
    ),
    parser: 'ninety_day',
    outputFile: 'ninety_day_transform_program_days.sql',
    audioTemplate: 'audio/90-day/{day}.mp3',
    durationSeconds: 420,
  },
  {
    slug: 'energy_vitality',
    programId: 'df20aaec-2fc5-4e7e-b6cb-5d0a1768aac9',
    totalDays: 42,
    sourcePath: path.join(
      repoRoot,
      'documents',
      'Sent By Anjan',
      'ENERGY & VITALITY PROBLEMS ( LOW ENERGY ) PROGRAM.md'
    ),
    parser: 'energy',
    outputFile: 'energy_vitality_program_days.sql',
  },
  {
    slug: 'male_sexual_health',
    programId: 'f467e6e3-d0c6-489a-8a8f-bc75104f6a7d',
    totalDays: 45,
    sourcePath: path.join(
      repoRoot,
      'documents',
      'Sent By Anjan',
      'male sexual health 45 day program.md'
    ),
    parser: 'male',
    outputFile: 'male_sexual_health_program_days.sql',
  },
  {
    slug: 'age_reversal',
    programId: 'a6e680d7-75d6-41e4-9434-200224d19393',
    totalDays: 90,
    sourcePath: path.join(
      repoRoot,
      'documents',
      'Sent By Anjan',
      'female age reversal program  90 days.md'
    ),
    parser: 'age',
    outputFile: 'age_reversal_program_days.sql',
  },
];

function cleanText(value = '') {
  return value
    .replace(/\r/g, '')
    .replace(/\uFEFF/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\\\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripMarkdown(value = '') {
  return cleanText(
    value
      .replace(/```/g, '')
      .replace(/[*_`]/g, '')
      .replace(/^#+\s*/gm, '')
      .replace(/^\s*>+\s?/gm, '')
  );
}

function normalizeSourceText(value = '') {
  return cleanText(value.replace(/\u2019/g, "'").replace(/\u201C|\u201D/g, '"'));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unique(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (!item) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }
  return result;
}

function splitSentences(text) {
  const normalized = cleanText(text).replace(/\n+/g, ' ');
  if (!normalized) return [];

  return normalized
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((part) => cleanText(part))
    .filter(Boolean);
}

function toParagraphs(...blocks) {
  const paragraphs = [];

  for (const block of blocks) {
    const text = stripMarkdown(block);
    if (!text) continue;

    const rawSegments = text
      .split(/\n{2,}/)
      .flatMap((segment) =>
        segment
          .split('\n')
          .map((line) => cleanText(line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')))
      )
      .filter(Boolean);

    for (const segment of rawSegments) {
      const sentences = splitSentences(segment);
      if (sentences.length <= 3) {
        paragraphs.push(segment);
        continue;
      }

      for (let index = 0; index < sentences.length; index += 3) {
        paragraphs.push(sentences.slice(index, index + 3).join(' '));
      }
    }
  }

  return unique(paragraphs);
}

function toInstructionLines(text) {
  const rawLines = stripMarkdown(text)
    .split('\n')
    .map((line) => cleanText(line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')))
    .filter(Boolean);

  if (rawLines.length > 1) {
    const merged = [];
    for (const line of rawLines) {
      const previous = merged[merged.length - 1];
      if (
        previous &&
        !/[.!?:]$/.test(previous) &&
        !/^(How to do it|Steps|Purpose|Routine|Movement|Benefits|Repetitions|Instead)$/i.test(previous)
      ) {
        merged[merged.length - 1] = `${previous} ${line}`;
      } else {
        merged.push(line);
      }
    }
    return unique(merged);
  }

  return unique(splitSentences(rawLines[0] ?? ''));
}

function parseDurationLabel(text) {
  const match = stripMarkdown(text).match(
    /(\d+(?:\s*[–-]\s*\d+)?)\s*(minutes?|mins?|seconds?|hours?)\b/i
  );
  return match ? match[0].replace(/\s+/g, ' ') : undefined;
}

function parseMinutes(text) {
  const match = stripMarkdown(text).match(
    /(\d+)(?:\s*[–-]\s*(\d+))?\s*(minutes?|mins?|hours?)\b/i
  );

  if (!match) return undefined;

  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  const unit = match[3].toLowerCase();
  const average = (start + end) / 2;
  return unit.startsWith('hour') ? average * 60 : average;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function titleCase(value = '') {
  return cleanText(value)
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      if (['and', 'or', 'of', 'the', 'for', 'to', 'in'].includes(word)) return word;
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\bDay\b/g, 'Day')
    .replace(/\bCalm\b/g, 'CALM');
}

function highlightFromParagraphs(paragraphs) {
  if (paragraphs.length === 0) return undefined;
  return splitSentences(paragraphs[0])[0] ?? paragraphs[0];
}

function makeIntro(dayNumber, dayTitle, goal, estimatedMinutes) {
  return {
    type: 'intro',
    dayNumber,
    dayTitle,
    goal,
    estimatedMinutes,
  };
}

function makeLesson(title, paragraphs, highlight) {
  const cleanedParagraphs = unique(paragraphs).filter(Boolean);
  if (cleanedParagraphs.length === 0) return null;

  return {
    type: 'lesson',
    ...(title ? { title } : {}),
    paragraphs: cleanedParagraphs,
    ...(highlight ? { highlight } : {}),
  };
}

function makeActionStep(stepNumber, title, instructions, whyThisWorks, proTip, duration) {
  const cleanedInstructions = unique(instructions).filter(Boolean);
  if (cleanedInstructions.length === 0) return null;

  return {
    type: 'action_step',
    stepNumber,
    title,
    ...(duration ? { duration } : {}),
    instructions: cleanedInstructions,
    ...(whyThisWorks ? { whyThisWorks } : {}),
    ...(proTip ? { proTip } : {}),
  };
}

function makeMindfulnessExercise(title, steps, duration, timerSeconds, completionMessage) {
  const cleanedSteps = unique(steps).filter(Boolean);
  if (cleanedSteps.length === 0) return null;

  return {
    type: 'mindfulness_exercise',
    title,
    ...(duration ? { duration } : {}),
    steps: cleanedSteps,
    ...(timerSeconds ? { timerSeconds } : {}),
    ...(completionMessage ? { completionMessage } : {}),
  };
}

function makeBreathingExercise(title, inhaleSeconds, holdSeconds, exhaleSeconds, cycles, instructions) {
  if (!inhaleSeconds || !exhaleSeconds || !cycles) return null;

  return {
    type: 'breathing_exercise',
    title,
    pattern: {
      inhaleSeconds,
      ...(holdSeconds ? { holdSeconds } : {}),
      exhaleSeconds,
    },
    cycles,
    ...(instructions ? { instructions } : {}),
  };
}

function makeExerciseRoutine(title, exercises, totalDuration) {
  const cleanedExercises = exercises
    .map((exercise) => ({
      ...exercise,
      instructions: unique(exercise.instructions ?? []).filter(Boolean),
    }))
    .filter((exercise) => exercise.name && exercise.instructions.length > 0);

  if (cleanedExercises.length === 0) return null;

  return {
    type: 'exercise_routine',
    title,
    ...(totalDuration ? { totalDuration } : {}),
    exercises: cleanedExercises,
  };
}

function makeCalmTrigger(context) {
  return {
    type: 'calm_trigger',
    context,
  };
}

function makeJournal(prompt, helperText, followUpPrompt) {
  return {
    type: 'journal',
    prompt,
    ...(helperText ? { helperText } : {}),
    ...(followUpPrompt ? { followUpPrompt } : {}),
  };
}

function makeAudioCard(title, description, audioStoragePath, durationSeconds) {
  return {
    type: 'audio',
    title,
    ...(description ? { description } : {}),
    audioStoragePath,
    durationSeconds,
  };
}

function makeClose(message, secondaryMessage) {
  return {
    type: 'close',
    message,
    ...(secondaryMessage ? { secondaryMessage } : {}),
  };
}

function sqlQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function cardsJsonSql(cards) {
  return `${sqlQuote(JSON.stringify(cards))}::jsonb`;
}

function contiguousMissing(dayNumbers) {
  if (dayNumbers.length === 0) return [];
  const sorted = [...dayNumbers].sort((left, right) => left - right);
  const missing = [];

  for (let day = sorted[0]; day <= sorted[sorted.length - 1]; day += 1) {
    if (!sorted.includes(day)) {
      missing.push(day);
    }
  }

  return missing;
}

function makeSeedSql(program, days, notes = []) {
  const programIdSql = program.programId
    ? sqlQuote(program.programId)
    : `(SELECT id FROM public.programs WHERE slug = ${sqlQuote(program.slug)} LIMIT 1)`;
  const statements = days
    .map((day) => {
      const title = `Day ${day.dayNumber} - ${day.dayTitle}`;
      return `INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  ${programIdSql}, ${sqlQuote(program.slug)}, ${day.dayNumber},
  ${sqlQuote(day.dayTitle)}, ${sqlQuote(title)}, ${day.estimatedMinutes},
  ${cardsJsonSql(day.cards)}
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();`;
    })
    .join('\n\n');

  return `-- ${program.slug} seed
-- Source: ${path.relative(repoRoot, program.sourcePath)}
${notes.map((note) => `-- ${note}`).join('\n')}

BEGIN;

${statements}

COMMIT;
`;
}

function pickRandomSample(days, count, seed) {
  let state = seed >>> 0;
  function next() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  }

  const copy = [...days];
  const sample = [];

  while (copy.length > 0 && sample.length < count) {
    const index = Math.floor(next() * copy.length);
    sample.push(copy.splice(index, 1)[0]);
  }

  return sample.sort((left, right) => left.dayNumber - right.dayNumber);
}

function extractFieldMap(text, labels) {
  const lines = cleanText(text).split('\n');
  const fields = new Map();
  let currentLabel = 'body';

  for (const rawLine of lines) {
    const line = stripMarkdown(rawLine);
    if (!line) continue;

    const matchedLabel = labels.find((label) =>
      line.toLowerCase().startsWith(label.toLowerCase())
    );

    if (matchedLabel) {
      currentLabel = matchedLabel;
      const rest = cleanText(line.slice(matchedLabel.length).replace(/^[:\s-]+/, ''));
      if (!fields.has(currentLabel)) fields.set(currentLabel, []);
      if (rest) fields.get(currentLabel).push(rest);
      continue;
    }

    if (!fields.has(currentLabel)) fields.set(currentLabel, []);
    fields.get(currentLabel).push(line);
  }

  return fields;
}

function readField(fields, label) {
  return cleanText((fields.get(label) ?? []).join('\n'));
}

function listField(fields, label) {
  return (fields.get(label) ?? []).map((item) => cleanText(item)).filter(Boolean);
}

function parseDayBlocks(text, headingRegex, { normalizeHeading } = {}) {
  const matches = [...text.matchAll(headingRegex)];
  const blocks = [];

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const dayNumber = Number(current[1]);
    const rawTitle = current[2] ?? '';
    const bodyStart = current.index + current[0].length;
    const bodyEnd = next ? next.index : text.length;
    blocks.push({
      dayNumber,
      dayTitle: titleCase(stripMarkdown(normalizeHeading ? normalizeHeading(rawTitle) : rawTitle)),
      body: cleanText(text.slice(bodyStart, bodyEnd)),
      heading: current[0],
    });
  }

  return blocks;
}

function normalizeMaleSource(text) {
  return normalizeSourceText(text).replace(/([a-z])Day\s+(\d+\s+[—–-])/g, '$1\nDay $2');
}

function normalizeAgeSource(text) {
  return normalizeSourceText(text).replace(/\nDay\s+/g, '\n## Day ');
}

function extractGoalBeforeSteps(body, stepHeadingRegex) {
  const firstStepMatch = stepHeadingRegex.exec(body);
  stepHeadingRegex.lastIndex = 0;
  const stepIndex = firstStepMatch ? firstStepMatch.index : body.length;
  const goalBlock = cleanText(body.slice(0, stepIndex));
  return cleanText(
    stripMarkdown(
      goalBlock
        .replace(/^Goal of Today:\s*/i, '')
        .replace(/^Goal\s*:?\s*/i, '')
        .replace(/^##\s*Goal\s*/i, '')
        .replace(/^\*\*Goal\*\*\s*/i, '')
        .replace(/^\*\*Goal:\*\*\s*/i, '')
    )
  );
}

function parseStepSections(body) {
  const stepHeadingRegex =
    /^(?:##\s*)?(?:[^\p{L}\p{N}\n]*\s*)?\**Step\s+(\d+)(?:\s*[:—–-]\s*([^\n*\\]+))?\**\\?\s*$/gimu;
  const matches = [...body.matchAll(stepHeadingRegex)];
  const sections = [];

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const blockStart = current.index + current[0].length;
    const blockEnd = next ? next.index : body.length;
    sections.push({
      stepNumber: Number(current[1]),
      title: cleanText(stripMarkdown(current[2] ?? '')),
      body: cleanText(body.slice(blockStart, blockEnd)),
    });
  }

  return sections;
}

function parseMarkdownSections(body) {
  const headingRegex = /^##\s*([^\n]+)$/gim;
  const matches = [...body.matchAll(headingRegex)];
  const sections = [];

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const sectionStart = current.index + current[0].length;
    const sectionEnd = next ? next.index : body.length;
    sections.push({
      heading: cleanText(stripMarkdown(current[1])),
      body: cleanText(body.slice(sectionStart, sectionEnd)),
    });
  }

  return sections;
}

function parseBoldSections(body) {
  const headingRegex = /^\*\*([^*\n]+)\*\*\s*$/gim;
  const matches = [...body.matchAll(headingRegex)];
  const sections = [];

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const sectionStart = current.index + current[0].length;
    const sectionEnd = next ? next.index : body.length;
    sections.push({
      heading: cleanText(stripMarkdown(current[1])),
      body: cleanText(body.slice(sectionStart, sectionEnd)),
    });
  }

  return sections;
}

function dedupeStepsByNumber(steps) {
  const seen = new Set();
  return steps.filter((step) => {
    if (seen.has(step.stepNumber)) return false;
    seen.add(step.stepNumber);
    return true;
  });
}

function defaultClose(dayNumber, dayTitle, goal) {
  return makeClose(`Day ${dayNumber} is complete.`, goal || `You reinforced ${dayTitle.toLowerCase()} today.`);
}

function makeGoalLesson(goal, title = 'Today’s focus') {
  const paragraphs = toParagraphs(goal);
  return makeLesson(title, paragraphs, highlightFromParagraphs(paragraphs));
}

function keywordWhyThisWorks(slug, title, body) {
  const haystack = `${title} ${body}`.toLowerCase();

  if (slug === 'energy_vitality') {
    if (haystack.includes('water') || haystack.includes('hydration')) {
      return 'Hydration supports blood flow and oxygen delivery, which helps the body create steadier energy.';
    }
    if (haystack.includes('sunlight')) {
      return 'Morning light anchors the circadian rhythm so daytime energy rises more naturally and nighttime sleep becomes easier.';
    }
    if (haystack.includes('screen')) {
      return 'Reducing screen exposure lowers stimulation and blue light, which helps the nervous system shift into recovery mode.';
    }
    if (haystack.includes('sleep')) {
      return 'A fixed sleep window improves overnight repair and helps the body expect energy at the same time each day.';
    }
    if (haystack.includes('breath')) {
      return 'Slow breathing reduces stress load so energy is not wasted on nervous-system overactivation.';
    }
    if (haystack.includes('fresh air') || haystack.includes('nature')) {
      return 'Time outside reduces mental tension and gives the body a clearer recovery signal.';
    }
    if (haystack.includes('strength')) {
      return 'Simple strength work activates large muscles and supports circulation, stamina, and mitochondrial demand.';
    }
    if (haystack.includes('move') || haystack.includes('walk')) {
      return 'Gentle movement improves circulation and starts building stable daytime energy without overstressing the body.';
    }
  }

  if (slug === 'male_sexual_health') {
    if (haystack.includes('hydration')) {
      return 'Hydration supports circulation, tissue recovery, and steadier physical performance.';
    }
    if (haystack.includes('night routine') || haystack.includes('sleep')) {
      return 'Better sleep supports hormone balance, recovery, and calmer nervous-system function.';
    }
    if (haystack.includes('habit') || haystack.includes('dopamine')) {
      return 'Interrupting the routine weakens the automatic link between trigger and response.';
    }
  }

  if (slug === 'age_reversal') {
    if (haystack.includes('walking')) {
      return 'Walking improves circulation and supports the recovery systems that keep skin and muscles supplied with oxygen and nutrients.';
    }
    if (haystack.includes('sleep')) {
      return 'Consistent sleep supports hormone balance, skin repair, and overnight recovery.';
    }
  }

  return undefined;
}

function buildEnergyDay(block) {
  const goal = extractGoalBeforeSteps(
    block.body,
    /^(?:##\s*)?(?:[^\p{L}\p{N}\n]*\s*)?\**Step\s+\d+/gimu
  );
  const steps = dedupeStepsByNumber(parseStepSections(block.body));
  const estimatedMinutes = clamp(
    Math.round(10 + (block.dayNumber > 21 ? 6 : block.dayNumber > 7 ? 3 : 0)),
    10,
    20
  );
  const cards = [makeIntro(block.dayNumber, block.dayTitle, goal, estimatedMinutes)];
  const goalLesson = makeGoalLesson(goal);
  if (goalLesson) cards.push(goalLesson);

  for (const step of steps) {
    const body = stripMarkdown(step.body);
    const title = step.title || deriveEnergyStepTitle(body);
    const duration = parseDurationLabel(body);

    if (/reflection/i.test(title) || /week \d+ reflection/i.test(title)) {
      const prompt = splitSentences(body)[0] ?? `What changed in your energy today?`;
      cards.push(
        makeJournal(
          prompt,
          'A short note is enough. The goal is to notice patterns, not to write perfectly.',
          `What felt easier, steadier, or more challenging today?`
        )
      );
      continue;
    }

    if (/move|strength activation/i.test(title) || /bodyweight|squats|walk/i.test(body)) {
      const exercises = parseMovementExercises(body, 'energy_vitality');
      const routine = makeExerciseRoutine(title, exercises, duration ?? inferRoutineDuration(exercises));
      if (routine) {
        cards.push(routine);
        continue;
      }
    }

    if (/deep breathing/i.test(body) && !/inhale|exhale|hold/i.test(body)) {
      const minutes = parseMinutes(body) ?? 5;
      cards.push(
        makeMindfulnessExercise(
          titleCase(title),
          unique([
            ...toInstructionLines(body),
            'Let each exhale lengthen slightly so the body can settle before sleep.',
          ]),
          `${minutes} minutes`,
          Math.round(minutes * 60),
          'Finish when the breath feels slower and the body feels less alert.'
        )
      );
      continue;
    }

    const instructions = toInstructionLines(body);
    cards.push(
      makeActionStep(
        step.stepNumber,
        titleCase(title),
        instructions,
        keywordWhyThisWorks('energy_vitality', title, body),
        /sunlight/i.test(body) ? 'Weak daylight is still useful. Stay out a little longer if the morning is cloudy.' : undefined,
        duration
      )
    );
  }

  cards.push(defaultClose(block.dayNumber, block.dayTitle, goal));
  return {
    dayNumber: block.dayNumber,
    dayTitle: block.dayTitle,
    estimatedMinutes,
    cards: cards.filter(Boolean),
  };
}

function buildSixDayDay(block) {
  const normalizedBody = normalizeSourceText(block.body).replace(/\\\*/g, '*');
  const plainBody = stripMarkdown(normalizedBody);
  const goal = cleanText((plainBody.match(/^Goal:\s*(.+)$/im)?.[1] ?? '').replace(/\\+/g, ''));
  const sections = parseBoldSections(normalizedBody).filter((section) => !/^Goal:/i.test(section.heading));
  const estimatedMinutes = clamp(10 + Math.floor((block.dayNumber - 1) / 2), 10, 15);
  const cards = [
    makeIntro(
      block.dayNumber,
      block.dayTitle,
      goal || 'Interrupt autopilot and build a steadier response to urges.',
      estimatedMinutes
    ),
  ];
  const goalLesson = makeGoalLesson(goal || 'Focus on one day, one decision, and one steady action.');
  if (goalLesson) cards.push(goalLesson);

  let stepNumber = 1;
  let reflectionBody = '';

  for (const section of sections) {
    const title = titleCase(section.heading);
    const body = stripMarkdown(section.body);
    if (!body) continue;

    if (/end of day|realization|reflection/i.test(title)) {
      reflectionBody = body;
      continue;
    }

    const instructions = toInstructionLines(body);
    const breathingPattern = parseBreathingPattern(body);

    if (breathingPattern) {
      cards.push(
        makeBreathingExercise(
          title,
          breathingPattern.inhaleSeconds,
          breathingPattern.holdSeconds,
          breathingPattern.exhaleSeconds,
          breathingPattern.cycles,
          'Let the exhale be a little longer so the body can settle before acting.'
        )
      );
      continue;
    }

    if (/urge|pause|delay|timer|observe|grounding|calm|thought|feeling|breathe/i.test(`${title} ${body}`)) {
      cards.push(
        makeMindfulnessExercise(
          title,
          instructions,
          parseDurationLabel(body),
          (() => {
            const minutes = parseMinutes(body);
            return minutes ? Math.round(minutes * 60) : undefined;
          })(),
          'Notice the wave, stay steady, and let the urge pass without rushing a response.'
        )
      );
      continue;
    }

    if (/walk|movement|stretch|squat|pushup|plank/i.test(`${title} ${body}`)) {
      const routine = makeExerciseRoutine(
        title,
        parseMovementExercises(body, 'six_day_reset'),
        parseDurationLabel(body) ?? inferRoutineDuration(parseMovementExercises(body, 'six_day_reset'))
      );
      if (routine) {
        cards.push(routine);
        continue;
      }
    }

    cards.push(
      makeActionStep(
        stepNumber,
        title,
        instructions,
        'Small interruptions in routine weaken automatic behavior and strengthen conscious choice.',
        undefined,
        parseDurationLabel(body)
      )
    );
    stepNumber += 1;
  }

  const journalPrompt = reflectionBody
    ? `What from Day ${block.dayNumber} felt most true for you?`
    : `What helped you stay steady on Day ${block.dayNumber}?`;
  cards.push(
    makeJournal(
      journalPrompt,
      'A short note is enough. We are looking for patterns, not perfect writing.',
      'Where did you notice the urge easing once you slowed down?'
    )
  );

  const closeParagraphs = toParagraphs(reflectionBody || sections[sections.length - 1]?.body || '');
  cards.push(
    makeClose(
      closeParagraphs[0] ?? `Day ${block.dayNumber} is complete.`,
      closeParagraphs[1] ?? goal ?? `You reinforced ${block.dayTitle.toLowerCase()} today.`
    )
  );

  return {
    dayNumber: block.dayNumber,
    dayTitle: block.dayTitle,
    estimatedMinutes,
    cards: cards.filter(Boolean),
  };
}

function deriveEnergyStepTitle(body) {
  const haystack = body.toLowerCase();
  if (haystack.includes('500 ml water')) return 'Morning Hydration';
  if (haystack.includes('sunlight')) return 'Morning Sunlight';
  if (haystack.includes('move')) return 'Movement Reset';
  if (haystack.includes('screen')) return 'Screen Wind-Down';
  if (haystack.includes('same time') || haystack.includes('fixed time')) return 'Consistent Sleep Time';
  if (haystack.includes('breath')) return 'Breathing Reset';
  if (haystack.includes('fresh air') || haystack.includes('nature')) return 'Fresh Air Reset';
  if (haystack.includes('strength')) return 'Strength Activation';
  return 'Energy Practice';
}

function parseMovementExercises(body, slug) {
  const lines = stripMarkdown(body).split('\n').map((line) => cleanText(line)).filter(Boolean);
  const exercises = [];

  for (const line of lines) {
    const bulletMatch = line.match(/^[-•]?\s*([^–-]+?)\s*[–-]\s*(.+)$/);
    if (bulletMatch) {
      exercises.push({
        name: titleCase(bulletMatch[1]),
        instructions: [
          slug === 'energy_vitality'
            ? 'Move with controlled form and steady breathing.'
            : 'Use smooth, controlled movement and stay relaxed.',
        ],
        ...(parseDurationLabel(bulletMatch[2]) ? { duration: parseDurationLabel(bulletMatch[2]) } : {}),
        ...(!parseDurationLabel(bulletMatch[2]) ? { reps: cleanText(bulletMatch[2]) } : {}),
      });
      continue;
    }

    if (/walk|jog|squat|pushup|plank|stretch/i.test(line) && !/^step \d+/i.test(line)) {
      exercises.push({
        name: titleCase(line),
        instructions: ['Perform the movement with steady breathing and controlled form.'],
      });
    }
  }

  return exercises;
}

function inferRoutineDuration(exercises) {
  const minuteValues = exercises
    .map((exercise) => parseMinutes(exercise.duration ?? exercise.reps ?? ''))
    .filter((value) => typeof value === 'number');

  if (minuteValues.length === 0) return undefined;
  return `${Math.round(minuteValues.reduce((sum, value) => sum + value, 0))} minutes`;
}

function parseBreathingPattern(body) {
  const inhale = body.match(/Inhale\s*[→:-]?\s*(\d+)\s*seconds?/i);
  const hold = body.match(/Hold\s*[→:-]?\s*(\d+)\s*seconds?/i);
  const exhale = body.match(/Exhale\s*[→:-]?\s*(\d+)\s*seconds?/i);
  const cycles = body.match(/Repeat(?: this cycle)?\s*(\d+)\s*(?:times|cycles)/i);

  if (!inhale || !exhale || !cycles) return null;

  return {
    inhaleSeconds: Number(inhale[1]),
    holdSeconds: hold ? Number(hold[1]) : undefined,
    exhaleSeconds: Number(exhale[1]),
    cycles: Number(cycles[1]),
  };
}

function parseMaleExerciseRoutine(body, title) {
  const cleaned = stripMarkdown(body)
    .replace(/\nRoutine:\n/g, '\nRoutine:\n')
    .replace(/\nMovement:\n/g, '\nMovement:\n');
  const headingRegex = /(^|\n)([A-Za-z /&]+?)\s+[—–-]\s+([A-Za-z0-9 /&()]+)\n/g;
  const matches = [...cleaned.matchAll(headingRegex)];
  const exercises = [];

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const sectionStart = current.index + current[0].length;
    const sectionEnd = next ? next.index : cleaned.length;
    const sectionBody = cleanText(cleaned.slice(sectionStart, sectionEnd));
    const name = `${cleanText(current[2])} - ${cleanText(current[3])}`;
    const instructions = [];

    for (const line of sectionBody.split('\n')) {
      const normalized = cleanText(line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));
      if (!normalized) continue;
      if (/^routine:?$/i.test(normalized) || /^movement:?$/i.test(normalized) || /^purpose:?$/i.test(normalized)) {
        continue;
      }
      if (/^rest\s+\d+/i.test(normalized)) continue;
      instructions.push(normalized);
    }

    const repsMatch = sectionBody.match(/(\d+\s*(?:[–-]\s*\d+)?\s*reps?\s*x\s*\d+\s*sets?)/i);
    const durationMatch = sectionBody.match(/(\d+\s*(?:[–-]\s*\d+)?\s*minute\s*(?:brisk walk|walk|jog)?)/i);
    const restMatch = sectionBody.match(/Rest\s+(\d+\s*(?:[–-]\s*\d+)?\s*seconds?)/i);
    exercises.push({
      name,
      instructions: unique(instructions),
      ...(repsMatch ? { reps: cleanText(repsMatch[1]) } : {}),
      ...(durationMatch ? { duration: cleanText(durationMatch[1]) } : {}),
      ...(restMatch ? { rest: cleanText(restMatch[1]) } : {}),
    });
  }

  return makeExerciseRoutine(title, exercises, parseDurationLabel(body));
}

function buildMaleDay(block) {
  const goal = extractGoalBeforeSteps(
    block.body,
    /^(?:##\s*)?(?:[^\p{L}\p{N}\n]*\s*)?\**Step\s+\d+/gimu
  );
  const steps = dedupeStepsByNumber(parseStepSections(block.body));
  const titleMinuteMatch = block.body.match(/(\d+)\s*Minute/i);
  const estimatedMinutes = clamp(Number(titleMinuteMatch?.[1] ?? 16), 12, 28);
  const cards = [makeIntro(block.dayNumber, block.dayTitle, goal, estimatedMinutes)];
  const goalLesson = makeGoalLesson(goal, 'Why today matters');
  if (goalLesson) cards.push(goalLesson);

  for (const step of steps) {
    const title = titleCase(step.title || 'Practice');
    const body = stripMarkdown(step.body);

    if (/calm|urge control/i.test(title) || /tap the calm option/i.test(body)) {
      cards.push(
        makeCalmTrigger(
          splitSentences(body)[0] ??
            'Use CALM to slow the urge, delay the reaction, and reset the body before acting.'
        )
      );
      continue;
    }

    const breathingPattern = parseBreathingPattern(body);
    if (breathingPattern) {
      cards.push(
        makeBreathingExercise(
          title,
          breathingPattern.inhaleSeconds,
          breathingPattern.holdSeconds,
          breathingPattern.exhaleSeconds,
          breathingPattern.cycles,
          'Keep the shoulders soft and let the exhale do most of the calming work.'
        )
      );
      continue;
    }

    if (/routine|exercise/i.test(title) || /Pelvic Strength|Bodyweight Squats|Brisk Walk/i.test(body)) {
      const routine = parseMaleExerciseRoutine(body, title);
      if (routine) {
        cards.push(routine);
        continue;
      }
    }

    if (/reflection/i.test(title)) {
      cards.push(
        makeJournal(
          splitSentences(body)[0] ?? 'What have you noticed about your control or confidence this week?',
          'A few honest lines are enough.',
          'What felt steadier today than it did a week ago?'
        )
      );
      continue;
    }

    if (/mind|confidence|focus/i.test(title) && /slow breath|sit comfortably|focus on this thought/i.test(body)) {
      const duration = parseDurationLabel(body) ?? '2 minutes';
      const timerSeconds = Math.round((parseMinutes(duration) ?? 2) * 60);
      cards.push(
        makeMindfulnessExercise(
          title,
          toInstructionLines(body),
          duration,
          timerSeconds,
          'Finish when the body feels less reactive and the mind feels steadier.'
        )
      );
      continue;
    }

    cards.push(
      makeActionStep(
        step.stepNumber,
        title,
        toInstructionLines(body),
        keywordWhyThisWorks('male_sexual_health', title, body),
        undefined,
        parseDurationLabel(body)
      )
    );
  }

  cards.push(defaultClose(block.dayNumber, block.dayTitle, goal));
  return {
    dayNumber: block.dayNumber,
    dayTitle: block.dayTitle,
    estimatedMinutes,
    cards: cards.filter(Boolean),
  };
}

function parseAgeExercise(step) {
  const body = stripMarkdown(step.body);
  const repetitionsMatch = body.match(/(\d+\s*repetitions?\s*(?:per set)?(?:\s*-\s*\d+\s*sets?\s*total)?)/i);
  const setsMatch = body.match(/Sets:\s*(\d+)\s*sets?/i);
  const durationValue = parseMinutes(body);
  const totalDuration =
    durationValue && durationValue <= 12 ? `${Math.round(durationValue)} minutes` : '5-8 minutes';
  const instructionStart = body.match(/Steps:\s*([\s\S]*?)(?:Repetitions:|Benefits:|$)/i);
  const instructions = toInstructionLines(instructionStart?.[1] ?? body).filter(
    (line) => !/^Duration:|^Sets:/i.test(line)
  );

  return makeExerciseRoutine(
    titleCase(step.title || 'Face Exercise'),
    [
      {
        name: titleCase(step.title.replace(/^Face Exercise\s*\d*\s*\(?|\)$/g, '') || 'Face Exercise'),
        instructions,
        ...(repetitionsMatch ? { reps: cleanText(repetitionsMatch[1].replace(/\s+/g, ' ')) } : {}),
        ...(setsMatch && Number(setsMatch[1]) <= 5 ? { rest: `${setsMatch[1]} sets` } : {}),
      },
    ],
    totalDuration
  );
}

function buildAgeDay(block) {
  const goal = extractGoalBeforeSteps(
    block.body,
    /^(?:##\s*)?(?:[^\p{L}\p{N}\n]*\s*)?\**Step\s+\d+/gimu
  );
  const steps = dedupeStepsByNumber(parseStepSections(block.body));
  const estimatedMinutes = clamp(8 + Math.floor((block.dayNumber - 1) / 15), 8, 12);
  const cards = [makeIntro(block.dayNumber, block.dayTitle, goal, estimatedMinutes)];
  const goalLesson = makeGoalLesson(goal, 'Rejuvenation focus');
  if (goalLesson) cards.push(goalLesson);

  for (const step of steps) {
    const title = titleCase(step.title || 'Practice');
    const body = stripMarkdown(step.body);

    if (/calm/i.test(title) || /calm button/i.test(body)) {
      cards.push(
        makeCalmTrigger(
          'Use CALM to lower stress, settle the nervous system, and reinforce the recovery signal for the body.'
        )
      );
      continue;
    }

    if (/walking/i.test(title)) {
      cards.push(
        makeActionStep(
          step.stepNumber,
          title,
          toInstructionLines(body),
          keywordWhyThisWorks('age_reversal', title, body),
          undefined,
          '20 minutes'
        )
      );
      continue;
    }

    if (/face exercise/i.test(title)) {
      const routine = parseAgeExercise(step);
      if (routine) {
        cards.push(routine);
        continue;
      }
    }

    cards.push(
      makeActionStep(
        step.stepNumber,
        title,
        toInstructionLines(body),
        keywordWhyThisWorks('age_reversal', title, body),
        undefined,
        parseDurationLabel(body)
      )
    );
  }

  cards.push(defaultClose(block.dayNumber, block.dayTitle, goal));
  return {
    dayNumber: block.dayNumber,
    dayTitle: block.dayTitle,
    estimatedMinutes,
    cards: cards.filter(Boolean),
  };
}

function parseNinetyDaySummaries(text) {
  const summaryRegex =
    /\*\*Day\s+(\d+)\s+[–-]\s+(.+?)\*\*[\s\S]*?\*\*Focus:\*\*\s+(.+?)\s+\*\*Exercise:\*\*\s+(.+?)\s+\*\*Journal:\*\*\s+[“"](.+?)[”"]\s+\*\*Close:\*\*\s+[“"](.+?)[”"]/gi;
  const summaries = new Map();

  for (const match of text.matchAll(summaryRegex)) {
    summaries.set(Number(match[1]), {
      dayNumber: Number(match[1]),
      dayTitle: titleCase(stripMarkdown(match[2])),
      focus: cleanText(stripMarkdown(match[3])),
      exercise: cleanText(stripMarkdown(match[4])),
      journal: cleanText(stripMarkdown(match[5])),
      close: cleanText(stripMarkdown(match[6])),
    });
  }

  return summaries;
}

function parseNinetyDayDetails(text) {
  const detailBlocks = parseDayBlocks(
    text,
    /^(?:(?:#{1,3}\s*)|\*\*)DAY\s+(\d+)\s+[–-]\s+(.+?)(?:\*\*)?$/gim
  );
  const details = new Map();

  for (const block of detailBlocks) {
    const screenRegex = /^##\s*SCREEN\s+\d+:\s+(.+)$/gim;
    const screens = [];
    const matches = [...block.body.matchAll(screenRegex)];

    for (let index = 0; index < matches.length; index += 1) {
      const current = matches[index];
      const next = matches[index + 1];
      const sectionStart = current.index + current[0].length;
      const sectionEnd = next ? next.index : block.body.length;
      screens.push({
        heading: titleCase(stripMarkdown(current[1])),
        body: cleanText(block.body.slice(sectionStart, sectionEnd)),
      });
    }

    const header = cleanText(matches.length > 0 ? block.body.slice(0, matches[0].index) : block.body);
    details.set(block.dayNumber, {
      dayNumber: block.dayNumber,
      dayTitle: block.dayTitle,
      header,
      screens,
    });
  }

  return details;
}

function buildNinetyDaySummaryOnlyDay(summary, program) {
  const estimatedMinutes = 8;
  const practiceCard = buildNinetyDayActionCard(summary.exercise, 1, 'Today’s Practice');
  return {
    dayNumber: summary.dayNumber,
    dayTitle: summary.dayTitle,
    estimatedMinutes,
    cards: [
      makeIntro(summary.dayNumber, summary.dayTitle, summary.focus, estimatedMinutes),
      makeLesson('Daily Focus', toParagraphs(summary.focus), summary.focus),
      practiceCard,
      makeAudioCard(
        'Guided Meditation',
        `A daily guided meditation that supports ${summary.dayTitle.toLowerCase()}.`,
        program.audioTemplate.replace('{day}', String(summary.dayNumber)),
        program.durationSeconds
      ),
      makeLesson(
        'What to remember',
        toParagraphs(summary.focus, summary.close),
        highlightFromParagraphs(toParagraphs(summary.focus))
      ),
      makeJournal(
        summary.journal,
        'A few honest words are enough if you want to capture the moment.',
        summary.focus ? `Where did you notice ${summary.focus.toLowerCase()} most clearly?` : undefined
      ),
      makeClose(summary.close, `Today’s focus: ${summary.focus}`),
    ].filter(Boolean),
  };
}

function parseHeaderLabels(text) {
  const normalized = stripMarkdown(text).replace(/\n+/g, ' ');
  const labelRegex = /(Focus|Core Skill|Goal|Total time|Tone):\s*([\s\S]*?)(?=(?:Focus|Core Skill|Goal|Total time|Tone):|$)/gi;
  const fields = {};

  for (const match of normalized.matchAll(labelRegex)) {
    fields[match[1].toLowerCase().replace(/\s+/g, '_')] = cleanText(match[2]);
  }

  return fields;
}

function parseNinetyDayScreen(screen) {
  const labels = [
    'Screen title',
    'Main copy (exact)',
    'Main copy',
    'Instruction text (above audio player)',
    'Instruction text (above audio)',
    'Instruction text',
    'Prompt (exact)',
    'Prompt',
    'Primary prompt (exact)',
    'Primary prompt',
    'Helper text (small, below prompt)',
    'Helper text (small)',
    'Helper text',
    'Secondary text (small)',
    'Secondary text',
    'Optional follow-ups (collapsed)',
    'Why this screen matters',
    'CTA buttons',
    'CTA button',
    'CTA',
    'Audio controls',
    'Input options',
    'UX notes',
    'AUDIO SCRIPT (Word-for-Word)',
    'AUDIO SCRIPT (Word-for-Word, ~2 minutes)',
    'AUDIO SCRIPT (Word-for-Word, ~3 minutes)',
    'AUDIO SCRIPT (Word-for-Word, ~4 minutes)',
    'AUDIO SCRIPT (Word-for-Word, ~5 minutes)',
  ];

  const fields = extractFieldMap(screen.body, labels);
  const screenTitle =
    readField(fields, 'Screen title') ||
    readField(fields, 'Screen title') ||
    screen.heading;
  const mainCopy =
    readField(fields, 'Main copy (exact)') || readField(fields, 'Main copy') || readField(fields, 'body');
  const instruction =
    readField(fields, 'Instruction text (above audio player)') ||
    readField(fields, 'Instruction text (above audio)') ||
    readField(fields, 'Instruction text');
  const prompt =
    readField(fields, 'Primary prompt (exact)') ||
    readField(fields, 'Primary prompt') ||
    readField(fields, 'Prompt (exact)') ||
    readField(fields, 'Prompt');
  const helperText =
    readField(fields, 'Helper text (small, below prompt)') ||
    readField(fields, 'Helper text (small)') ||
    readField(fields, 'Helper text');
  const secondaryText =
    readField(fields, 'Secondary text (small)') || readField(fields, 'Secondary text');

  return {
    screenTitle: titleCase(screenTitle),
    mainCopy,
    instruction,
    prompt,
    helperText,
    secondaryText,
    followUps: listField(fields, 'Optional follow-ups (collapsed)'),
    whyMatters: listField(fields, 'Why this screen matters'),
    audioScript:
      readField(fields, 'AUDIO SCRIPT (Word-for-Word)') ||
      readField(fields, 'AUDIO SCRIPT (Word-for-Word, ~2 minutes)') ||
      readField(fields, 'AUDIO SCRIPT (Word-for-Word, ~3 minutes)') ||
      readField(fields, 'AUDIO SCRIPT (Word-for-Word, ~4 minutes)') ||
      readField(fields, 'AUDIO SCRIPT (Word-for-Word, ~5 minutes)'),
    raw: stripMarkdown(screen.body),
  };
}

function buildNinetyDayActionCard(text, stepNumber, title) {
  const cleaned = stripMarkdown(text);
  const pattern = parseBreathingPattern(cleaned);
  if (pattern) {
    return makeBreathingExercise(
      title,
      pattern.inhaleSeconds,
      pattern.holdSeconds,
      pattern.exhaleSeconds,
      pattern.cycles,
      'Use the breath to interrupt urgency without forcing the moment.'
    );
  }

  if (/notice|observe|watch|pause|allow|soften|return/i.test(cleaned)) {
    return makeMindfulnessExercise(
      title,
      toInstructionLines(cleaned),
      parseDurationLabel(cleaned),
      (() => {
        const minutes = parseMinutes(cleaned);
        return minutes ? Math.round(minutes * 60) : undefined;
      })(),
      'The aim is not to force change. The aim is to notice what happens with more space.'
    );
  }

  return makeActionStep(stepNumber, title, toInstructionLines(cleaned), undefined, undefined, parseDurationLabel(cleaned));
}

function buildNinetyDayDay(detail, summary, program) {
  const headerFields = parseHeaderLabels(detail.header);
  const goal =
    headerFields.goal ||
    summary?.focus ||
    'Create a little more space between the urge and the next action.';
  const estimatedMinutes = clamp(
    Math.round(parseMinutes(headerFields.total_time ?? '') ?? 8),
    6,
    12
  );
  const cards = [makeIntro(detail.dayNumber, detail.dayTitle, goal, estimatedMinutes)];
  let actionStepNumber = 1;
  let hasJournal = false;
  let hasClose = false;
  let hasAudio = false;

  for (const screen of detail.screens) {
    const parsed = parseNinetyDayScreen(screen);
    const heading = screen.heading.toLowerCase();
    const title = parsed.screenTitle || screen.heading;

    if (/background logic|safety|design principle|core message/i.test(heading)) {
      continue;
    }

    if (/day intro/i.test(heading)) {
      const lesson = makeLesson(
        title,
        toParagraphs(parsed.mainCopy),
        highlightFromParagraphs(toParagraphs(parsed.mainCopy))
      );
      if (lesson) cards.push(lesson);
      continue;
    }

    if (/guided audio/i.test(heading) || parsed.audioScript) {
      cards.push(
        makeAudioCard(
          title,
          parsed.instruction || highlightFromParagraphs(toParagraphs(parsed.mainCopy, goal)) || summary?.focus,
          program.audioTemplate.replace('{day}', String(detail.dayNumber)),
          program.durationSeconds
        )
      );
      hasAudio = true;
      continue;
    }

    if (/journal|reflection/i.test(heading) || parsed.prompt) {
      cards.push(
        makeJournal(
          parsed.prompt || summary?.journal || `What stood out about ${detail.dayTitle.toLowerCase()} today?`,
          parsed.helperText || 'A few honest words are enough.',
          parsed.followUps.length > 0 ? parsed.followUps.join(' ') : undefined
        )
      );
      hasJournal = true;
      continue;
    }

    if (/close/i.test(heading)) {
      const mainParagraphs = toParagraphs(parsed.mainCopy);
      cards.push(
        makeClose(
          mainParagraphs[0] ?? summary?.close ?? `That is enough for today.`,
          parsed.secondaryText || mainParagraphs[1] || summary?.close
        )
      );
      hasClose = true;
      continue;
    }

    if (/calm/i.test(heading) || /\bCALM\b/.test(parsed.raw)) {
      cards.push(
        makeCalmTrigger(
          parsed.mainCopy || parsed.instruction || 'Use CALM when the moment feels too charged to navigate alone.'
        )
      );
      continue;
    }

    if (/practice|guidance|observation|pause|reframing|what to notice/i.test(heading)) {
      const proceduralCard = buildNinetyDayActionCard(
        parsed.mainCopy || parsed.instruction || parsed.raw,
        actionStepNumber,
        title
      );
      if (proceduralCard?.type === 'action_step') {
        actionStepNumber += 1;
      }
      cards.push(proceduralCard);
      continue;
    }

    const lesson = makeLesson(
      title,
      toParagraphs(parsed.mainCopy || parsed.raw),
      parsed.whyMatters[0] ?? highlightFromParagraphs(toParagraphs(parsed.mainCopy || parsed.raw))
    );
    if (lesson) cards.push(lesson);
  }

  if (!cards.some((card) => card.type === 'lesson') && summary?.focus) {
    cards.splice(1, 0, makeLesson('Daily Focus', toParagraphs(summary.focus), summary.focus));
  }

  if (!hasJournal) {
    cards.splice(
      Math.max(cards.length - 1, 1),
      0,
      makeJournal(
        summary?.journal ?? `What did you notice about ${detail.dayTitle.toLowerCase()} today?`,
        'Keep it brief if you want. The goal is noticing, not performing.',
        summary?.focus ? `Where did you notice ${summary.focus.toLowerCase()} most clearly?` : undefined
      )
    );
  }

  if (summary?.exercise && cards.length < 7) {
    const card = buildNinetyDayActionCard(summary.exercise, actionStepNumber, 'Today’s Practice');
    cards.splice(Math.max(cards.length - 1, 1), 0, card);
  }

  if (!hasClose) {
    cards.push(
      makeClose(
        summary?.close || 'That is enough for today.',
        headerFields.core_skill ? `Today’s skill: ${headerFields.core_skill}.` : goal
      )
    );
  }

  const existingCloseIndex = cards.findIndex((card) => card.type === 'close');
  if (existingCloseIndex === -1) {
    cards.push(
      makeClose(
        summary?.close || 'That is enough for today.',
        headerFields.core_skill ? `Today’s skill: ${headerFields.core_skill}.` : goal
      )
    );
  } else if (existingCloseIndex !== cards.length - 1) {
    const [closeCard] = cards.splice(existingCloseIndex, 1);
    cards.push(closeCard);
  }

  const closeCard = cards[cards.length - 1];
  const insertBeforeClose = (card) => {
    if (!card) return;
    cards.splice(cards.length - 1, 0, card);
  };

  if (!hasAudio) {
    insertBeforeClose(
      makeAudioCard(
        'Guided Meditation',
        summary?.focus || goal,
        program.audioTemplate.replace('{day}', String(detail.dayNumber)),
        program.durationSeconds
      )
    );
  }

  if (cards.length < 7 && summary?.focus && !cards.some((card) => card.title === 'Daily Focus')) {
    insertBeforeClose(makeLesson('Daily Focus', toParagraphs(summary.focus), summary.focus));
  }

  if (cards.length < 7 && summary?.exercise && !cards.some((card) => card.title === 'Today’s Practice')) {
    insertBeforeClose(buildNinetyDayActionCard(summary.exercise, actionStepNumber, 'Today’s Practice'));
  }

  if (cards.length < 7 && headerFields.core_skill) {
    insertBeforeClose(
      makeLesson(
        'Core Skill',
        toParagraphs(
          `${headerFields.core_skill}.`,
          summary?.focus ? `Today’s focus: ${summary.focus}.` : ''
        ),
        headerFields.core_skill
      )
    );
  }

  if (cards.length < 7 && summary?.close) {
    insertBeforeClose(
      makeLesson('Gentle Reminder', toParagraphs(summary.close), summary.close)
    );
  }

  if (cards.length < 7) {
    insertBeforeClose(
      makeActionStep(
        actionStepNumber,
        'Gentle Practice',
        toInstructionLines(
          summary?.exercise ||
            'Pause for one minute. Notice your breath. Let the moment be enough without trying to force a result.'
        )
      )
    );
  }

  if (cards.length < 7) {
    insertBeforeClose(
      makeLesson(
        'Why This Matters',
        toParagraphs(goal, summary?.focus || '', summary?.close || ''),
        summary?.focus || goal
      )
    );
  }

  cards[cards.length - 1] = closeCard;

  return {
    dayNumber: detail.dayNumber,
    dayTitle: detail.dayTitle,
    estimatedMinutes,
    cards: cards.filter(Boolean),
  };
}

function validateProgram(program, days, notes, sourceDayNumbers) {
  const dayNumbers = days.map((day) => day.dayNumber).sort((left, right) => left - right);
  const missingWithinSeed = contiguousMissing(sourceDayNumbers);
  const missingFromCatalog = [];
  const unbuiltSourceDays = sourceDayNumbers.filter((day) => !dayNumbers.includes(day));

  for (let day = 1; day <= program.totalDays; day += 1) {
    if (!sourceDayNumbers.includes(day)) missingFromCatalog.push(day);
  }

  if (unbuiltSourceDays.length > 0) {
    throw new Error(`${program.slug}: failed to build source days ${unbuiltSourceDays.join(', ')}`);
  }

  if (missingWithinSeed.length > 0) {
    notes.push(`Missing source days not seeded: ${missingWithinSeed.join(', ')}`);
  }

  if (missingFromCatalog.length > 0) {
    notes.push(`Program catalog days absent from source: ${missingFromCatalog.join(', ')}`);
  }

  for (const day of days) {
    if (day.cards[0]?.type !== 'intro') {
      throw new Error(`${program.slug} day ${day.dayNumber}: first card is not intro`);
    }
    if (day.cards[day.cards.length - 1]?.type !== 'close') {
      throw new Error(
        `${program.slug} day ${day.dayNumber}: last card is not close (${day.cards
          .map((card) => card.type)
          .join(', ')})`
      );
    }
    let consecutiveLessons = 0;
    for (const card of day.cards) {
      if (card.type === 'lesson') {
        consecutiveLessons += 1;
        if (consecutiveLessons > 4) {
          throw new Error(`${program.slug} day ${day.dayNumber}: too many lesson cards in a row`);
        }
      } else {
        consecutiveLessons = 0;
      }

      if (card.type === 'action_step' && (!Array.isArray(card.instructions) || card.instructions.length === 0)) {
        throw new Error(`${program.slug} day ${day.dayNumber}: action step missing instructions`);
      }
      if (
        card.type === 'breathing_exercise' &&
        (!card.pattern || typeof card.pattern.inhaleSeconds !== 'number' || typeof card.pattern.exhaleSeconds !== 'number')
      ) {
        throw new Error(`${program.slug} day ${day.dayNumber}: breathing exercise missing pattern`);
      }
    }

    JSON.parse(JSON.stringify(day.cards));
  }

  const sample = pickRandomSample(
    days,
    3,
    [...program.slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) + 20260321
  );
  return {
    missingFromCatalog,
    sample,
  };
}

function summarizeSample(program, sample) {
  const lines = [`[spot-check] ${program.slug}`];
  for (const day of sample) {
    lines.push(
      `  day ${day.dayNumber}: ${day.cards.length} cards | ${day.cards
        .map((card) => card.type)
        .join(', ')}`
    );
  }
  return lines.join('\n');
}

function parseProgram(program, content) {
  if (program.parser === 'six_day') {
    const source = normalizeSourceText(content);
    const boldBlocks = parseDayBlocks(source, /^\*\*Day\s+(\d+)\s*[—–-]\s*(.+?)\*\*$/gim);
    const blocks =
      boldBlocks.length > 0
        ? boldBlocks
        : parseDayBlocks(source, /^(?:##\s*)?DAY\s+(\d+)\s*[—–-]\s*(.+)$/gim);
    return {
      days: blocks.map(buildSixDayDay),
      notes: [],
      sourceDayNumbers: blocks.map((block) => block.dayNumber),
    };
  }

  if (program.parser === 'energy') {
    const source = normalizeSourceText(content);
    const blocks = parseDayBlocks(source, /\*\*Day\s+(\d+)\s*[—–-]\s*(.+?)\*\*/gim);
    return {
      days: blocks.map(buildEnergyDay),
      notes: [],
      sourceDayNumbers: blocks.map((block) => block.dayNumber),
    };
  }

  if (program.parser === 'male') {
    const source = normalizeMaleSource(content);
    const blocks = parseDayBlocks(source, /^Day\s+(\d+)\s*[—–-]\s*(.+)$/gim);
    return {
      days: blocks.map(buildMaleDay),
      notes: [],
      sourceDayNumbers: blocks.map((block) => block.dayNumber),
    };
  }

  if (program.parser === 'age') {
    const source = normalizeAgeSource(content);
    const allBlocks = parseDayBlocks(source, /^(?:##\s*)?Day\s+(\d+)\s*[—–-]\s*(.+)$/gim);
    const seenDays = new Set();
    const duplicates = [];
    const blocks = allBlocks.filter((block) => {
      if (seenDays.has(block.dayNumber)) {
        duplicates.push(block.dayNumber);
        return false;
      }
      seenDays.add(block.dayNumber);
      return true;
    });
    return {
      days: blocks.map(buildAgeDay),
      notes: duplicates.length > 0 ? [`Ignored duplicate source headings for days: ${duplicates.join(', ')}`] : [],
      sourceDayNumbers: blocks.map((block) => block.dayNumber),
    };
  }

  if (program.parser === 'ninety_day') {
    const source = normalizeSourceText(content);
    const summaries = parseNinetyDaySummaries(source);
    const details = parseNinetyDayDetails(source);
    const dayNumbers = unique([...summaries.keys(), ...details.keys()]).sort((left, right) => left - right);
    return {
      days: dayNumbers.map((dayNumber) => {
        const detail = details.get(dayNumber);
        const summary = summaries.get(dayNumber);
        return detail
          ? buildNinetyDayDay(detail, summary, program)
          : buildNinetyDaySummaryOnlyDay(summary, program);
      }),
      notes: [],
      sourceDayNumbers: dayNumbers,
    };
  }

  throw new Error(`Unknown parser: ${program.parser}`);
}

function parseArgs(argv) {
  const options = {
    listOnly: false,
    programSlug: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--list') {
      options.listOnly = true;
      continue;
    }
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

function sortSmallestToBiggest(programs) {
  return [...programs].sort((left, right) => {
    if (left.totalDays !== right.totalDays) {
      return left.totalDays - right.totalDays;
    }
    return left.slug.localeCompare(right.slug);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const programsBySlug = new Map(PROGRAMS.map((program) => [program.slug, program]));
  if (options.listOnly) {
    for (const program of sortSmallestToBiggest(PROGRAMS)) {
      console.log(`${program.slug} (${program.totalDays} days)`);
    }
    return;
  }

  const selectedPrograms = options.programSlug
    ? (() => {
        const selected = programsBySlug.get(options.programSlug);
        if (!selected) {
          throw new Error(
            `Unknown program slug "${options.programSlug}". Use --list to see available options.`
          );
        }
        return [selected];
      })()
    : sortSmallestToBiggest(PROGRAMS);

  await mkdir(outputDir, { recursive: true });

  console.log(
    `[seed-order] ${selectedPrograms.map((program) => `${program.slug}(${program.totalDays})`).join(' -> ')}`
  );

  for (const program of selectedPrograms) {
    const raw = await readFile(program.sourcePath, 'utf8');
    const { days, notes, sourceDayNumbers } = parseProgram(program, raw);
    const validation = validateProgram(program, days, notes, sourceDayNumbers);
    const sql = makeSeedSql(program, days, notes);
    const outputPath = path.join(outputDir, program.outputFile);
    await writeFile(outputPath, sql);

    console.log(
      `[generated] ${program.slug}: ${days.length} day rows -> ${path.relative(repoRoot, outputPath)}`
    );
    console.log(summarizeSample(program, validation.sample));
    if (validation.missingFromCatalog.length > 0) {
      console.log(
        `[warning] ${program.slug}: missing source days ${validation.missingFromCatalog.join(', ')}`
      );
    }
    for (const note of notes) {
      console.log(`[note] ${program.slug}: ${note}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
