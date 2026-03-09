import { GENERATED_PROGRAMS } from '@/lib/programs/generated';
import {
  ProgramContent,
  ProgramDayContent,
  ProgramSlug,
} from '@/lib/programs/types';

const PROGRAMS = GENERATED_PROGRAMS as unknown as Record<ProgramSlug, ProgramContent>;

export class ProgramRepository {
  static getProgram(programSlug: ProgramSlug): ProgramContent {
    return PROGRAMS[programSlug];
  }

  static getPrograms(): ProgramContent[] {
    return Object.values(PROGRAMS);
  }

  static getDay(programSlug: ProgramSlug, dayNumber: number): ProgramDayContent | null {
    const program = this.getProgram(programSlug);
    return program.days.find((day) => day.dayNumber === dayNumber) ?? null;
  }

  static getFirstDay(programSlug: ProgramSlug): ProgramDayContent | null {
    return this.getDay(programSlug, 1);
  }

  static getNextDay(programSlug: ProgramSlug, dayNumber: number): ProgramDayContent | null {
    return this.getDay(programSlug, dayNumber + 1);
  }

  static getProgramLength(programSlug: ProgramSlug): number {
    return this.getProgram(programSlug).totalDays;
  }

  static hasAudio(programSlug: ProgramSlug): boolean {
    return this.getProgram(programSlug).hasAudio;
  }
}

