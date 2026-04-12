import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { CravingsDragger } from '@/components/journal/CravingsDragger';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { AppColors } from '@/constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

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
  const [cravingsLevel, setCravingsLevel] = useState<number | null>(null);
  const [reflection, setReflection] = useState('');
  const trimmedReflection = reflection.trim();

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

      const payload = {
        user_id: userId,
        entry_date: new Date().toISOString().slice(0, 10),
        mood: mood.trim() || null,
        cravings_level: cravingsLevel,
        reflection: trimmedReflection,
      };

      const { error } = await supabase
        .from('journal_entries')
        .upsert(payload, { onConflict: 'user_id,entry_date' });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: JOURNAL_QUERY_KEY(userId) });
      await queryClient.invalidateQueries({ queryKey: ['journal-today'] });
      setMood('');
      setCravingsLevel(null);
      setReflection('');
      Alert.alert('Saved', 'Your reflection has been captured.');
    },
    onError: (error: Error) => {
      Alert.alert('Could not save entry', error.message);
    },
  });

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const entries = journalQuery.data ?? [];
  const canSaveEntry = trimmedReflection.length > 0 && !saveEntryMutation.isPending;

  // Save button physics
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <PaperGrain />
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-6 pb-40"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Editorial Header ─── */}
          <View className="pt-8 mb-12">
            <Text className="font-satoshi text-[11px] uppercase tracking-[3px] text-forest/35 mb-1">
              Your Reflections
            </Text>
            <Text className="font-erode-medium text-[40px] leading-[48px] tracking-tight text-forest">
              Journal
            </Text>
          </View>

          {/* ─── Today's Entry ─── */}
          <View className="mb-16">
            <Text className="font-satoshi text-[13px] text-forest/30 mb-8 px-1">
              {todayLabel}
            </Text>

            {/* Mood */}
            <View className="mb-8">
              <Text className="text-forest font-satoshi-medium text-[13px] ml-1 mb-2">
                Mood
              </Text>
              <TextInput
                className="w-full bg-white/70 border border-forest/5 rounded-2xl px-5 py-4 text-[16px] text-forest"
                style={{ fontFamily: 'Satoshi-Regular' }}
                placeholderTextColor={AppColors.placeholderText}
                placeholder="Calm, restless, hopeful..."
                value={mood}
                onChangeText={setMood}
              />
            </View>

            {/* Cravings — discrete segments */}
            <View className="mb-8">
              <CravingsDragger
                value={cravingsLevel}
                onChange={setCravingsLevel}
              />
            </View>

            {/* Reflection */}
            <View className="mb-10">
              <Text className="text-forest font-satoshi-medium text-[13px] ml-1 mb-2">
                Reflection
              </Text>
              <TextInput
                className="w-full bg-white/70 border border-forest/5 rounded-3xl px-5 py-5 text-[16px] text-forest"
                style={{ fontFamily: 'Satoshi-Regular', minHeight: 160, textAlignVertical: 'top' }}
                placeholderTextColor={AppColors.placeholderText}
                placeholder="What helped today? What felt hard?"
                value={reflection}
                onChangeText={setReflection}
                multiline
              />
            </View>

            {/* Save Entry — SquishPressable */}
            <Pressable
              onPressIn={() => {
                if (!canSaveEntry) return;
                btnScale.value = withTiming(0.96, { duration: 180, easing: Easing.inOut(Easing.cubic) });
              }}
              onPressOut={() => {
                if (!canSaveEntry) return;
                btnScale.value = withTiming(1, { duration: 240, easing: Easing.inOut(Easing.cubic) });
              }}
              onPress={() => saveEntryMutation.mutate()}
              disabled={!canSaveEntry}
            >
              <Animated.View
                style={btnStyle}
                className={`w-full rounded-full py-[18px] items-center justify-center ${
                  canSaveEntry ? 'bg-forest' : 'bg-forest/30'
                }`}
              >
                <Text className="font-satoshi-bold text-[16px] text-white tracking-[0.5px]">
                  {saveEntryMutation.isPending ? 'Saving...' : 'Save Entry'}
                </Text>
              </Animated.View>
            </Pressable>
          </View>

          {/* ─── Divider ─── */}
          <View className="h-px bg-forest/5 mb-10" />

          {/* ─── Archive ─── */}
          <View>
            <Text className="font-satoshi-bold text-[11px] uppercase tracking-[2px] text-forest/25 mb-6 px-1">
              Archive
            </Text>

            {journalQuery.isPending ? (
              <Text className="font-satoshi text-forest/30 px-1">Loading entries...</Text>
            ) : journalQuery.error ? (
              <Text className="font-satoshi text-danger px-1">Could not load journal history.</Text>
            ) : entries.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="font-erode-medium text-[20px] text-forest/20 mb-2">
                  No reflections yet
                </Text>
                <Text className="font-satoshi text-[14px] text-forest/20">
                  Your first entry starts above.
                </Text>
              </View>
            ) : (
              <View className="gap-5">
                {entries.map((entry) => (
                  <View
                    key={entry.id}
                    className="rounded-3xl bg-white/70 border border-forest/5 p-6"
                  >
                    {/* Date */}
                    <Text className="font-erode-medium text-[18px] text-forest mb-3">
                      {new Date(entry.entry_date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>

                    {/* Tag pills */}
                    {(entry.mood || entry.cravings_level) && (
                      <View className="flex-row flex-wrap gap-2 mb-4">
                        {entry.mood && (
                          <View className="bg-sage/40 px-3 py-1.5 rounded-full">
                            <Text className="font-satoshi-medium text-[12px] text-forest/60">
                              {entry.mood}
                            </Text>
                          </View>
                        )}
                        {entry.cravings_level && (
                          <View className="bg-sage/40 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                            <View className="w-1.5 h-1.5 rounded-full bg-forest/30" />
                            <Text className="font-satoshi-medium text-[12px] text-forest/60">
                              Level {entry.cravings_level}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Reflection text */}
                    <Text className="font-satoshi text-[15px] leading-[26px] text-forest/70">
                      {entry.reflection}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
