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

export function ExplorePrograms() {
    const { access } = useProfile();
    const router = useRouter();

    const ownedSlug = access.ownedProgram as ProgramSlug | null;

    if (ownedSlug) {
        return null;
    }

    // Filter to non-owned programs
    const allSlugs = Object.keys(PROGRAM_METADATA) as ProgramSlug[];
    const exploreSlugs = allSlugs.filter((slug) => slug !== ownedSlug);

    if (exploreSlugs.length === 0) return null;

    return (
        <View className="mb-6">
            <Text className="font-erode-semibold text-[22px] text-forest mb-1">
                Explore Programs
            </Text>
            <Text className="font-satoshi text-[13px] text-forest/35 mb-4">
                Unlock a new path for your journey
            </Text>

            <View className="gap-3">
                {exploreSlugs.map((slug) => {
                    const program = PROGRAM_METADATA[slug];

                    return (
                        <Pressable
                            key={slug}
                            onPress={() => router.push(`/paywall?program=${slug}` as Href)}
                        >
                            <View className="rounded-2xl border border-forest/6 bg-white/60 px-5 py-4 flex-row items-center justify-between opacity-70">
                                <View className="flex-1 mr-4">
                                    <Text className="font-satoshi-bold text-[15px] text-forest mb-0.5">
                                        {program.name}
                                    </Text>
                                    <Text className="font-satoshi text-[12px] text-forest/35" numberOfLines={1}>
                                        {program.totalDays} days · {CATEGORY_LABELS[program.category] ?? program.category}
                                    </Text>
                                </View>
                                <IconSymbol name="lock.fill" size={14} color={AppColors.forest} style={{ opacity: 0.25 }} />
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
