import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { Tables } from '@/types/database.types';

export type OnboardingResponse = Tables<'onboarding_responses'>;

export const ONBOARDING_RESPONSE_QUERY_KEY = (userId: string | null) => ['onboarding-response', userId];

const ONBOARDING_RESPONSE_COLUMNS = `
  id,
  user_id,
  target_selection,
  language_selection,
  full_name,
  age,
  past_attempts,
  triggers,
  root_cause,
  physical_toll,
  mental_toll,
  daily_consumption_amount,
  daily_consumption_cost,
  primary_goal,
  created_at,
  updated_at
`;

export function useOnboardingResponse() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ONBOARDING_RESPONSE_QUERY_KEY(userId),
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('onboarding_responses')
        .select(ONBOARDING_RESPONSE_COLUMNS)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return data as OnboardingResponse | null;
    },
    enabled: Boolean(userId),
  });
}
