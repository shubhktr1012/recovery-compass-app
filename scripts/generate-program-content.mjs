import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

const sixDaySourcePath = path.join(
  repoRoot,
  'documents',
  'Sent By Anjan',
  'program_content',
  '🧭 RECOVERY COMPASS 6 DAYS PROGRAM.md'
);
const ninetyDaySourcePath = path.join(
  repoRoot,
  'documents',
  'Sent By Anjan',
  'program_content',
  '🧭 RECOVERY COMPASS 90-days Program.md'
);
const transcriptSourcePath = path.join(
  repoRoot,
  'documents',
  'Sent By Anjan',
  'program_content',
  'meditation script 90days file.md'
);
const outputPath = path.join(repoRoot, 'app', 'lib', 'programs', 'generated.ts');

function cleanText(value) {
  return value
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripCarryOver(value) {
  return cleanText(value.replace(/\nAbsolutely\.[\s\S]*$/i, ''));
}

function stripMarkdown(value) {
  return cleanText(
    value
      .replace(/\*\*/g, '')
      .replace(/^[-*] /gm, '')
      .replace(/^#+\s+/gm, '')
  );
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function firstParagraph(block) {
  const paragraphs = cleanText(block)
    .split('\n\n')
    .map((part) => stripMarkdown(part))
    .filter(Boolean);

  return paragraphs[0] ?? '';
}

function parseSectionsFromHeadings(body) {
  const headingRegex = /^##\s+(.+)$/gm;
  const sections = [];
  const matches = [...body.matchAll(headingRegex)];

  for (let index = 0; index < matches.length; index += 1) {
    const currentMatch = matches[index];
    const nextMatch = matches[index + 1];
    const title = stripMarkdown(currentMatch[1]);
    const sectionStart = currentMatch.index + currentMatch[0].length;
    const sectionEnd = nextMatch ? nextMatch.index : body.length;
    const sectionBody = cleanText(body.slice(sectionStart, sectionEnd));

    if (!sectionBody) continue;

    sections.push({
      title,
      body: stripMarkdown(sectionBody),
    });
  }

  return sections;
}

function parseSixDay(content) {
  const dayRegex = /^## DAY (\d+)\s+[–-]\s+(.+)$/gm;
  const matches = [...content.matchAll(dayRegex)];
  const days = [];

  for (let index = 0; index < matches.length; index += 1) {
    const currentMatch = matches[index];
    const nextMatch = matches[index + 1];
    const dayNumber = Number(currentMatch[1]);
    const title = toTitleCase(stripMarkdown(currentMatch[2]));
    const sectionStart = currentMatch.index + currentMatch[0].length;
    const sectionEnd = nextMatch ? nextMatch.index : content.length;
    const body = stripCarryOver(content.slice(sectionStart, sectionEnd));
    const sections = parseSectionsFromHeadings(body);
    const summary =
      firstParagraph(body.replace(/^\*\*Day [^\n]+\n+/i, '').replace(/^\*\*Primary Goal:[\s\S]*?\n\n/, '')) ||
      firstParagraph(body);

    days.push({
      programSlug: 'six_day_reset',
      dayNumber,
      title,
      subtitle: null,
      summary,
      prompt: null,
      close: null,
      estimatedMinutes: 10,
      focus: null,
      sections,
      audio: null,
    });
  }

  return {
    slug: 'six_day_reset',
    title: '6-Day Control',
    description: 'A focused six-day reset that interrupts autopilot and builds immediate control.',
    accentLabel: 'Directive Reset',
    totalDays: days.length,
    hasAudio: false,
    days,
  };
}

function parseTranscriptMap(content) {
  const transcriptRegex =
    /\*\*Day (\d+)\s+[–-]\s+(.+?)\s+\(7-Minute Guided Meditation\)\*\*([\s\S]*?)(?=\*\*Day \d+\s+[–-]\s+.+?\(7-Minute Guided Meditation\)\*\*|\Z)/g;
  const transcripts = new Map();

  for (const match of content.matchAll(transcriptRegex)) {
    const dayNumber = Number(match[1]);
    const transcript = cleanText(match[3]);
    if (!transcript) continue;

    transcripts.set(dayNumber, transcript);
  }

  return transcripts;
}

function stripCurlyQuotes(value = '') {
  return cleanText(String(value).replace(/^[“"]+|[”"]+$/g, ''));
}

function firstParagraphText(value = '') {
  const [firstParagraph = ''] = cleanText(String(value)).split('\n\n');
  return cleanText(firstParagraph);
}

function extractLabeledBlockValue(block, label, nextLabels = []) {
  const lookahead = nextLabels.length
    ? `(?=${nextLabels.map((nextLabel) => `\\*\\*${nextLabel}:\\*\\*`).join('|')}|$)`
    : '$';
  const regex = new RegExp(`\\*\\*${label}:\\*\\*\\s+([\\s\\S]*?)${lookahead}`, 'i');
  const match = block.match(regex);
  if (!match) return '';
  return cleanText(stripMarkdown(match[1]));
}

function parseNinetyDaySummaries(content) {
  const summaryHeadingRegex =
    /^\*\*Day\s+(\d+)\s+[–-]\s+(.+?)\*\*\s*$([\s\S]*?)(?=^##\s*DAY\s+\1\b)/gim;
  const summaries = new Map();

  for (const match of content.matchAll(summaryHeadingRegex)) {
    const dayNumber = Number(match[1]);
    const summaryBlock = match[3] ?? '';
    summaries.set(dayNumber, {
      dayNumber,
      title: stripMarkdown(match[2]),
      focus: firstParagraphText(
        extractLabeledBlockValue(summaryBlock, 'Focus', ['Exercise', 'Journal', 'Close'])
      ),
      exercise: firstParagraphText(
        extractLabeledBlockValue(summaryBlock, 'Exercise', ['Journal', 'Close'])
      ),
      prompt: stripCurlyQuotes(
        firstParagraphText(extractLabeledBlockValue(summaryBlock, 'Journal', ['Close']))
      ),
      close: stripCurlyQuotes(firstParagraphText(extractLabeledBlockValue(summaryBlock, 'Close'))),
    });
  }

  return summaries;
}

function toInstructionParagraph(value, fallback) {
  const cleaned = stripMarkdown(value ?? '');
  if (cleaned) return cleaned;
  return fallback;
}

function parseNinetyDayDetails(content) {
  const detailRegex = /^## DAY (\d+)\s+[–-]\s+(.+)$/gm;
  const matches = [...content.matchAll(detailRegex)];
  const details = new Map();

  for (let index = 0; index < matches.length; index += 1) {
    const currentMatch = matches[index];
    const nextMatch = matches[index + 1];
    const dayNumber = Number(currentMatch[1]);
    const title = toTitleCase(stripMarkdown(currentMatch[2]));
    const sectionStart = currentMatch.index + currentMatch[0].length;
    const sectionEnd = nextMatch ? nextMatch.index : content.length;
    const body = cleanText(content.slice(sectionStart, sectionEnd));
    const screenRegex = /^## SCREEN \d+:\s+(.+)$/gm;
    const sections = [];
    const screenMatches = [...body.matchAll(screenRegex)];

    if (screenMatches.length > 0) {
      for (let screenIndex = 0; screenIndex < screenMatches.length; screenIndex += 1) {
        const currentScreen = screenMatches[screenIndex];
        const nextScreen = screenMatches[screenIndex + 1];
        const screenStart = currentScreen.index + currentScreen[0].length;
        const screenEnd = nextScreen ? nextScreen.index : body.length;
        const screenBody = cleanText(body.slice(screenStart, screenEnd));
        if (!screenBody) continue;
        sections.push({
          title: stripMarkdown(currentScreen[1]),
          body: stripMarkdown(screenBody),
        });
      }
    } else {
      sections.push(...parseSectionsFromHeadings(body));
    }

    details.set(dayNumber, {
      title,
      summary: firstParagraph(body),
      sections,
    });
  }

  return details;
}

function buildNinetyDay(content, transcriptContent) {
  const transcriptMap = parseTranscriptMap(transcriptContent);
  const summaries = parseNinetyDaySummaries(content);
  const details = parseNinetyDayDetails(content);
  const days = [];

  for (let dayNumber = 1; dayNumber <= 90; dayNumber += 1) {
    const summaryEntry = summaries.get(dayNumber);
    const detailEntry = details.get(dayNumber);
    const fallbackTitle = summaryEntry?.title ?? detailEntry?.title ?? `Day ${dayNumber}`;
    const focus = toInstructionParagraph(
      summaryEntry?.focus,
      transcriptMap.get(dayNumber)
        ? firstParagraph(transcriptMap.get(dayNumber))
        : 'A guided reflection designed to slow the urge-response loop.'
    );
    const exercise = toInstructionParagraph(
      summaryEntry?.exercise,
      'Follow today’s guidance with gentle consistency and no pressure to do it perfectly.'
    );
    const close = toInstructionParagraph(
      summaryEntry?.close,
      'Awareness grows quietly over time.'
    );
    const sections = [
      {
        title: 'Today’s Focus',
        body: focus,
      },
      {
        title: 'Today’s Practice',
        body: exercise,
      },
    ];

    days.push({
      programSlug: 'ninety_day_transform',
      dayNumber,
      title: fallbackTitle,
      subtitle: null,
      summary: focus,
      prompt: summaryEntry?.prompt ?? null,
      close,
      estimatedMinutes: 7,
      focus,
      sections,
      audio: {
        storagePath: `ninety-day/day-${String(dayNumber).padStart(3, '0')}.mp3`,
        durationSeconds: 420,
        transcript: transcriptMap.get(dayNumber) ?? null,
      },
    });
  }

  return {
    slug: 'ninety_day_transform',
    title: '90-Day Smoking Reset',
    description: 'A long-form guided path with daily reflection and audio support for lasting change.',
    accentLabel: 'Guided Stability',
    totalDays: 90,
    hasAudio: true,
    days,
  };
}

async function main() {
  const [sixDayContent, ninetyDayContent, transcriptContent] = await Promise.all([
    readFile(sixDaySourcePath, 'utf8'),
    readFile(ninetyDaySourcePath, 'utf8'),
    readFile(transcriptSourcePath, 'utf8'),
  ]);

  const catalog = {
    six_day_reset: parseSixDay(sixDayContent),
    ninety_day_transform: buildNinetyDay(ninetyDayContent, transcriptContent),
  };

  const fileContents = `// Generated by scripts/generate-program-content.mjs\nexport const GENERATED_PROGRAMS = ${JSON.stringify(
    catalog,
    null,
    2
  )} as const;\n`;

  await writeFile(outputPath, fileContents);
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
