import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  mood: string | null;
  cravings_level: number | null;
  reflection: string;
  created_at: string;
}

const JOURNAL_COLUMNS = 'id, user_id, entry_date, mood, cravings_level, reflection, created_at';
const JOURNAL_QUERY_KEY = (userId: string | null) => ['journal-entries', userId];

export default function JournalScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const [mood, setMood] = useState('');
  const [cravingsLevel, setCravingsLevel] = useState('');
  const [reflection, setReflection] = useState('');

  const journalQuery = useQuery({
    queryKey: JOURNAL_QUERY_KEY(userId),
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('journal_entries')
        .select(JOURNAL_COLUMNS)
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data ?? []) as JournalEntry[];
    },
    enabled: Boolean(userId),
  });

  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Please sign in to save journal entries.');

      const trimmedReflection = reflection.trim();
      if (!trimmedReflection) throw new Error('Reflection is required.');

      const parsedCravings = cravingsLevel ? Number(cravingsLevel) : null;
      if (parsedCravings !== null && (!Number.isInteger(parsedCravings) || parsedCravings < 1 || parsedCravings > 10)) {
        throw new Error('Cravings level must be an integer from 1 to 10.');
      }

      const payload = {
        user_id: userId,
        entry_date: new Date().toISOString().slice(0, 10),
        mood: mood.trim() || null,
        cravings_level: parsedCravings,
        reflection: trimmedReflection,
      };

      const { error } = await supabase
        .from('journal_entries')
        .upsert(payload, { onConflict: 'user_id,entry_date' });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: JOURNAL_QUERY_KEY(userId) });
      setMood('');
      setCravingsLevel('');
      setReflection('');
      Alert.alert('Saved', 'Your journal entry has been saved.');
    },
    onError: (error: Error) => {
      Alert.alert('Could not save entry', error.message);
    },
  });

  const sectionTitle = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }, []);
  const entries = journalQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="p-6 pb-32">
        <View className="mb-8">
          <Text className="font-erode-bold text-4xl text-forest mb-2">Journal</Text>
          <Text className="font-satoshi text-base text-gray-500">Capture cravings, mood, and progress each day.</Text>
        </View>

        <View className="bg-white rounded-3xl border border-gray-200 p-5 mb-8">
          <Text className="font-satoshi-bold text-forest text-sm uppercase mb-4">{sectionTitle}</Text>
          <View className="space-y-4">
            <Input
              label="Mood"
              placeholder="Focused, anxious, calm..."
              value={mood}
              onChangeText={setMood}
            />
            <Input
              label="Cravings Level (1-10)"
              placeholder="e.g. 4"
              keyboardType="number-pad"
              value={cravingsLevel}
              onChangeText={setCravingsLevel}
            />
            <Input
              label="Reflection"
              placeholder="What helped today? What felt hard?"
              value={reflection}
              onChangeText={setReflection}
              multiline
              numberOfLines={5}
              style={{ height: 140, textAlignVertical: 'top' }}
            />
            <Button
              label="Save Entry"
              onPress={() => saveEntryMutation.mutate()}
              loading={saveEntryMutation.isPending}
              size="lg"
            />
          </View>
        </View>

        <View>
          <Text className="font-erode-semibold text-2xl text-forest mb-4">Recent Entries</Text>
          {journalQuery.isPending ? (
            <Text className="font-satoshi text-gray-500">Loading entries...</Text>
          ) : journalQuery.error ? (
            <Text className="font-satoshi text-danger">Could not load journal history.</Text>
          ) : entries.length === 0 ? (
            <Text className="font-satoshi text-gray-500">No entries yet. Your first reflection starts today.</Text>
          ) : (
            <View className="space-y-3">
              {entries.map((entry) => (
                <View key={entry.id} className="rounded-2xl bg-white border border-gray-200 p-4">
                  <Text className="font-satoshi-bold text-forest mb-1">
                    {new Date(entry.entry_date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  {entry.mood ? <Text className="font-satoshi text-gray-600 mb-1">Mood: {entry.mood}</Text> : null}
                  {entry.cravings_level ? (
                    <Text className="font-satoshi text-gray-600 mb-1">Cravings: {entry.cravings_level}/10</Text>
                  ) : null}
                  <Text className="font-satoshi text-gray-700">{entry.reflection}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
