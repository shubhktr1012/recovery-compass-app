import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { CravingsDragger } from '@/components/journal/CravingsDragger';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { listProgramReflections } from '@/lib/api/program-reflections';
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
  updated_at?: string;
}

const JOURNAL_COLUMNS = 'id, user_id, entry_date, mood, cravings_level, reflection, created_at, updated_at';
const JOURNAL_QUERY_KEY = (userId: string | null) => ['journal-entries', userId];
const REFLECTIONS_QUERY_KEY = (userId: string | null) => ['program-reflections', userId];

type ArchiveTab = 'journal_entries' | 'reflections';

export default function JournalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [mood, setMood] = useState('');
  const [cravingsLevel, setCravingsLevel] = useState<number | null>(null);
  const [reflection, setReflection] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>('journal_entries');
  const trimmedReflection = reflection.trim();
  const hydratedEntryIdRef = useRef<string | null>(null);

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

  const reflectionsQuery = useQuery({
    queryKey: REFLECTIONS_QUERY_KEY(userId),
    queryFn: async () => {
      if (!userId) return [];
      return listProgramReflections(userId, 50);
    },
    enabled: Boolean(userId),
  });

  const entries = journalQuery.data ?? [];
  const editingEntry = useMemo(
    () => entries.find((entry) => entry.id === editingEntryId) ?? null,
    [editingEntryId, entries]
  );

  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Please sign in to save journal entries.');
      const trimmedReflection = reflection.trim();
      if (!trimmedReflection) throw new Error('Reflection is required.');

      const payload = {
        user_id: userId,
        entry_date: editingEntry?.entry_date ?? todayDate,
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
      await queryClient.invalidateQueries({ queryKey: ['journal-count', userId] });
      hydratedEntryIdRef.current = null;
      setEditingEntryId(null);
      setMood('');
      setCravingsLevel(null);
      setReflection('');
      Alert.alert('Saved', 'Your journal entry is saved. You can reopen it later if you want to refine it.');
    },
    onError: (error: Error) => {
      Alert.alert('Could not save entry', error.message);
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entry: JournalEntry) => {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;
      return entry;
    },
    onSuccess: async (deletedEntry) => {
      await queryClient.invalidateQueries({ queryKey: JOURNAL_QUERY_KEY(userId) });
      await queryClient.invalidateQueries({ queryKey: ['journal-today'] });
      await queryClient.invalidateQueries({ queryKey: ['journal-count', userId] });

      if (deletedEntry.id === editingEntryId || deletedEntry.entry_date === todayDate) {
        hydratedEntryIdRef.current = null;
        setEditingEntryId(null);
        setMood('');
        setCravingsLevel(null);
        setReflection('');
      }

      Alert.alert('Deleted', 'Your journal entry has been removed.');
    },
    onError: (error: Error) => {
      Alert.alert('Could not delete entry', error.message);
    },
  });

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const todayEntry = useMemo(
    () => entries.find((entry) => entry.entry_date === todayDate) ?? null,
    [entries, todayDate]
  );
  const canSaveEntry = trimmedReflection.length > 0 && !saveEntryMutation.isPending;

  useEffect(() => {
    if (editingEntryId && !editingEntry) {
      setEditingEntryId(null);
    }
  }, [editingEntry, editingEntryId]);

  useEffect(() => {
    if (editingEntry) {
      if (hydratedEntryIdRef.current === editingEntry.id) {
        return;
      }

      hydratedEntryIdRef.current = editingEntry.id;
      setMood(editingEntry.mood ?? '');
      setCravingsLevel(editingEntry.cravings_level ?? null);
      setReflection(editingEntry.reflection);
      return;
    }

    if (hydratedEntryIdRef.current !== null) {
      hydratedEntryIdRef.current = null;
      setMood('');
      setCravingsLevel(null);
      setReflection('');
    }
  }, [editingEntry]);

  const handleDeleteEntry = (entry: JournalEntry) => {
    if (deleteEntryMutation.isPending) {
      return;
    }

    Alert.alert(
      'Delete journal entry?',
      'This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEntryMutation.mutate(entry),
        },
      ]
    );
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
  };

  const handleCancelEditing = () => {
    hydratedEntryIdRef.current = null;
    setEditingEntryId(null);
  };

  const handleOpenReflection = (programSlug: string, dayNumber: number) => {
    router.push(`/day-detail?programSlug=${programSlug}&dayNumber=${dayNumber}` as Href);
  };

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

            <View className="mb-6 rounded-2xl bg-sage/50 border border-forest/5 px-4 py-4">
              <Text className="font-satoshi-medium text-[11px] uppercase tracking-[2px] text-forest/35 mb-1">
                Daily Journal
              </Text>
              <Text className="font-satoshi text-[14px] leading-6 text-forest/60">
                One entry per day. Keep it meaningful, then update it only if your day genuinely shifts.
              </Text>
            </View>

            {editingEntry ? (
              <View className="mb-6 rounded-2xl bg-sage/50 border border-forest/5 px-4 py-3">
                <Text className="font-satoshi-medium text-[11px] uppercase tracking-[2px] text-forest/35 mb-1">
                  Editing Journal Entry
                </Text>
                <Text className="font-satoshi text-[14px] leading-6 text-forest/60">
                  You&apos;re editing your entry from{' '}
                  {new Date(editingEntry.entry_date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  .
                </Text>
                <Pressable onPress={handleCancelEditing} hitSlop={8} className="mt-3 self-start">
                  <Text className="font-satoshi-medium text-[12px] uppercase tracking-[1.5px] text-forest/60">
                    Cancel Editing
                  </Text>
                </Pressable>
              </View>
            ) : todayEntry ? (
              <View className="mb-6 rounded-2xl bg-sage/50 border border-forest/5 px-4 py-3">
                <Text className="font-satoshi-medium text-[11px] uppercase tracking-[2px] text-forest/35 mb-1">
                  Today&apos;s Entry
                </Text>
                <Text className="font-satoshi text-[14px] leading-6 text-forest/60">
                  You already have an entry for today. The form is clear right now, and you can reopen that entry only when you want to update it.
                </Text>
                <Pressable onPress={() => handleEditEntry(todayEntry)} hitSlop={8} className="mt-3 self-start">
                  <Text className="font-satoshi-medium text-[12px] uppercase tracking-[1.5px] text-forest/60">
                    Open Today&apos;s Entry
                  </Text>
                </Pressable>
              </View>
            ) : null}

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
                  {saveEntryMutation.isPending
                    ? 'Saving...'
                    : editingEntry
                      ? 'Update Entry'
                      : 'Save Entry'}
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
            <View className="mb-6 flex-row rounded-full bg-white/70 border border-forest/5 p-1">
              <Pressable
                onPress={() => setArchiveTab('journal_entries')}
                className={`flex-1 rounded-full px-4 py-3 ${archiveTab === 'journal_entries' ? 'bg-forest' : 'bg-transparent'}`}
              >
                <Text
                  className={`text-center font-satoshi-medium text-[12px] uppercase tracking-[1.5px] ${
                    archiveTab === 'journal_entries' ? 'text-white' : 'text-forest/55'
                  }`}
                >
                  Journal Entries
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setArchiveTab('reflections')}
                className={`flex-1 rounded-full px-4 py-3 ${archiveTab === 'reflections' ? 'bg-forest' : 'bg-transparent'}`}
              >
                <Text
                  className={`text-center font-satoshi-medium text-[12px] uppercase tracking-[1.5px] ${
                    archiveTab === 'reflections' ? 'text-white' : 'text-forest/55'
                  }`}
                >
                  Reflections
                </Text>
              </Pressable>
            </View>

            {archiveTab === 'journal_entries' ? (
              journalQuery.isPending ? (
                <Text className="font-satoshi text-forest/30 px-1">Loading entries...</Text>
              ) : journalQuery.error ? (
                <Text className="font-satoshi text-danger px-1">Could not load journal history.</Text>
              ) : entries.length === 0 ? (
                <View className="py-12 items-center">
                  <Text className="font-erode-medium text-[20px] text-forest/20 mb-2">
                    No journal entries yet
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
                      <View className="mb-3 flex-row items-start justify-between gap-4">
                        <Text className="font-erode-medium text-[18px] text-forest flex-1">
                          {new Date(entry.entry_date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                        <View className="items-end gap-3">
                          <Pressable
                            onPress={() => handleEditEntry(entry)}
                            hitSlop={8}
                          >
                            <Text className="font-satoshi-medium text-[12px] uppercase tracking-[1.5px] text-forest/60">
                              Edit
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteEntry(entry)}
                            disabled={deleteEntryMutation.isPending}
                            hitSlop={8}
                          >
                            <Text className="font-satoshi-medium text-[12px] uppercase tracking-[1.5px] text-danger">
                              Delete
                            </Text>
                          </Pressable>
                        </View>
                      </View>

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

                      <Text className="font-satoshi text-[15px] leading-[26px] text-forest/70">
                        {entry.reflection}
                      </Text>
                    </View>
                  ))}
                </View>
              )
            ) : reflectionsQuery.isPending ? (
              <Text className="font-satoshi text-forest/30 px-1">Loading reflections...</Text>
            ) : reflectionsQuery.error ? (
              <Text className="font-satoshi text-danger px-1">Could not load program reflections.</Text>
            ) : (reflectionsQuery.data?.length ?? 0) === 0 ? (
              <View className="py-12 items-center">
                <Text className="font-erode-medium text-[20px] text-forest/20 mb-2">
                  No reflections yet
                </Text>
                <Text className="font-satoshi text-[14px] text-forest/20">
                  Your guided program reflections will appear here.
                </Text>
              </View>
            ) : (
              <View className="gap-5">
                {reflectionsQuery.data?.map((item) => (
                  <View
                    key={item.id}
                    className="rounded-3xl bg-white/70 border border-forest/5 p-6"
                  >
                    <View className="mb-3 flex-row items-start justify-between gap-4">
                      <View className="flex-1">
                        <Text className="font-satoshi-medium text-[11px] uppercase tracking-[2px] text-forest/35 mb-2">
                          {item.programName} · Day {item.dayNumber}
                        </Text>
                        <Text className="font-erode-medium text-[18px] leading-[26px] text-forest">
                          {item.prompt}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleOpenReflection(item.programSlug, item.dayNumber)}
                        hitSlop={8}
                      >
                        <Text className="font-satoshi-medium text-[12px] uppercase tracking-[1.5px] text-forest/60">
                          Open in Program
                        </Text>
                      </Pressable>
                    </View>

                    <Text className="font-satoshi text-[15px] leading-[26px] text-forest/70">
                      {item.reflection}
                    </Text>

                    <Text className="mt-4 font-satoshi text-[12px] text-forest/35">
                      Updated {new Date(item.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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
