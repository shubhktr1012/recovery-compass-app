import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { usePrograms } from '@/content';
import { useOwnedPrograms } from '@/hooks/useOwnedPrograms';
import { useProfile } from '@/providers/profile';
import { ProgramIcon } from '@/components/dashboard/ExplorePrograms';
import { SkeletonCircle, SkeletonLine, SkeletonTitle } from '@/components/ui/Skeleton';
import { AppTypography } from '@/constants/typography';
import type { ProgramContent, ProgramSlug } from '@/types/content';
import { getJourneyForProgramSlug, getStoredOnboardingJourney } from '@/lib/onboarding.realignment';
import { supabase } from '@/lib/supabase';

function ProgramLibraryCard({
  program,
  eyebrow,
  body,
  dark = false,
  actionLabel,
  notice,
  onPress,
  disabled = false,
}: {
  program: ProgramContent;
  eyebrow: string;
  body: string;
  dark?: boolean;
  actionLabel?: string;
  notice?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const CardComponent = onPress ? Pressable : View;

  return (
    <CardComponent
      onPress={onPress}
      disabled={disabled}
      className={`rounded-[24px] p-5 border ${dark ? 'bg-forest border-forest/80' : 'bg-white border-forest/5'} shadow-sm shadow-forest/5`}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View className="flex-row items-start gap-3.5">
        <View className="w-[48px] h-[48px] rounded-[18px] items-center justify-center shrink-0 bg-sageSoft">
          <ProgramIcon category={program.category} />
        </View>
        <View className="flex-1">
          <Text
            className={`uppercase ${dark ? 'text-sage/55' : 'text-forest/40'}`}
            style={[AppTypography.eyebrow, { letterSpacing: 1.76 }]}
          >
            {eyebrow}
          </Text>
          <Text className={`mt-1 ${dark ? 'text-white' : 'text-forest'}`} style={AppTypography.displayCardMd}>
            {program.name}
          </Text>
            <Text
              className={`mt-1.5 ${dark ? 'text-white/60' : 'text-forest/55'}`}
              style={AppTypography.meta}
            >
              {body}
            </Text>
          {notice ? (
            <Text className={`mt-2 ${dark ? 'text-sage/80' : 'text-forest/55'}`} style={AppTypography.eyebrow}>
              {notice}
            </Text>
          ) : null}
          <View className="flex-row items-center flex-wrap gap-2 mt-3">
            <View className={`${dark ? 'bg-white/8 border border-white/10' : 'bg-sageSoft'} rounded-full px-2.5 py-1`}>
              <Text
                className={`uppercase ${dark ? 'text-sage/75' : 'text-forest/65'}`}
                style={[AppTypography.eyebrow, { letterSpacing: 1.1 }]}
              >
                {program.totalDays} days
              </Text>
            </View>
            {program.hasAudio ? (
              <View className={`${dark ? 'bg-white/8 border border-white/10' : 'bg-sageSoft'} rounded-full px-2.5 py-1`}>
                <Text
                  className={`uppercase ${dark ? 'text-sage/75' : 'text-forest/65'}`}
                  style={[AppTypography.eyebrow, { letterSpacing: 1.1 }]}
                >
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
            <Text className="text-white" style={AppTypography.metaMedium}>
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
  const { access, profile, selectActiveProgram } = useProfile();
  const [switchingProgram, setSwitchingProgram] = useState<ProgramSlug | null>(null);

  const activeProgramSlug = access.ownedProgram ?? null;
  const userId = profile?.id ?? null;

  const questionnaireRunsQuery = useQuery({
    queryKey: ['questionnaire-runs', userId, 'journeys'],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return [] as string[];
      }

      const { data, error } = await supabase
        .from('questionnaire_runs')
        .select('journey_key')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return Array.from(
        new Set((data ?? []).map((run) => run.journey_key).filter(Boolean))
      );
    },
    staleTime: 60 * 1000,
  });

  const completedJourneyKeys = useMemo(() => {
    const keys = new Set(questionnaireRunsQuery.data ?? []);
    const profileJourney = getStoredOnboardingJourney({
      questionnaireAnswers: profile?.questionnaire_answers ?? null,
      recommendedProgram: profile?.recommended_program ?? null,
    });

    if (profileJourney) {
      keys.add(profileJourney);
    }

    return keys;
  }, [profile?.questionnaire_answers, profile?.recommended_program, questionnaireRunsQuery.data]);

  const hasProgramPersonalization = useCallback(
    (programSlug: ProgramSlug) => {
      const journey = getJourneyForProgramSlug(programSlug);
      return Boolean(journey && completedJourneyKeys.has(journey));
    },
    [completedJourneyKeys]
  );

  const switchToProgram = useCallback(
    async (programSlug: ProgramSlug, options?: { personalize: boolean }) => {
      setSwitchingProgram(programSlug);

      try {
        await selectActiveProgram(programSlug);

        if (options?.personalize) {
          router.push({
            pathname: '/personalization',
            params: {
              mode: 'realign',
              program: programSlug,
            },
          });
        }
      } catch (error) {
        console.error('Failed to switch active program', error);
        Alert.alert(
          'Could not switch program',
          'Please try again in a moment. If this keeps happening, restore purchases and try again.'
        );
      } finally {
        setSwitchingProgram(null);
      }
    },
    [router, selectActiveProgram]
  );

  const handleSelectProgram = useCallback(
    (programSlug: ProgramSlug) => {
      if (!hasProgramPersonalization(programSlug)) {
        const programName = programs.find((program) => program.slug === programSlug)?.name ?? 'this program';
        Alert.alert(
          'Personalize this program?',
          `${programName} is unlocked, but its questionnaire is not complete yet.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Skip for now',
              onPress: () => void switchToProgram(programSlug, { personalize: false }),
            },
            {
              text: 'Personalize now',
              onPress: () => void switchToProgram(programSlug, { personalize: true }),
            },
          ]
        );
        return;
      }

      void switchToProgram(programSlug, { personalize: false });
    },
    [hasProgramPersonalization, programs, switchToProgram]
  );

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
          <Text className="tracking-[-0.02em] text-forest" style={AppTypography.displayHero}>
            My programs
          </Text>
          <Text className="text-forest/60 mt-3 pr-6" style={AppTypography.body}>
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
                notice={
                  hasProgramPersonalization(activeProgram.slug)
                    ? undefined
                    : 'Personalization not completed'
                }
                dark
                actionLabel="Open program"
                onPress={() => router.push('/(tabs)/program')}
              />
            ) : null}

            <View className="pt-1">
              <Text className="uppercase text-forest/42 mb-3" style={[AppTypography.eyebrow, { letterSpacing: 1.98 }]}>
                Unlocked library
              </Text>

              {otherOwnedPrograms.length === 0 ? (
                <View className="bg-white rounded-[24px] border border-forest/5 p-5 shadow-sm shadow-forest/5">
                  <Text className="text-forest/55" style={AppTypography.label}>
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
                      body="Available in your library. Set it as current to pin it to Home and the Program tab."
                      notice={
                        hasProgramPersonalization(program.slug)
                          ? undefined
                          : 'Personalization not completed'
                      }
                      actionLabel={switchingProgram === program.slug ? 'Switching...' : 'Set as current'}
                      disabled={Boolean(switchingProgram)}
                      onPress={() => handleSelectProgram(program.slug)}
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
