import type { ProgramContent } from '@/types/content';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { ninetyDayTransformDay1 } from '@/content/programs/ninety-day-transform/day-1';

export const NINETY_DAY_TRANSFORM_PROGRAM: ProgramContent = {
  ...PROGRAM_METADATA.ninety_day_transform,
  days: [ninetyDayTransformDay1],
};
