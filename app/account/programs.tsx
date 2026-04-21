import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { usePrograms } from '@/content';
import { useOwnedPrograms } from '@/hooks/useOwnedPrograms';
import { useProfile } from '@/providers/profile';
import { ProgramIcon } from '@/components/dashboard/ExplorePrograms';
import { SkeletonCircle, SkeletonLine, SkeletonTitle } from '@/components/ui/Skeleton';
import type { ProgramContent } from '@/types/content';

function ProgramLibraryCard({
  program,
  eyebrow,
  body,
  dark = false,
  actionLabel,
  onPress,
}: {
  program: ProgramContent;
  eyebrow: string;
  body: string;
  dark?: boolean;
  actionLabel?: string;
  onPress?: () => void;
}) {
  const CardComponent = onPress ? Pressable : View;

  return (
    <CardComponent
      onPress={onPress}
      className={`rounded-[24px] p-5 border ${dark ? 'bg-forest border-forest/80' : 'bg-white border-forest/5'} shadow-sm shadow-forest/5`}
    >
      <View className="flex-row items-start gap-3.5">
        <View className="w-[48px] h-[48px] rounded-[18px] items-center justify-center shrink-0 bg-sageSoft">
          <ProgramIcon category={program.category} />
        </View>
        <View className="flex-1">
          <Text className={`font-satoshi-bold uppercase text-[9px] tracking-[0.18em] ${dark ? 'text-sage/55' : 'text-forest/40'}`}>
            {eyebrow}
          </Text>
          <Text className={`font-erode-medium text-[20px] leading-tight mt-1 ${dark ? 'text-white' : 'text-forest'}`}>
            {program.name}
          </Text>
          <Text className={`font-satoshi text-[12px] leading-relaxed mt-1.5 ${dark ? 'text-white/60' : 'text-forest/55'}`}>
            {body}
          </Text>
          <View className="flex-row items-center flex-wrap gap-2 mt-3">
            <View className={`${dark ? 'bg-white/8 border border-white/10' : 'bg-sageSoft'} rounded-full px-2.5 py-1`}>
              <Text className={`font-satoshi-bold uppercase text-[8px] tracking-[0.12em] ${dark ? 'text-sage/75' : 'text-forest/65'}`}>
                {program.totalDays} days
              </Text>
            </View>
            {program.hasAudio ? (
              <View className={`${dark ? 'bg-white/8 border border-white/10' : 'bg-sageSoft'} rounded-full px-2.5 py-1`}>
                <Text className={`font-satoshi-bold uppercase text-[8px] tracking-[0.12em] ${dark ? 'text-sage/75' : 'text-forest/65'}`}>
                  Guided audio
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {actionLabel ? (
        <View className="mt-4 flex-row justify-end">
          <View className={`${dark ? 'bg-white/10' : 'bg-forest'} rounded-full px-4 py-2`}>
            <Text className={`font-satoshi-medium text-[12px] ${dark ? 'text-white' : 'text-white'}`}>
              {actionLabel}
            </Text>
          </View>
        </View>
      ) : null}
    </CardComponent>
  );
}

function ProgramsSkeleton() {
  return (
    <View className="gap-3">
      {[0, 1].map((index) => (
        <View key={index} className="bg-white rounded-[24px] border border-forest/5 p-5 shadow-sm shadow-forest/5">
          <View className="flex-row gap-3.5 items-start">
            <SkeletonCircle className="bg-forest/10" />
            <View className="flex-1 pt-1">
              <SkeletonLine className="bg-forest/10" width="34%" />
              <SkeletonTitle className="bg-forest/10 mt-3" />
              <SkeletonLine className="bg-forest/10 mt-3" width="88%" />
              <SkeletonLine className="bg-forest/10 mt-2" width="72%" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ProgramsLibraryScreen() {
  const router = useRouter();
  const { programs } = usePrograms();
  const { ownedPrograms, isLoading } = useOwnedPrograms();
  const { access } = useProfile();

  const activeProgramSlug = access.ownedProgram ?? null;

  const { activeProgram, otherOwnedPrograms } = useMemo(() => {
    const ownedSlugSet = new Set([
      ...(activeProgramSlug ? [activeProgramSlug] : []),
      ...ownedPrograms.map((entry) => entry.slug),
    ]);

    const ownedCatalog = programs.filter((program) => ownedSlugSet.has(program.slug));
    const activeProgram = activeProgramSlug
      ? ownedCatalog.find((program) => program.slug === activeProgramSlug) ?? null
      : null;
    const otherOwnedPrograms = ownedCatalog.filter((program) => program.slug !== activeProgramSlug);

    return {
      activeProgram,
      otherOwnedPrograms,
    };
  }, [activeProgramSlug, ownedPrograms, programs]);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="px-6 pt-4 pb-24">
        <Pressable
          onPress={() => router.back()}
          hitSlop={20}
          className="self-start mb-8 h-11 w-11 items-center justify-center rounded-full border border-forest/10 bg-white"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="#06290C" />
        </Pressable>

        <View className="mb-8">
          <Text className="font-erode-medium text-[34px] leading-[38px] tracking-[-0.02em] text-forest">
            My programs
          </Text>
          <Text className="font-satoshi text-[15px] leading-6 text-forest/60 mt-3 pr-6">
            Your dashboard stays focused on the journey you are actively moving through. The rest of your unlocked library lives here.
          </Text>
        </View>

        {isLoading ? (
          <ProgramsSkeleton />
        ) : (
          <View className="gap-4">
            {activeProgram ? (
              <ProgramLibraryCard
                program={activeProgram}
                eyebrow="Current journey"
                body="This is the program currently pinned to your dashboard and day flow."
                dark
                actionLabel="Open program"
                onPress={() => router.push('/(tabs)/program')}
              />
            ) : null}

            <View className="pt-1">
              <Text className="font-satoshi-bold uppercase text-[10px] tracking-[0.18em] text-forest/42 mb-3">
                Unlocked library
              </Text>

              {otherOwnedPrograms.length === 0 ? (
                <View className="bg-white rounded-[24px] border border-forest/5 p-5 shadow-sm shadow-forest/5">
                  <Text className="font-satoshi text-[13px] leading-6 text-forest/55">
                    Additional unlocked programs will appear here as you add them to your library.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {otherOwnedPrograms.map((program) => (
                    <ProgramLibraryCard
                      key={program.slug}
                      program={program}
                      eyebrow="Unlocked"
                      body="Available in your library and ready whenever you want to explore it next."
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
