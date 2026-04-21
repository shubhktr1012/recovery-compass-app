import type { ProgramContent } from '@/types/content';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { ageReversalDay1 } from '@/content/programs/age-reversal/day-1';

export const AGE_REVERSAL_PROGRAM: ProgramContent = {
  ...PROGRAM_METADATA.age_reversal,
  days: [ageReversalDay1],
};
