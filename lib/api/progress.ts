import { supabase } from '../supabase';
import { Database } from '../../types/database.types';

type ProgramProgress = Database['public']['Tables']['program_progress']['Row'];

export async function unlockNextDay(userId: string, programId: string, dayId: number) {
    const { data, error } = await supabase
        .from('program_progress')
        .insert({
            user_id: userId,
            program_id: programId,
            day_id: dayId,
            status: 'UNLOCKED'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function completeDay(userId: string, programId: string, dayId: number, timeSpentSeconds: number) {
    const { data, error } = await supabase
        .from('program_progress')
        .upsert({
            user_id: userId,
            program_id: programId,
            day_id: dayId,
            status: 'COMPLETED',
            time_spent_seconds: timeSpentSeconds,
            content_completed: true,
        }, {
            onConflict: 'user_id,program_id,day_id'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getHighestCompletedDay(userId: string, programId: string) {
    const { data, error } = await supabase
        .from('program_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('program_id', programId)
        .eq('status', 'COMPLETED')
        .order('day_id', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // Allow "Row not found" error
    return data;
}
