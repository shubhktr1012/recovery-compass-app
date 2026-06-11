import type { ProgramCatalogEntry, ProgramSlug } from '@/types/content';

export const PROGRAM_METADATA: Record<ProgramSlug, ProgramCatalogEntry> = {
  smoking_alcohol_quit: {
    slug: 'smoking_alcohol_quit',
    name: 'Smoking & Alcohol Quit',
    description: 'A guided quit path for smoking, alcohol, or both, with trigger mapping, urge tools, and slip recovery.',
    totalDays: 21,
    category: 'smoking',
    hasAudio: true,
    timeSlotsEnabled: false,
    contentStatus: 'ready',
    priceString: '₹5,999',
    dailyMinutesLabel: '15–20',
    phaseCount: 3,
  },
  six_day_reset: {
    slug: 'six_day_reset',
    name: 'Control',
    description: 'A focused six-day reset that interrupts autopilot and builds immediate control.',
    totalDays: 6,
    category: 'smoking',
    hasAudio: false,
    timeSlotsEnabled: false,
    contentStatus: 'ready',
    priceString: '₹599',
    dailyMinutesLabel: '10–15',
    phaseCount: 2,
  },
  ninety_day_transform: {
    slug: 'ninety_day_transform',
    name: 'Smoking Reset',
    description: 'A long-form smoking recovery path with daily reflection and guided audio.',
    totalDays: 90,
    category: 'smoking',
    hasAudio: true,
    timeSlotsEnabled: false,
    contentStatus: 'ready',
    priceString: '₹5,999',
    dailyMinutesLabel: '10–20',
    phaseCount: 4,
  },
  sleep_disorder_reset: {
    slug: 'sleep_disorder_reset',
    name: 'Deep Sleep Reset',
    description: 'A structured sleep-support program with daily text and guided sleep audio.',
    totalDays: 21,
    category: 'sleep',
    hasAudio: true,
    timeSlotsEnabled: true,
    contentStatus: 'ready',
    priceString: '₹4,999',
    dailyMinutesLabel: '10–15',
    phaseCount: 3,
  },
  energy_vitality: {
    slug: 'energy_vitality',
    name: 'Energy Restore',
    description: 'A program focused on restoring energy, rhythm, and daily momentum.',
    totalDays: 14,
    category: 'energy',
    hasAudio: false,
    timeSlotsEnabled: true,
    contentStatus: 'ready',
    priceString: '₹1,499',
    dailyMinutesLabel: '10–15',
    phaseCount: 2,
  },
  age_reversal: {
    slug: 'age_reversal',
    name: 'Age Well',
    description: 'A longevity-focused program with daily facial exercises, circulation walks, and calm recovery.',
    totalDays: 90,
    category: 'aging',
    hasAudio: false,
    timeSlotsEnabled: true,
    contentStatus: 'ready',
    priceString: '₹6,999',
    dailyMinutesLabel: '10–15',
    phaseCount: 4,
  },
  male_sexual_health: {
    slug: 'male_sexual_health',
    name: "Men’s Vitality Reset",
    description: 'A confidence and regulation program with shared CALM support.',
    totalDays: 30,
    category: 'sexual_health',
    hasAudio: false,
    timeSlotsEnabled: true,
    contentStatus: 'ready',
    priceString: '₹4,999',
    dailyMinutesLabel: '10–15',
    phaseCount: 3,
  },
  gut_health_reset: {
    slug: 'gut_health_reset',
    name: 'Gut Reset',
    description: 'A structured gut-health reset with daily hydration, nervous-system, movement, and eating-rhythm practices.',
    totalDays: 21,
    category: 'gut_health',
    hasAudio: false,
    timeSlotsEnabled: false,
    contentStatus: 'ready',
    priceString: '₹4,999',
    dailyMinutesLabel: '10–15',
    phaseCount: 3,
  },
  free_detox_reset: {
    slug: 'free_detox_reset',
    name: 'Free Detox Program',
    description: 'A free six-day starter journey for nervous-system, hydration, movement, gut, mind, and daily-rhythm reset practices.',
    totalDays: 6,
    category: 'detox',
    hasAudio: false,
    timeSlotsEnabled: false,
    contentStatus: 'ready',
    priceString: 'Free',
    dailyMinutesLabel: '10-15',
    phaseCount: 1,
  },
};

export const LEGACY_REPLACED_PROGRAM_SLUGS = [
  'six_day_reset',
  'ninety_day_transform',
] as const satisfies readonly ProgramSlug[];

export function isLegacyReplacedProgram(programSlug: ProgramSlug) {
  return LEGACY_REPLACED_PROGRAM_SLUGS.includes(programSlug as (typeof LEGACY_REPLACED_PROGRAM_SLUGS)[number]);
}

export const FREE_PROGRAM_SLUGS = [
  'free_detox_reset',
] as const satisfies readonly ProgramSlug[];

export function isFreeProgram(programSlug: ProgramSlug) {
  return FREE_PROGRAM_SLUGS.includes(programSlug as (typeof FREE_PROGRAM_SLUGS)[number]);
}

export function isPublicCatalogProgram(programSlug: ProgramSlug) {
  return !isLegacyReplacedProgram(programSlug) && !isFreeProgram(programSlug);
}
