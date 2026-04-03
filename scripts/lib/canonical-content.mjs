import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const appRoot = path.resolve(__dirname, '..', '..');
export const repoRoot = path.resolve(appRoot, '..');
export const canonicalDir = path.join(appRoot, 'content', 'canonical');
export const seedsDir = path.join(appRoot, 'supabase', 'seeds');

export function cleanText(value = '') {
  return String(value)
    .replace(/\r/g, '')
    .replace(/\uFEFF/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isNonEmptyString(value) {
  return typeof value === 'string' && cleanText(value).length > 0;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function toError(errors, pathName, message) {
  errors.push(`${pathName}: ${message}`);
}

function validateActionStepCard(card, pathName, errors) {
  if (!isPositiveInteger(card.stepNumber)) {
    toError(errors, pathName, 'stepNumber must be a positive integer');
  }
  if (!isNonEmptyString(card.title)) {
    toError(errors, pathName, 'title is required');
  }
  if (!Array.isArray(card.instructions) || card.instructions.length === 0) {
    toError(errors, pathName, 'instructions must be a non-empty array');
  }
}

function validateBreathingExerciseCard(card, pathName, errors) {
  if (!isNonEmptyString(card.title)) {
    toError(errors, pathName, 'title is required');
  }
  if (!card.pattern || typeof card.pattern !== 'object') {
    toError(errors, pathName, 'pattern is required');
    return;
  }
  if (!isPositiveInteger(card.pattern.inhaleSeconds)) {
    toError(errors, pathName, 'pattern.inhaleSeconds must be a positive integer');
  }
  if (!isPositiveInteger(card.pattern.exhaleSeconds)) {
    toError(errors, pathName, 'pattern.exhaleSeconds must be a positive integer');
  }
  if (card.pattern.holdSeconds !== undefined && !isPositiveInteger(card.pattern.holdSeconds)) {
    toError(errors, pathName, 'pattern.holdSeconds must be a positive integer when provided');
  }
  if (!isPositiveInteger(card.cycles)) {
    toError(errors, pathName, 'cycles must be a positive integer');
  }
}

function validateExerciseRoutineCard(card, pathName, errors) {
  if (!isNonEmptyString(card.title)) {
    toError(errors, pathName, 'title is required');
  }
  if (!Array.isArray(card.exercises) || card.exercises.length === 0) {
    toError(errors, pathName, 'exercises must be a non-empty array');
    return;
  }
  card.exercises.forEach((exercise, index) => {
    const exercisePath = `${pathName}.exercises[${index}]`;
    if (!isNonEmptyString(exercise?.name)) {
      toError(errors, exercisePath, 'name is required');
    }
    if (!Array.isArray(exercise?.instructions) || exercise.instructions.length === 0) {
      toError(errors, exercisePath, 'instructions must be a non-empty array');
    }
  });
}

function validateCard(card, pathName, errors) {
  if (!card || typeof card !== 'object') {
    toError(errors, pathName, 'card must be an object');
    return;
  }
  if (!isNonEmptyString(card.type)) {
    toError(errors, pathName, 'type is required');
    return;
  }

  switch (card.type) {
    case 'intro':
      if (!isPositiveInteger(card.dayNumber)) {
        toError(errors, pathName, 'dayNumber must be a positive integer');
      }
      if (!isNonEmptyString(card.dayTitle)) {
        toError(errors, pathName, 'dayTitle is required');
      }
      if (!isNonEmptyString(card.goal)) {
        toError(errors, pathName, 'goal is required');
      }
      break;
    case 'lesson':
      if (!Array.isArray(card.paragraphs) || card.paragraphs.length === 0) {
        toError(errors, pathName, 'paragraphs must be a non-empty array');
      }
      break;
    case 'action_step':
      validateActionStepCard(card, pathName, errors);
      break;
    case 'breathing_exercise':
      validateBreathingExerciseCard(card, pathName, errors);
      break;
    case 'mindfulness_exercise':
      if (!isNonEmptyString(card.title)) {
        toError(errors, pathName, 'title is required');
      }
      if (!Array.isArray(card.steps) || card.steps.length === 0) {
        toError(errors, pathName, 'steps must be a non-empty array');
      }
      break;
    case 'exercise_routine':
      validateExerciseRoutineCard(card, pathName, errors);
      break;
    case 'audio':
      if (!isNonEmptyString(card.title)) {
        toError(errors, pathName, 'title is required');
      }
      if (!isNonEmptyString(card.audioStoragePath)) {
        toError(errors, pathName, 'audioStoragePath is required');
      }
      if (!isPositiveInteger(card.durationSeconds)) {
        toError(errors, pathName, 'durationSeconds must be a positive integer');
      }
      break;
    case 'calm_trigger':
      if (!isNonEmptyString(card.context)) {
        toError(errors, pathName, 'context is required');
      }
      break;
    case 'journal':
      if (!isNonEmptyString(card.prompt)) {
        toError(errors, pathName, 'prompt is required');
      }
      break;
    case 'close':
      if (!isNonEmptyString(card.message)) {
        toError(errors, pathName, 'message is required');
      }
      break;
    default:
      toError(errors, pathName, `unsupported card type "${card.type}"`);
  }
}

export function validateCanonicalProgram(program) {
  const errors = [];
  const warnings = [];

  if (!program || typeof program !== 'object') {
    return {
      valid: false,
      errors: ['program: must be an object'],
      warnings: [],
    };
  }

  if (!isNonEmptyString(program.slug)) {
    toError(errors, 'program.slug', 'is required');
  }
  if (!isPositiveInteger(program.totalDays)) {
    toError(errors, 'program.totalDays', 'must be a positive integer');
  }
  if (!Array.isArray(program.days) || program.days.length === 0) {
    toError(errors, 'program.days', 'must be a non-empty array');
  }

  const days = Array.isArray(program.days) ? program.days : [];
  const dayNumbers = [];
  const seenDayNumbers = new Set();

  for (let index = 0; index < days.length; index += 1) {
    const day = days[index];
    const dayPath = `program.days[${index}]`;

    if (!day || typeof day !== 'object') {
      toError(errors, dayPath, 'must be an object');
      continue;
    }
    if (!isPositiveInteger(day.dayNumber)) {
      toError(errors, `${dayPath}.dayNumber`, 'must be a positive integer');
      continue;
    }

    if (seenDayNumbers.has(day.dayNumber)) {
      toError(errors, `${dayPath}.dayNumber`, `duplicate dayNumber ${day.dayNumber}`);
    }
    seenDayNumbers.add(day.dayNumber);
    dayNumbers.push(day.dayNumber);

    if (!isNonEmptyString(day.dayTitle)) {
      toError(errors, `${dayPath}.dayTitle`, 'is required');
    }
    if (day.estimatedMinutes !== undefined && !isPositiveInteger(day.estimatedMinutes)) {
      toError(errors, `${dayPath}.estimatedMinutes`, 'must be a positive integer when provided');
    }

    if (!Array.isArray(day.cards) || day.cards.length === 0) {
      toError(errors, `${dayPath}.cards`, 'must be a non-empty array');
      continue;
    }
    if (day.cards[0]?.type !== 'intro') {
      toError(errors, `${dayPath}.cards[0]`, 'first card must be "intro"');
    }
    if (day.cards[day.cards.length - 1]?.type !== 'close') {
      toError(errors, `${dayPath}.cards[last]`, 'last card must be "close"');
    }
    day.cards.forEach((card, cardIndex) => {
      validateCard(card, `${dayPath}.cards[${cardIndex}]`, errors);
    });
  }

  dayNumbers.sort((left, right) => left - right);
  for (let i = 1; i < dayNumbers.length; i += 1) {
    if (dayNumbers[i] - dayNumbers[i - 1] > 1) {
      warnings.push(
        `program.days: gap detected between day ${dayNumbers[i - 1]} and day ${dayNumbers[i]}`
      );
    }
  }

  if (isPositiveInteger(program.totalDays) && dayNumbers.length > 0) {
    if (dayNumbers[0] !== 1) {
      warnings.push(`program.days: first dayNumber is ${dayNumbers[0]}, expected 1`);
    }
    const maxDay = dayNumbers[dayNumbers.length - 1];
    if (maxDay !== program.totalDays) {
      warnings.push(
        `program.totalDays=${program.totalDays} but max dayNumber in content is ${maxDay}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function sqlQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

