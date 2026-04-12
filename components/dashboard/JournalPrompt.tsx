import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppColors } from '@/constants/theme';

export function JournalPrompt() {
    const router = useRouter();
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const todayDate = new Date().toISOString().slice(0, 10);

    // Check if user has journaled today
    const todayEntryQuery = useQuery({
        queryKey: ['journal-today', userId, todayDate],
        queryFn: async () => {
            if (!userId) return null;
            const { data, error } = await supabase
                .from('journal_entries')
                .select('id')
                .eq('user_id', userId)
                .eq('entry_date', todayDate)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: Boolean(userId),
    });

    const hasJournaledToday = Boolean(todayEntryQuery.data);

    if (hasJournaledToday) {
        // Reflected today badge — quiet, affirming
        return (
            <View className="mb-6 flex-row items-center justify-center gap-2 py-3">
                <IconSymbol name="checkmark.circle.fill" size={14} color={AppColors.success} />
                <Text className="font-satoshi-medium text-[13px] tracking-[0.5px] text-success">
                    Reflected today
                </Text>
            </View>
        );
    }

    return (
        <Pressable
            onPress={() => router.push('/journal' as Href)}
            className="mb-6"
        >
            <View className="rounded-2xl bg-sage/50 border border-forest/5 px-5 py-4 flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                    <Text className="font-satoshi-medium text-[11px] uppercase tracking-[2px] text-forest/35 mb-1">
                        Daily Check-in
                    </Text>
                    <Text className="font-erode-medium text-[18px] leading-[24px] text-forest">
                        How are you feeling right now?
                    </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={AppColors.forest} />
            </View>
        </Pressable>
    );
}
