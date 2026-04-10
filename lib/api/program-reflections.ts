import { supabase } from '@/lib/supabase';

export type ProgramReflectionIdentity = {
  userId: string;
  programSlug: string;
  dayNumber: number;
  cardIndex: number;
  cardType: string;
  prompt: string;
};

const PROGRAM_REFLECTION_COLUMNS = 'reflection, updated_at';

export async function getProgramReflection(identity: ProgramReflectionIdentity) {
  const { data, error } = await supabase
    .from('program_reflections')
    .select(PROGRAM_REFLECTION_COLUMNS)
    .eq('user_id', identity.userId)
    .eq('program_slug', identity.programSlug)
    .eq('day_number', identity.dayNumber)
    .eq('card_index', identity.cardIndex)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertProgramReflection(
  identity: ProgramReflectionIdentity,
  reflection: string
) {
  const payload = {
    user_id: identity.userId,
    program_slug: identity.programSlug,
    day_number: identity.dayNumber,
    card_index: identity.cardIndex,
    card_type: identity.cardType,
    prompt: identity.prompt,
    reflection,
  };

  const { data, error } = await supabase
    .from('program_reflections')
    .upsert(payload, {
      onConflict: 'user_id,program_slug,day_number,card_index',
    })
    .select(PROGRAM_REFLECTION_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
