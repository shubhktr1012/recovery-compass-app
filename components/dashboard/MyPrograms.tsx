import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { useProfile } from '@/providers/profile';
import type { ProgramSlug } from '@/types/content';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppColors } from '@/constants/theme';

const CATEGORY_LABELS: Record<string, string> = {
    smoking: 'Smoking',
    sleep: 'Sleep',
    energy: 'Energy',
    aging: 'Longevity',
    sexual_health: 'Vitality',
};

export function MyPrograms() {
    const { access } = useProfile();
    const router = useRouter();

    // For now, we show the single owned program
    // When multi-program support is wired through the access snapshot, 
    // this will iterate over access.ownedPrograms
    const ownedSlug = access.ownedProgram as ProgramSlug | null;
    if (!ownedSlug) return null;

    const program = PROGRAM_METADATA[ownedSlug];
    if (!program) return null;

    return (
        <View className="mb-6">
            <Text className="font-erode-semibold text-[22px] text-forest mb-3">
                My Programs
            </Text>

            <Pressable
                onPress={() => router.push('/(tabs)/program' as Href)}
            >
                <View className="rounded-2xl border border-forest/8 bg-white px-5 py-4 flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                        <View className="flex-row items-center gap-2 mb-1">
                            <Text className="font-satoshi-bold text-[16px] text-forest">
                                {program.name}
                            </Text>
                            <View className="bg-sage px-2 py-0.5 rounded-md">
                                <Text className="font-satoshi-bold text-[9px] uppercase tracking-[1.5px] text-success">
                                    Active
                                </Text>
                            </View>
                        </View>
                        <Text className="font-satoshi text-[13px] text-forest/40">
                            {program.totalDays} days · {CATEGORY_LABELS[program.category] ?? program.category}
                        </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={AppColors.forest} style={{ opacity: 0.3 }} />
                </View>
            </Pressable>
        </View>
    );
}
