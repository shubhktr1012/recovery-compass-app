import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { canonicalDir, cleanText, repoRoot, validateCanonicalProgram } from './lib/canonical-content.mjs';

const SOURCE_FILES = {
  six_day_reset: path.join(
    repoRoot,
    'documents',
    'Sent By Anjan',
    'program_content',
    '🧭 RECOVERY COMPASS 6 DAYS PROGRAM.md'
  ),
  energy_vitality: path.join(
    repoRoot,
    'documents',
    'Sent By Anjan',
    'program_content',
    'Energy reset program 14 days.md'
  ),
  sleep_disorder_reset: path.join(
    repoRoot,
    'documents',
    'Sent By Anjan',
    'program_content',
    'sleep disorder 21 days reset .md'
  ),
  male_sexual_health: path.join(
    repoRoot,
    'documents',
    'Sent By Anjan',
    'program_content',
    'men sexual health 30 days.md'
  ),
  age_reversal: path.join(
    repoRoot,
    'documents',
    'Sent By Anjan',
    'program_content',
    'female age reversal program  90 days.md'
  ),
  ninety_day_transform: path.join(
    repoRoot,
    'documents',
    'Sent By Anjan',
    'program_content',
    '🧭 RECOVERY COMPASS 90-days Program.md'
  ),
};

const SUPPLEMENT_FILES = {
  ninety_day_transform: path.join(
    repoRoot,
    'documents',
    'Sent By Anjan',
    'program_content',
    'meditation script 90days file.md'
  ),
};

const PROGRAM_TOTAL_DAYS = {
  six_day_reset: 6,
  energy_vitality: 14,
  sleep_disorder_reset: 21,
  male_sexual_health: 30,
  age_reversal: 90,
  ninety_day_transform: 90,
};

