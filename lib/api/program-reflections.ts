import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { supabase } from '@/lib/supabase';
import type { ProgramSlug } from '@/types/content';

export type ProgramReflectionIdentity = {
  userId: string;
  programSlug: string;
  dayNumber: number;
  cardIndex: number;
  cardType: string;
  prompt: string;
};

const PROGRAM_REFLECTION_COLUMNS = 'reflection, updated_at';
const PROGRAM_REFLECTION_LIST_COLUMNS =
  'id, program_slug, day_number, card_index, card_type, prompt, reflection, created_at, updated_at';

export type ProgramReflectionArchiveItem = {
  id: string;
  programSlug: ProgramSlug;
  programName: string;
  dayNumber: number;
  cardIndex: number;
  cardType: string;
  prompt: string;
  reflection: string;
  createdAt: string;
  updatedAt: string;
};

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

export async function listProgramReflections(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('program_reflections')
    .select(PROGRAM_REFLECTION_LIST_COLUMNS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).flatMap((row) => {
    const programSlug = row.program_slug as ProgramSlug;
    const metadata = PROGRAM_METADATA[programSlug];

    if (!metadata) {
      return [];
    }

    return [
      {
        id: row.id,
        programSlug,
        programName: metadata.name,
        dayNumber: row.day_number,
        cardIndex: row.card_index,
        cardType: row.card_type,
        prompt: row.prompt,
        reflection: row.reflection,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } satisfies ProgramReflectionArchiveItem,
    ];
  });
}
