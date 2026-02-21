import { supabase } from '../supabase';
import { Database } from '../../types/database.types';

type SosEventInsert = Database['public']['Tables']['sos_events']['Insert'];

export async function logSosEvent(event: SosEventInsert) {
    const { data, error } = await supabase
        .from('sos_events')
        .insert(event)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getSosHistory(userId: string, limit = 10) {
    const { data, error } = await supabase
        .from('sos_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

export async function logRelapse(userId: string, slipTime: string, contextNotes?: string) {
    const { data, error } = await supabase
        .from('relapse_logs')
        .insert({
            user_id: userId,
            slip_time: slipTime,
            context_notes: contextNotes || null
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}
