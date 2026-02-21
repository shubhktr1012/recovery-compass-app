import { supabase } from '../supabase';
import { Database } from '../../types/database.types';

type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert'];
type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update'];

export async function createJournalEntry(entry: JournalEntryInsert) {
    const { data, error } = await supabase
        .from('journal_entries')
        .insert(entry)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateJournalEntry(id: string, updates: JournalEntryUpdate) {
    const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getJournalEntryForToday(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_date', today)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "Row not found"
    return data;
}

export async function getJournalHistory(userId: string, limit = 7) {
    const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}
