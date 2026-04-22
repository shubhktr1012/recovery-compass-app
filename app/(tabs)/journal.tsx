import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { Svg, Path, G, Circle } from 'react-native-svg';
import { CravingsDragger } from '@/components/journal/CravingsDragger';
import { MoodChips } from '@/components/journal/MoodChips';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { listProgramReflections } from '@/lib/api/program-reflections';
import { AppColors } from '@/constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { JournalWatermark } from '@/components/ui/TabWatermarks';

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

export default function JournalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [moods, setMoods] = useState<string[]>([]);
  const [cravingsLevel, setCravingsLevel] = useState<number | null>(null);
  const [reflection, setReflection] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [activeArchiveTab, setActiveArchiveTab] = useState<'journal' | 'reflections'>('journal');
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

  const pastEntries = useMemo(() => {
    const combined = [
      ...(journalQuery.data || []).map(e => ({ ...e, type: 'journal' as const, dateToSort: e.entry_date })),
      ...(reflectionsQuery.data || []).map(r => ({
        ...r,
        type: 'reflection' as const,
        dateToSort: r.updatedAt
      }))
    ];
    return combined.sort((a, b) => new Date(b.dateToSort).getTime() - new Date(a.dateToSort).getTime());
  }, [journalQuery.data, reflectionsQuery.data]);

  const journalStats = useMemo(() => {
    if (!entries || entries.length === 0) return null;
    
    let streak = 0;
    const sortedDates = Array.from(new Set(entries.map(e => e.entry_date))).sort((a, b) => b.localeCompare(a));
    
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    
    let currentDateStr = sortedDates[0];
    if (currentDateStr === today || currentDateStr === yesterday) {
      streak = 1;
      let currentDate = new Date(currentDateStr);
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(currentDate.getTime() - 86400000).toISOString().slice(0, 10);
        if (sortedDates[i] === prevDate) {
          streak++;
          currentDate = new Date(prevDate);
        } else {
          break;
        }
      }
    }

    const entriesWithCraving = entries.filter(e => e.cravings_level !== null);
    const avgCraving = entriesWithCraving.length > 0 
      ? Math.round(entriesWithCraving.reduce((acc, curr) => acc + (curr.cravings_level || 0), 0) / entriesWithCraving.length * 10) / 10
      : null;
      
    return { streak, total: entries.length, avgCraving };
  }, [entries]);

  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Please sign in to save journal entries.');
      const trimmedReflection = reflection.trim();

      const payload = {
        user_id: userId,
        entry_date: editingEntry?.entry_date ?? todayDate,
        mood: moods.length > 0 ? moods.join(', ') : null,
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
      setMoods([]);
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
        setMoods([]);
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
  const canSaveEntry = (moods.length > 0 || trimmedReflection.length > 0) && !saveEntryMutation.isPending;

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
      setMoods(editingEntry.mood ? editingEntry.mood.split(', ') : []);
      setCravingsLevel(editingEntry.cravings_level ?? null);
      setReflection(editingEntry.reflection);
      return;
    }

    if (hydratedEntryIdRef.current !== null) {
      hydratedEntryIdRef.current = null;
      setMoods([]);
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
  const softShadow = { shadowColor: '#06290C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 4 };
  const reflections = reflectionsQuery.data || [];
  const journalEntries = entries;
  const todayFormatted = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View className="flex-1 bg-forest">
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ─── Forest Header ─── */}
          <SafeAreaView edges={['top']} className="bg-forest">
            <View className="bg-forest px-6 pt-3 pb-[56px] overflow-hidden relative">
              <JournalWatermark
                width={280}
                height={170}
                opacity={0.06}
                style={{ position: 'absolute', right: -20, top: 10}}
              />

              <Text className="font-satoshi-medium text-[11px] uppercase tracking-[2.4px] text-sage/55 relative z-10 mt-8">
                Your reflections
              </Text>
              <Text className="font-erode-medium text-[34px] leading-[37px] tracking-tight text-white relative z-10 mt-1.5">
                Journal
              </Text>

              {journalStats && journalStats.total > 0 ? (
                <View className="flex-row mt-[18px] relative z-10">
                  <View className="pr-5 mr-5" style={{ borderRightWidth: 1, borderRightColor: 'rgba(227,243,229,0.15)' }}>
                    <Text className="font-erode-medium text-[22px] text-white tracking-tight" style={{ lineHeight: 22 }}>{journalStats.total}</Text>
                    <Text className="font-satoshi-medium text-[9px] uppercase tracking-[2px] text-sage/45 mt-1">Entries</Text>
                  </View>
                  {journalStats.streak > 0 && (
                    <View className="pr-5 mr-5" style={{ borderRightWidth: 1, borderRightColor: 'rgba(227,243,229,0.15)' }}>
                      <Text className="font-erode-medium text-[22px] text-white tracking-tight" style={{ lineHeight: 22 }}>{journalStats.streak}</Text>
                      <Text className="font-satoshi-medium text-[9px] uppercase tracking-[2px] text-sage/45 mt-1">Day streak</Text>
                    </View>
                  )}
                  {journalStats.avgCraving !== null && (
                    <View>
                      <Text className="font-erode-medium text-[22px] text-white tracking-tight" style={{ lineHeight: 22 }}>{journalStats.avgCraving}</Text>
                      <Text className="font-satoshi-medium text-[9px] uppercase tracking-[2px] text-sage/45 mt-1">Avg craving</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text className="font-satoshi text-[13px] text-sage/55 leading-[19px] mt-2 relative z-10">
                  A quiet place to notice what's shifting.
                </Text>
              )}
            </View>
          </SafeAreaView>

          {/* ─── Content Overlay ─── */}
          <View className="bg-surface rounded-t-[28px] -mt-7 pt-6 px-5 pb-40 relative z-20">
            <PaperGrain />

            {/* Today section eyebrow */}
            <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(6,41,12,0.35)', marginBottom: 14, paddingLeft: 2 }}>
              Today · {todayFormatted}
            </Text>



            {/* ─── Entry Card ─── */}
            <View className="rounded-3xl bg-white overflow-hidden mb-6" style={softShadow}>
              {/* Prompt Strip */}
              <View style={{ backgroundColor: '#EEF6EF', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 }}>
                <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(6,41,12,0.45)', marginBottom: 8 }}>
                  Today's entry
                </Text>
                <Text className="font-erode-medium text-[23px] text-forest tracking-tight" style={{ lineHeight: 28 }}>
                  How are you <Text className="font-erode-medium-italic" style={{ color: 'rgba(6,41,12,0.65)' }}>feeling?</Text>
                </Text>
              </View>

              {/* Form Body */}
              <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 }}>
                {/* Mood */}
                <View style={{ marginBottom: 18 }}>
                  <MoodChips value={moods} onChange={setMoods} />
                </View>

                {/* Cravings */}
                <View style={{ marginBottom: 18 }}>
                  <CravingsDragger value={cravingsLevel} onChange={setCravingsLevel} />
                </View>

                {/* Reflection */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'Satoshi-SemiBold', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(6,41,12,0.45)', marginBottom: 8 }}>
                    Reflection
                  </Text>
                  <TextInput
                    style={{
                      width: '100%', minHeight: 80, borderWidth: 1,
                      borderColor: trimmedReflection ? 'rgba(6,41,12,0.12)' : AppColors.hairline,
                      borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
                      fontFamily: 'Satoshi-Regular', fontSize: 14, color: AppColors.forest,
                      backgroundColor: trimmedReflection ? '#FFFFFF' : AppColors.surface,
                      lineHeight: 22, textAlignVertical: 'top',
                    }}
                    placeholderTextColor="rgba(6,41,12,0.28)"
                    placeholder="What helped today? What felt hard?"
                    value={reflection}
                    onChangeText={setReflection}
                    multiline
                  />
                </View>

                {/* Save Button */}
                <Pressable
                  onPressIn={() => { if (canSaveEntry) btnScale.value = withTiming(0.96, { duration: 180, easing: Easing.inOut(Easing.cubic) }); }}
                  onPressOut={() => { if (canSaveEntry) btnScale.value = withTiming(1, { duration: 240, easing: Easing.inOut(Easing.cubic) }); }}
                  onPress={() => saveEntryMutation.mutate()}
                  disabled={!canSaveEntry}
                >
                  <Animated.View
                    style={[btnStyle, {
                      width: '100%', paddingVertical: 15, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 16,
                      backgroundColor: canSaveEntry ? AppColors.forest : 'rgba(6,41,12,0.12)',
                    }]}
                  >
                    <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 15, letterSpacing: -0.08, color: canSaveEntry ? '#fff' : 'rgba(6,41,12,0.28)' }}>
                      {saveEntryMutation.isPending ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
                    </Text>
                  </Animated.View>
                </Pressable>
              </View>
            </View>

            {/* ─── Archive Divider ─── */}
            <View style={{ height: 1, backgroundColor: AppColors.hairline, marginTop: 28, marginBottom: 16 }} />

            {/* Archive Eyebrow */}
            <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(6,41,12,0.35)', marginBottom: 18, paddingLeft: 2 }}>
              Past entries
            </Text>

            {/* Segmented Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: AppColors.surface, borderRadius: 999, padding: 3, marginBottom: 18 }}>
              <Pressable onPress={() => setActiveArchiveTab('journal')} style={{ flex: 1 }}>
                <View style={{
                  paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, alignItems: 'center',
                  backgroundColor: activeArchiveTab === 'journal' ? '#FFFFFF' : 'transparent',
                  ...(activeArchiveTab === 'journal' ? { shadowColor: '#06290C', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 } : {}),
                }}>
                  <Text style={{ fontFamily: 'Satoshi-SemiBold', fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase', color: activeArchiveTab === 'journal' ? AppColors.forest : 'rgba(6,41,12,0.45)' }}>
                    Journal
                  </Text>
                </View>
              </Pressable>
              <Pressable onPress={() => setActiveArchiveTab('reflections')} style={{ flex: 1 }}>
                <View style={{
                  paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, alignItems: 'center',
                  backgroundColor: activeArchiveTab === 'reflections' ? '#FFFFFF' : 'transparent',
                  ...(activeArchiveTab === 'reflections' ? { shadowColor: '#06290C', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 } : {}),
                }}>
                  <Text style={{ fontFamily: 'Satoshi-SemiBold', fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase', color: activeArchiveTab === 'reflections' ? AppColors.forest : 'rgba(6,41,12,0.45)' }}>
                    Reflections
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* ─── Archive Content ─── */}
            {activeArchiveTab === 'journal' ? (
              journalEntries.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: AppColors.sage, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.5)" strokeWidth="1.5" strokeLinecap="round">
                      <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </Svg>
                  </View>
                  <Text className="font-erode-medium text-[22px] text-forest tracking-tight" style={{ fontStyle: 'italic' }}>No entries yet.</Text>
                  <Text className="font-satoshi text-[13px] text-forest/45 leading-[20px] mt-2 text-center" style={{ maxWidth: 220 }}>
                    Your first reflection starts above. Even a few words are enough.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {journalEntries.map((entry) => (
                    <Pressable key={`j-${entry.id}`} onPress={() => handleEditEntry(entry)}>
                      <View style={[{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16 }, softShadow]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <Text style={{ fontFamily: 'Satoshi-SemiBold', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(6,41,12,0.45)' }}>
                            {new Date(entry.entry_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                            {entry.mood && entry.mood.split(', ').slice(0, 2).map(m => (
                              <View key={m} style={{ backgroundColor: AppColors.sage, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 }}>
                                <Text style={{ fontFamily: 'Satoshi-SemiBold', fontSize: 9, letterSpacing: 0.4, color: AppColors.forest }}>{m}</Text>
                              </View>
                            ))}
                            {entry.cravings_level !== null && (
                              <View style={{ backgroundColor: 'rgba(6,41,12,0.06)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 }}>
                                <Text style={{ fontFamily: 'Satoshi-SemiBold', fontSize: 9, letterSpacing: 0.4, color: 'rgba(6,41,12,0.62)' }}>{entry.cravings_level} / 10</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {entry.reflection ? (
                          <Text numberOfLines={3} style={{ fontFamily: 'Satoshi-Regular', fontSize: 13, lineHeight: 21, color: 'rgba(6,41,12,0.62)' }}>
                            {entry.reflection}
                          </Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(6,41,12,0.05)' }}>
                          <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
                            <Pressable onPress={() => handleEditEntry(entry)} hitSlop={10} style={{ paddingVertical: 4 }}>
                              <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 12, letterSpacing: 0.3, color: 'rgba(6,41,12,0.55)' }}>Edit</Text>
                            </Pressable>
                            <Pressable onPress={() => handleDeleteEntry(entry)} disabled={deleteEntryMutation.isPending} hitSlop={10} style={{ paddingVertical: 4 }}>
                              <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 12, letterSpacing: 0.3, color: 'rgba(6,41,12,0.3)' }}>Delete</Text>
                            </Pressable>
                          </View>
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.22)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M9 18l6-6-6-6"/>
                          </Svg>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )
            ) : (
              reflections.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: AppColors.sage, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.5)" strokeWidth="1.5" strokeLinecap="round">
                      <Path d="M20 4C10 4 4 10 4 20c8 0 16-6 16-16zM4 20C8 16 12 12 20 4"/>
                    </Svg>
                  </View>
                  <Text className="font-erode-medium text-[22px] text-forest tracking-tight" style={{ fontStyle: 'italic' }}>No reflections yet.</Text>
                  <Text className="font-satoshi text-[13px] text-forest/45 leading-[20px] mt-2 text-center" style={{ maxWidth: 220 }}>
                    Reflections from your program will appear here.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {reflections.map((ref: any) => (
                    <Pressable key={`r-${ref.id}`} onPress={() => handleOpenReflection(ref.programSlug, ref.dayNumber)}>
                      <View style={{ backgroundColor: '#EEF6EF', borderRadius: 20, borderLeftWidth: 3, borderLeftColor: AppColors.sage, paddingHorizontal: 18, paddingVertical: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: AppColors.sage, alignItems: 'center', justifyContent: 'center' }}>
                            <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={AppColors.forest} strokeWidth="2" strokeLinecap="round">
                              <Path d="M20 4C10 4 4 10 4 20c8 0 16-6 16-16zM4 20C8 16 12 12 20 4"/>
                            </Svg>
                          </View>
                          <Text style={{ fontFamily: 'Satoshi-SemiBold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(6,41,12,0.45)' }}>
                            Program reflection · Day {ref.dayNumber}
                          </Text>
                        </View>
                        <Text className="font-erode-medium text-[17px] text-forest leading-[23px] tracking-tight mb-2" style={{ fontStyle: 'italic' }}>
                          "{ref.prompt}"
                        </Text>
                        <Text style={{ fontFamily: 'Satoshi-Regular', fontSize: 13, lineHeight: 21, color: 'rgba(6,41,12,0.62)' }}>
                          {ref.reflection}
                        </Text>
                        <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(6,41,12,0.28)', marginTop: 10 }}>
                          {new Date(ref.updatedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
