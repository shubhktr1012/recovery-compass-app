import { supabase } from '../supabase';
import { Database } from '../../types/database.types';

type UserRoutineInsert = Database['public']['Tables']['user_routines']['Insert'];

export async function createRoutine(routine: UserRoutineInsert) {
    const { data, error } = await supabase
        .from('user_routines')
        .insert(routine)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getUserRoutines(userId: string) {
    const { data, error } = await supabase
        .from('user_routines')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE'); // Only get active routines

    if (error) throw error;
    return data;
}

export async function checkInRoutine(userId: string, routineId: string, notes?: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('routine_checkins')
        .insert({
            user_id: userId,
            routine_id: routineId,
            checkin_date: today,
            notes: notes || null
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}