function stripMarkdown(value = '') {
  return cleanText(
    String(value)
      .replace(/\r/g, '')
      .replace(/\uFEFF/g, '')
      .replace(/\*\*/g, '')
      .replace(/```/g, '')
      .replace(/\\\*/g, '*')
      .replace(/^>\s?/gm, '')
      .replace(/^\s*[-*]\s+/gm, '')
      .replace(/^#{1,6}\s*/gm, '')
  );
}

function normalizeSourceText(value = '') {
  return cleanText(
    String(value)
      .replace(/\r/g, '')
      .replace(/\uFEFF/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/([^\n])\s+Day\s+(\d+\s*[—–-]\s*)/g, '$1\nDay $2')
      .replace(/([^\n])\s+Step\s+(\d+\s*[—–-]\s*)/g, '$1\nStep $2')
  );
}

function titleCase(value = '') {
  return cleanText(value)
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

const LOWERCASE_TITLE_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'up',
  'with',
]);

function smartTitleCase(value = '') {
  const words = cleanText(value).toLowerCase().split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      const plainWord = word.replace(/[^a-z0-9']/gi, '');
      if (
        index > 0 &&
        index < words.length - 1 &&
        LOWERCASE_TITLE_WORDS.has(plainWord)
      ) {
        return word;
      }

      return word ? word[0].toUpperCase() + word.slice(1) : word;
    })
    .join(' ');
}

function normalizeDayTitle(rawTitle = '', dayNumber = 1) {
  let dayTitle = cleanText(stripMarkdown(rawTitle))
    .replace(/\s+/g, ' ')
    .replace(/\s+goal(?:\s+of\s+today)?\s*$/i, '')
    .replace(/^day\s+\d+\s*[—–:-]\s*/i, '')
    .trim();

  if (!dayTitle) return `Day ${dayNumber}`;

  const lettersOnly = dayTitle.replace(/[^A-Za-z]/g, '');
  const isAllCaps = lettersOnly.length > 0 && dayTitle === dayTitle.toUpperCase();
  if (isAllCaps) {
    dayTitle = smartTitleCase(dayTitle);
  }

  return dayTitle;
}

function normalizeContentLine(value = '') {
  const normalized = cleanText(stripMarkdown(value))
    .replace(/([^\s(])\(/g, '$1 (')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';
  if (/^[*_=~#-]{3,}$/.test(normalized)) return '';
  if (/^the end$/i.test(normalized)) return '';
  if (/^(steps?|routine|benefits?|purpose|options?|optional|how to do it(?: properly)?|pro tip|goal(?: of today)?|today'?s goal)\s*:?\s*$/i.test(normalized)) {
    return '';
  }
  if (/^repeat\s+\d+\s+times?\.?$/i.test(normalized)) return normalized;
  if (/^\*+.*\*+$/.test(normalized)) {
    const stripped = normalized.replace(/^\*+|\*+$/g, '').trim();
    if (!stripped || /^the end$/i.test(stripped)) return '';
    return stripped;
  }

  return normalized;
}

function splitParagraphLines(value = '') {
  return String(value)
    .split('\n')
    .map((line) => normalizeContentLine(line))
    .filter(Boolean);
}

function stripCrossDayNarration(value = '') {
  return cleanText(
    String(value).replace(/\n?\s*Absolutely\.\s+Below\s+is\s+(?:\*\*)?DAY\s+\d+[\s\S]*$/i, '')
  );
}

function parseDayBlocksFromBoldHeadings(sourceText) {
  const dayHeadingRegex = /^\*\*Day\s+(\d+)\s*[—–-]\s*(.+?)\*\*\s*$/gim;
  const matches = [...sourceText.matchAll(dayHeadingRegex)];
  const blocks = [];

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const dayNumber = Number(current[1]);
    const dayTitle = normalizeDayTitle(current[2], dayNumber);
    const bodyStart = current.index + current[0].length;
    const bodyEnd = next ? next.index : sourceText.length;
    blocks.push({
      dayNumber,
      dayTitle,
      body: stripCrossDayNarration(sourceText.slice(bodyStart, bodyEnd)),
    });
  }

  return blocks;
}

function parseDayBlocksGeneric(rawText) {
  const sourceText = normalizeSourceText(rawText);
  const dayHeadingRegex = /^(?:\s*(?:\*\*|#{1,6}\s*)?)\s*Day\s+(\d+)\s*[—–:-]\s*(.+?)\s*(?:\*\*)?\s*$/gim;
  const matches = [...sourceText.matchAll(dayHeadingRegex)];

  const uniqueMatches = [];
  const seen = new Set();
  for (const match of matches) {
    const dayNumber = Number(match[1]);
    if (!Number.isInteger(dayNumber) || dayNumber <= 0) continue;
    if (seen.has(dayNumber)) continue;
    seen.add(dayNumber);
    uniqueMatches.push(match);
  }

  const blocks = [];
  for (let index = 0; index < uniqueMatches.length; index += 1) {
    const current = uniqueMatches[index];
    const next = uniqueMatches[index + 1];
    const dayNumber = Number(current[1]);
    const dayTitle = normalizeDayTitle(current[2], dayNumber);
    const bodyStart = current.index + current[0].length;
    const bodyEnd = next ? next.index : sourceText.length;
    blocks.push({
      dayNumber,
      dayTitle,
      body: stripCrossDayNarration(sourceText.slice(bodyStart, bodyEnd)),
    });
  }

  return blocks.sort((left, right) => left.dayNumber - right.dayNumber);
}

function parseMeditationDayScripts(rawText) {
  const sourceText = normalizeSourceText(rawText);
  const dayHeadingRegex = /\*\*Day\s+(\d+)\s*[—–-]\s*([\s\S]+?)\*\*/gim;
  const matches = [...sourceText.matchAll(dayHeadingRegex)];
  const scripts = [];

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const dayNumber = Number(current[1]);
    if (!Number.isInteger(dayNumber) || dayNumber <= 0) continue;

    const rawTitle = cleanText(stripMarkdown(current[2]));
    const dayTitle = normalizeDayTitle(
      cleanText(rawTitle.replace(/\(\s*\d+\s*[-–—]\s*minute[^)]*\)/i, '')).replace(/\s*\n\s*/g, ' '),
      dayNumber
    );
    const bodyStart = current.index + current[0].length;
    const bodyEnd = next ? next.index : sourceText.length;
    const scriptText = cleanText(stripMarkdown(sourceText.slice(bodyStart, bodyEnd)));
    if (!scriptText) continue;

    scripts.push({
      dayNumber,
      dayTitle: dayTitle || `Day ${dayNumber}`,
      scriptText,
    });
  }

  return scripts;
}

function buildSupplementMeditationDayBlock(entry) {
  return {
    dayNumber: entry.dayNumber,
    dayTitle: entry.dayTitle,
    body: cleanText(`Goal: ${entry.dayTitle}\n\nStep 1 — Guided Meditation\n${entry.scriptText}`),
  };
}

function parseBoldSections(dayBody) {
  const lines = dayBody.split('\n');
  const hasMarkdownHeadings = lines.some((rawLine) => /^#{1,6}\s+/.test(rawLine.trim()));

  if (hasMarkdownHeadings) {
    const sections = [];
    let currentSection = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      const markdownHeadingMatch = line.match(/^#{1,6}\s+(.+)$/);
      if (markdownHeadingMatch) {
        if (currentSection) {
          sections.push({
            heading: cleanText(currentSection.heading),
            body: cleanText(currentSection.body.join('\n')),
          });
        }

        currentSection = {
          heading: cleanText(stripMarkdown(markdownHeadingMatch[1])),
          body: [],
        };
        continue;
      }

      if (currentSection) {
        currentSection.body.push(rawLine);
      }
    }

    if (currentSection) {
      sections.push({
        heading: cleanText(currentSection.heading),
        body: cleanText(currentSection.body.join('\n')),
      });
    }

    return sections;
  }

  const legacyLines = dayBody.split('\n');
  const sections = [];
  let currentSection = null;

  for (const rawLine of legacyLines) {
    const line = rawLine.trim();
    const headingMatch = line.match(/^\*\*([^*]+)\*\*(.*)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.push({
          heading: cleanText(currentSection.heading),
          body: cleanText(currentSection.body.join('\n')),
        });
      }
      currentSection = {
        heading: cleanText(stripMarkdown(headingMatch[1])),
        body: [],
      };
      const trailingText = cleanText(stripMarkdown(headingMatch[2] ?? ''));
      if (trailingText) {
        currentSection.body.push(trailingText);
      }
      continue;
    }

    if (currentSection) {
      currentSection.body.push(rawLine);
    }
  }

  if (currentSection) {
    sections.push({
      heading: cleanText(currentSection.heading),
      body: cleanText(currentSection.body.join('\n')),
    });
  }

  return sections;
}

function parseStepSections(dayBody) {
  const source = normalizeSourceText(dayBody);
  const stepHeadingRegex =
    /^(?:\s*(?:\*\*|#{1,6}\s*)?)\s*Step\s*(\d+)\s*(?:[—–:-]\s*(.*?))?\s*(?:\*\*)?\s*$/gim;
  const matches = [...source.matchAll(stepHeadingRegex)];
  const sections = [];

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const stepNumber = Number(current[1]);
    if (!Number.isInteger(stepNumber) || stepNumber <= 0) continue;
    const headingText = cleanText(stripMarkdown(current[2] || `Step ${stepNumber}`));
    const bodyStart = current.index + current[0].length;
    const bodyEnd = next ? next.index : source.length;
    sections.push({
      stepNumber,
      heading: headingText || `Step ${stepNumber}`,
      body: cleanText(source.slice(bodyStart, bodyEnd)),
    });
  }

  return sections;
}

function inferEstimatedMinutes(dayNumber) {
  return Math.min(18, 10 + Math.floor((dayNumber - 1) / 2));
}

function inferMinutesFromStepCount(stepCount, dayNumber) {
  const baseline = inferEstimatedMinutes(dayNumber);
  return Math.min(22, Math.max(8, baseline + Math.floor(stepCount / 2)));
}

function parseGoal(dayTitleRaw, dayBody, dayNumber) {
  let dayTitle = normalizeDayTitle(dayTitleRaw, dayNumber);
  let goal = '';
  const normalizedBody = normalizeSourceText(dayBody);

  const inlineGoalMatch = dayTitle.match(/^(.*?)\s+goal(?:\s+of\s+today)?\s*:?\s*(.+)$/i);
  if (inlineGoalMatch) {
    dayTitle = normalizeDayTitle(inlineGoalMatch[1], dayNumber);
    goal = cleanText(inlineGoalMatch[2]);
  }

  if (!goal) {
    const primaryGoalMatch = normalizedBody.match(
      /primary goal\s*:\s*([\s\S]*?)(?:\bsecondary goal\b\s*:|(?:\n\s*##)|$)/i
    );
    if (primaryGoalMatch) {
      const secondaryGoalMatch = normalizedBody.match(
        /secondary goal\s*:\s*([\s\S]*?)(?:\bwhat matters today\b\s*:|(?:\n\s*##)|$)/i
      );
      const parts = [
        cleanText(stripMarkdown(primaryGoalMatch[1])),
        cleanText(stripMarkdown(secondaryGoalMatch?.[1] ?? '')),
      ].filter(Boolean);
      goal = parts
        .join('. ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  const lines = normalizedBody.split('\n');
  let captureGoal = false;
  const goalLines = [];

  for (const line of lines) {
    const normalizedLine = normalizeContentLine(line);
    if (!normalizedLine) continue;

    if (!captureGoal) {
      const goalMatch = normalizedLine.match(/^(?:goal|primary goal)(?:\s+of\s+today)?\s*:?\s*(.*)$/i);
      if (goalMatch) {
        const isPrimaryGoal = /^primary goal/i.test(normalizedLine);

        if (goalMatch[1]) {
          const primaryOnly = goalMatch[1]
            .split(/\bsecondary goal\b\s*:?/i)[0]
            .split(/\bwhat matters today\b\s*:?/i)[0];

          if (isPrimaryGoal) {
            const secondaryMatch = normalizedLine.match(
              /\bsecondary goal\b\s*:?\s*(.*?)(?:\bwhat matters today\b\s*:|$)/i
            );
            const parts = [
              cleanText(primaryOnly),
              cleanText(secondaryMatch?.[1] ?? ''),
            ].filter(Boolean);
            goalLines.push(parts.join('. '));
          } else {
            goalLines.push(cleanText(primaryOnly));
          }
        }

        if (isPrimaryGoal) {
          break;
        }

        captureGoal = true;
      }
      continue;
    }

    if (/^(step\s*\d+|day\s+\d+|pro tip|why this works|benefits?|purpose|options?)\b/i.test(normalizedLine)) {
      break;
    }
    goalLines.push(normalizedLine);
    if (goalLines.length >= 4) break;
  }

  const bodyGoal = cleanText(goalLines.join(' '));
  return {
    dayTitle: dayTitle || `Day ${dayNumber}`,
    goal: goal || bodyGoal,
  };
}

function parseBreathingPattern(lines) {
  const joined = lines.join(' ');
  const inhaleMatch = joined.match(/inhale[^0-9]{0,20}(\d+)\s*(?:seconds?|sec|s)\b/i);
  const exhaleMatch = joined.match(/exhale[^0-9]{0,20}(\d+)\s*(?:seconds?|sec|s)\b/i);
  const holdMatch = joined.match(/hold[^0-9]{0,20}(\d+)\s*(?:seconds?|sec|s)\b/i);
  const cyclesMatch = joined.match(/(\d+)\s*cycles?\b/i);

  if (!inhaleMatch && !exhaleMatch && !cyclesMatch) return null;

  return {
    inhaleSeconds: inhaleMatch ? Number(inhaleMatch[1]) : 4,
    holdSeconds: holdMatch ? Number(holdMatch[1]) : undefined,
    exhaleSeconds: exhaleMatch ? Number(exhaleMatch[1]) : 6,
    cycles: cyclesMatch ? Number(cyclesMatch[1]) : 10,
  };
}

function buildExerciseRoutineCard(title, lines) {
  const exercises = lines.slice(0, 12).map((line) => ({
    name: titleCase(line),
    instructions: ['Perform with steady breathing and controlled pacing.'],
  }));

  return {
    type: 'exercise_routine',
    title,
    exercises,
  };
}

function buildMindfulnessCard(title, lines) {
  return {
    type: 'mindfulness_exercise',
    title,
    steps: lines,
    completionMessage: 'Stay with the practice until your body and mind feel steadier.',
  };
}

function buildActionStepCard(stepNumber, title, lines) {
  return {
    type: 'action_step',
    stepNumber,
    title,
    instructions: lines,
    whyThisWorks:
      'Small consistent actions reinforce stability and reduce automatic, stress-driven reactions.',
  };
}

function buildBreathingCard(title, lines, pattern) {
  return {
    type: 'breathing_exercise',
    title,
    instructions: lines.join(' '),
    pattern: {
      inhaleSeconds: Math.max(1, pattern.inhaleSeconds || 4),
      ...(pattern.holdSeconds ? { holdSeconds: Math.max(1, pattern.holdSeconds) } : {}),
      exhaleSeconds: Math.max(1, pattern.exhaleSeconds || 6),
    },
    cycles: Math.max(1, pattern.cycles || 10),
  };
}

function shouldBeMindfulness(title, lines) {
  const haystack = `${title} ${lines.join(' ')}`.toLowerCase();
  return /\b(calm|mindfulness|meditation|visuali[sz]e|imagery|sleep trick|reverse blinking|cognitive|gratitude|brain dump|countdown|defusion|urge|awareness)\b/.test(
    haystack
  );
}

function shouldBeExerciseRoutine(title, lines) {
  const haystack = `${title} ${lines.join(' ')}`.toLowerCase();
  return /\b(walk|movement|exercise|squat|push-?ups?|plank|kegel|stretch|activation|strength|routine|march)\b/.test(
    haystack
  );
}

function buildGenericDay(dayBlock) {
  const { dayTitle, goal } = parseGoal(dayBlock.dayTitle, dayBlock.body, dayBlock.dayNumber);
  const stepSections = parseStepSections(dayBlock.body);
  const cards = [];

  cards.push({
    type: 'intro',
    dayNumber: dayBlock.dayNumber,
    dayTitle: dayTitle || `Day ${dayBlock.dayNumber}`,
    goal: goal || `Complete Day ${dayBlock.dayNumber} with steady, consistent action.`,
    estimatedMinutes: inferMinutesFromStepCount(stepSections.length || 4, dayBlock.dayNumber),
  });

  cards.push({
    type: 'lesson',
    title: "Today's Focus",
    paragraphs: [
      goal || `Complete Day ${dayBlock.dayNumber} with steady, consistent action.`,
    ],
    highlight: goal || 'Consistency compounds into long-term change.',
  });

  let actionStepNumber = 1;
  for (const section of stepSections) {
    const title = cleanText(titleCase(section.heading || `Step ${section.stepNumber}`));
    const lines = splitParagraphLines(section.body);
    if (lines.length === 0) continue;

    const breathingPattern = parseBreathingPattern(lines);
    if (breathingPattern && /breath|sigh|inhale|exhale|respir/i.test(`${title} ${lines.join(' ')}`)) {
      cards.push(buildBreathingCard(title, lines, breathingPattern));
      continue;
    }

    if (shouldBeExerciseRoutine(title, lines) && lines.length >= 3) {
      cards.push(buildExerciseRoutineCard(title, lines));
      continue;
    }

    if (shouldBeMindfulness(title, lines)) {
      cards.push(buildMindfulnessCard(title, lines));
      continue;
    }

    cards.push(buildActionStepCard(actionStepNumber, title, lines));
    actionStepNumber += 1;
  }

  if (cards.length <= 2) {
    const fallbackLines = splitParagraphLines(dayBlock.body).slice(0, 6);
    cards.push(
      buildActionStepCard(
        actionStepNumber,
        'Apply the Day Plan',
        fallbackLines.length > 0 ? fallbackLines : ['Follow the guidance for this day with calm consistency.']
      )
    );
  }

  cards.push({
    type: 'journal',
    prompt: `What helped you most on Day ${dayBlock.dayNumber}?`,
    helperText: 'Write one or two practical observations.',
    followUpPrompt: 'What will you repeat tomorrow?',
  });

  cards.push({
    type: 'close',
    message: `Day ${dayBlock.dayNumber} is complete.`,
    secondaryMessage:
      goal || `You reinforced ${dayTitle ? dayTitle.toLowerCase() : 'today’s practice'} today.`,
  });

  return {
    dayNumber: dayBlock.dayNumber,
    dayTitle: dayTitle || `Day ${dayBlock.dayNumber}`,
    estimatedMinutes: inferMinutesFromStepCount(stepSections.length || 4, dayBlock.dayNumber),
    cards,
  };
}

function buildSixDayDay(dayBlock) {
  const { dayTitle, goal } = parseGoal(dayBlock.dayTitle, dayBlock.body, dayBlock.dayNumber);
  const sections = parseBoldSections(dayBlock.body);
  const lessonSectionIndex = sections.findIndex((section) =>
    /\bwhat\s+day\b.*\bis\s+really\s+about\b/i.test(section.heading)
  );

  let lessonParagraphs = [goal || 'Build steady awareness and interrupt automatic behavior for today.'];
  let lessonHighlight = goal || 'One steady decision is enough for today.';

  if (lessonSectionIndex >= 0) {
    const lessonLines = splitParagraphLines(sections[lessonSectionIndex].body);
    if (lessonLines.length > 0) {
      const paragraphCount = Math.max(1, Math.min(lessonLines.length - 1, 6));
      lessonParagraphs = lessonLines.slice(0, paragraphCount);
      lessonHighlight =
        lessonLines.length > 1 ? lessonLines[lessonLines.length - 1] : lessonLines[0];
    }
  }

  const cards = [
    {
      type: 'intro',
      dayNumber: dayBlock.dayNumber,
      dayTitle: dayTitle || `Day ${dayBlock.dayNumber}`,
      goal: goal || 'Build steady awareness and interrupt automatic behavior for today.',
      estimatedMinutes: inferEstimatedMinutes(dayBlock.dayNumber),
    },
    {
      type: 'lesson',
      title: "Today's Focus",
      paragraphs: lessonParagraphs,
      highlight: lessonHighlight,
    },
  ];

  let reflectionLines = [];
  let stepNumber = 1;
  for (const [sectionIndex, section] of sections.entries()) {
    if (sectionIndex === lessonSectionIndex) continue;
    if (/^Goal:/i.test(section.heading)) continue;
    const heading = titleCase(section.heading);
    const lines = splitParagraphLines(section.body);
    if (lines.length === 0) continue;

    if (/end of day|end the day|reflection|realization/i.test(heading)) {
      reflectionLines = lines;
      continue;
    }

    if (/urge|breathe|observe|thought|calm|wait|feelings|background noise/i.test(heading)) {
      cards.push(buildMindfulnessCard(heading, lines));
      continue;
    }

    if (/\b(move|walk|stretch|exercise)\b/i.test(heading)) {
      cards.push(buildExerciseRoutineCard(heading, lines));
      continue;
    }

    cards.push(buildActionStepCard(stepNumber, heading, lines));
    stepNumber += 1;
  }

  cards.push({
    type: 'journal',
    prompt: `What from Day ${dayBlock.dayNumber} felt most useful today?`,
    helperText: 'A short reflection is enough.',
    followUpPrompt: 'What response would you repeat tomorrow?',
  });

  cards.push({
    type: 'close',
    message: reflectionLines[0] ?? `Day ${dayBlock.dayNumber} is complete.`,
    secondaryMessage:
      reflectionLines[1] ?? goal ?? `You reinforced ${dayTitle.toLowerCase()} today.`,
  });

  return {
    dayNumber: dayBlock.dayNumber,
    dayTitle,
    estimatedMinutes: inferEstimatedMinutes(dayBlock.dayNumber),
    cards,
  };
}

async function normalizeSixDayProgram(rawText) {
  const dayBlocks = parseDayBlocksGeneric(rawText);
  return dayBlocks.map(buildSixDayDay);
}

async function normalizeGenericProgram(rawText) {
  const dayBlocks = parseDayBlocksGeneric(rawText);
  return dayBlocks.map(buildGenericDay);
}

async function normalizeNinetyDayProgram(rawText) {
  const dayBlocks = parseDayBlocksGeneric(rawText);
  const mergedDayBlocks = new Map(dayBlocks.map((block) => [block.dayNumber, block]));

  const supplementPath = SUPPLEMENT_FILES.ninety_day_transform;
  if (supplementPath) {
    try {
      const supplementRaw = await readFile(supplementPath, 'utf8');
      const supplementEntries = parseMeditationDayScripts(supplementRaw);
      for (const entry of supplementEntries) {
        if (!mergedDayBlocks.has(entry.dayNumber)) {
          mergedDayBlocks.set(entry.dayNumber, buildSupplementMeditationDayBlock(entry));
        }
      }
    } catch {
      // Keep primary source output when supplementary script file is unavailable.
    }
  }

  return [...mergedDayBlocks.values()]
    .sort((left, right) => left.dayNumber - right.dayNumber)
    .map(buildGenericDay);
}

const NORMALIZERS = {
  six_day_reset: normalizeSixDayProgram,
  energy_vitality: normalizeGenericProgram,
  sleep_disorder_reset: normalizeGenericProgram,
  male_sexual_health: normalizeGenericProgram,
  age_reversal: normalizeGenericProgram,
  ninety_day_transform: normalizeNinetyDayProgram,
};

function parseArgs(argv) {
  const options = {
    listOnly: false,
    programSlug: null,
    dryRun: false,
    printJson: false,
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
    if (token === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (token === '--print-json') {
      options.printJson = true;
      options.dryRun = true;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const supportedPrograms = Object.keys(NORMALIZERS).sort();

  if (options.listOnly) {
    supportedPrograms.forEach((slug) => console.log(slug));
    return;
  }

  const selectedSlug = options.programSlug ?? 'six_day_reset';
  const normalizer = NORMALIZERS[selectedSlug];
  if (!normalizer) {
    throw new Error(
      `No normalizer configured for "${selectedSlug}". Supported: ${supportedPrograms.join(', ')}`
    );
  }

  const sourcePath = SOURCE_FILES[selectedSlug];
  if (!sourcePath) {
    throw new Error(`No source file configured for "${selectedSlug}"`);
  }

  const rawText = await readFile(sourcePath, 'utf8');
  const days = await normalizer(rawText);
  const canonicalProgram = {
    slug: selectedSlug,
    totalDays: PROGRAM_TOTAL_DAYS[selectedSlug],
    sourcePath: path.relative(repoRoot, sourcePath),
    generatedAt: new Date().toISOString(),
    days,
  };

  const validation = validateCanonicalProgram(canonicalProgram);
  if (!validation.valid) {
    throw new Error(
      `Canonical output failed validation for ${selectedSlug}:\n${validation.errors
        .map((error) => `- ${error}`)
        .join('\n')}`
    );
  }

  if (options.dryRun) {
    if (options.printJson) {
      console.log(JSON.stringify(canonicalProgram, null, 2));
    } else {
      console.log(`[canonical:dry-run] ${selectedSlug}: ${days.length} days`);
      for (const day of days) {
        console.log(
          `  day ${day.dayNumber}: ${day.cards.length} cards | ${day.cards
            .map((card) => card.type)
            .join(', ')}`
        );
      }
    }
  } else {
    await mkdir(canonicalDir, { recursive: true });
    const outputPath = path.join(canonicalDir, `${selectedSlug}.json`);
    await writeFile(outputPath, `${JSON.stringify(canonicalProgram, null, 2)}\n`, 'utf8');
    console.log(
      `[canonical] ${selectedSlug}: ${days.length} days -> ${path.relative(repoRoot, outputPath)}`
    );
  }

  for (const warning of validation.warnings) {
    console.log(`[warning] ${warning}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
