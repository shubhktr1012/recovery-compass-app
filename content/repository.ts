import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { NINETY_DAY_TRANSFORM_PROGRAM } from '@/content/programs/ninety-day-transform';
import { SIX_DAY_RESET_PROGRAM } from '@/content/programs/six-day-reset';
import type { DayContent, ProgramContent, ProgramSlug } from '@/types/content';

const PROGRAMS: Record<ProgramSlug, ProgramContent> = {
  six_day_reset: SIX_DAY_RESET_PROGRAM,
  ninety_day_transform: NINETY_DAY_TRANSFORM_PROGRAM,
  sleep_disorder_reset: {
    ...PROGRAM_METADATA.sleep_disorder_reset,
    days: [],
  },
  energy_vitality: {
    ...PROGRAM_METADATA.energy_vitality,
    days: [],
  },
  age_reversal: {
    ...PROGRAM_METADATA.age_reversal,
    days: [],
  },
  male_sexual_health: {
    ...PROGRAM_METADATA.male_sexual_health,
    days: [],
  },
};

export class ContentRepository {
  static getProgram(programSlug: ProgramSlug): ProgramContent {
    return PROGRAMS[programSlug];
  }

  static getPrograms(): ProgramContent[] {
    return Object.values(PROGRAMS);
  }

  static getProgramsWithContent(): ProgramContent[] {
    return this.getPrograms().filter((program) => program.days.length > 0);
  }

  static getDay(programSlug: ProgramSlug, dayNumber: number): DayContent | null {
    const program = this.getProgram(programSlug);
    return program.days.find((day) => day.dayNumber === dayNumber) ?? null;
  }

  static hasContent(programSlug: ProgramSlug): boolean {
    return this.getProgram(programSlug).days.length > 0;
  }
}
