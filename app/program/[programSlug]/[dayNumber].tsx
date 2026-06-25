import { Redirect, useLocalSearchParams } from 'expo-router';

import { buildDayDetailRoute, PROGRAM_TAB_ROUTE } from '@/lib/navigation/routes';

export default function LegacyProgramDayRedirect() {
  const params = useLocalSearchParams<{ programSlug?: string | string[]; dayNumber?: string | string[] }>();

  const programSlug = Array.isArray(params.programSlug) ? params.programSlug[0] : params.programSlug;
  const dayNumber = Array.isArray(params.dayNumber) ? params.dayNumber[0] : params.dayNumber;

  if (!programSlug || !dayNumber) {
    return <Redirect href={PROGRAM_TAB_ROUTE} />;
  }

  return <Redirect href={buildDayDetailRoute({ programSlug, dayNumber })} />;
}
