import { describe, expect, it } from 'vitest';

import {
  LEGACY_REPLACED_PROGRAM_SLUGS,
  isPublicCatalogProgram,
} from '@/content/programs/metadata';
import type { ProgramSlug } from '@/types/content';

describe('program catalog visibility', () => {
  it('hides legacy replaced smoking programs from public catalog surfaces', () => {
    expect(LEGACY_REPLACED_PROGRAM_SLUGS).toEqual([
      'six_day_reset',
      'ninety_day_transform',
    ]);
    expect(isPublicCatalogProgram('six_day_reset')).toBe(false);
    expect(isPublicCatalogProgram('ninety_day_transform')).toBe(false);
  });

  it('keeps replacement and current programs visible for public purchase surfaces', () => {
    const visiblePrograms: ProgramSlug[] = [
      'smoking_alcohol_quit',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health',
      'gut_health_reset',
    ];

    visiblePrograms.forEach((programSlug) => {
      expect(isPublicCatalogProgram(programSlug)).toBe(true);
    });
  });
});
