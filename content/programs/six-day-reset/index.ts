import type { ProgramContent } from '@/types/content';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { sixDayResetDay1 } from '@/content/programs/six-day-reset/day-1';

export const SIX_DAY_RESET_PROGRAM: ProgramContent = {
  ...PROGRAM_METADATA.six_day_reset,
  days: [sixDayResetDay1],
};
