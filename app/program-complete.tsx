import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { AppColors } from '@/constants/theme';
import { AppTypography } from '@/constants/typography';
import { EMPTY_FINALIZED_DAY_STATES, useFinalizedDayStates } from '@/hooks/useFinalizedDayStates';
import { useOwnedPrograms } from '@/hooks/useOwnedPrograms';
import { useProfile } from '@/providers/profile';
import type { ProgramSlug } from '@/types/content';
import { canAccessOwnedProgramRecord, canAccessProgramContent, hasAnyProgramEntitlement, isFinishedProgramAccess } from '@/lib/access/entitlements';
import { buildDayStateProgressSummary, buildRollingCompletionSummary } from '@/lib/day-state-summary';
import { MY_PROGRAMS_ROUTE, PAYWALL_ROUTE, PROGRAM_START_ROUTE, PROGRAM_TAB_ROUTE } from '@/lib/navigation/routes';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { ProgramWatermark } from '@/components/ui/TabWatermarks';
import { PressableScale } from '@/components/motion/PressableScale';
import { ScreenEntrance } from '@/components/motion/ScreenEntrance';
import { MotionScale } from '@/lib/motion/tokens';

function isProgramSlug(value: unknown): value is ProgramSlug {
  return typeof value === 'string' && value in PROGRAM_METADATA;
}

function formatProgramName(name: string) {
  return name.replace(/^\d+-Day\s+/i, '');
}

export default function ProgramCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ programSlug?: string | string[] }>();
  const { ownedPrograms, isLoading: isOwnedProgramsLoading } = useOwnedPrograms();
  const { access, isLoading: isProfileLoading, profile, prepareOwnedProgramSetup } = useProfile();
  const [isPreparingNext, setIsPreparingNext] = useState(false);

  const programSlugParam = Array.isArray(params.programSlug)
    ? params.programSlug[0]
    : params.programSlug;
  const completedProgram = isProgramSlug(programSlugParam)
    ? PROGRAM_METADATA[programSlugParam]
    : null;
  const completedProgramSlug = completedProgram?.slug ?? null;
  const activeProgramAccessDecision = canAccessProgramContent(access, completedProgramSlug);
  const ownedProgramAccessDecision = canAccessOwnedProgramRecord(ownedPrograms, completedProgramSlug);
  const canAccessCompletionScreen = activeProgramAccessDecision.allowed || ownedProgramAccessDecision.allowed;
  const finalizedDayStatesQuery = useFinalizedDayStates(
    profile?.id ?? access.ownerUserId ?? null,
    completedProgramSlug
  );
  const finalizedDayStates = finalizedDayStatesQuery.data ?? EMPTY_FINALIZED_DAY_STATES;
  const dayStateSummary = useMemo(
    () => buildDayStateProgressSummary(finalizedDayStates),
    [finalizedDayStates]
  );
  const journeyCompletionSummary = useMemo(
    () => buildRollingCompletionSummary(finalizedDayStates, completedProgram?.totalDays ?? 999),
    [completedProgram?.totalDays, finalizedDayStates]
  );

  const nextOwnedProgram = useMemo(
    () =>
      ownedPrograms
        .filter(
          (program) =>
            program.programState === 'purchased' &&
            !isFinishedProgramAccess(program)
        )
        .sort((first, second) => {
          const firstRank = first.priorityRank ?? Number.MAX_SAFE_INTEGER;
          const secondRank = second.priorityRank ?? Number.MAX_SAFE_INTEGER;

          if (firstRank !== secondRank) {
            return firstRank - secondRank;
          }

          return (second.updatedAt ?? '').localeCompare(first.updatedAt ?? '');
        })[0] ?? null,
    [ownedPrograms]
  );
  const nextProgramMetadata = nextOwnedProgram ? PROGRAM_METADATA[nextOwnedProgram.slug] : null;
  const completedDaysCount = dayStateSummary.completedDays.length;
  const partialDaysCount = dayStateSummary.partialDays.length;
  const skippedDaysCount = dayStateSummary.skippedDays.length;
  const totalDays = completedProgram?.totalDays ?? Math.max(1, finalizedDayStates.length);
  const dayCoverageCount = Math.max(finalizedDayStates.length, totalDays);
  const cardCompletionLabel = journeyCompletionSummary.cardsTotal > 0
    ? `${journeyCompletionSummary.cardsCompleted}/${journeyCompletionSummary.cardsTotal}`
    : 'Saved';

  useEffect(() => {
    if (!canAccessCompletionScreen || isProfileLoading || isOwnedProgramsLoading) {
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, [canAccessCompletionScreen, isOwnedProgramsLoading, isProfileLoading]);

  if (isProfileLoading || isOwnedProgramsLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={AppColors.white} />
      </View>
    );
  }

  if (!canAccessCompletionScreen) {
    return <Redirect href={hasAnyProgramEntitlement(access) ? MY_PROGRAMS_ROUTE : PAYWALL_ROUTE} />;
  }

  const handleViewJourney = async () => {
    router.replace(PROGRAM_TAB_ROUTE);
  };

  const handleExplorePrograms = async () => {
    router.push(MY_PROGRAMS_ROUTE);
  };

  const handleSetUpNext = async () => {
    if (!nextOwnedProgram) {
      return;
    }

    setIsPreparingNext(true);

    try {
      await prepareOwnedProgramSetup(nextOwnedProgram.slug);
      router.replace(PROGRAM_START_ROUTE);
    } catch (error) {
      if (__DEV__) {
        console.log('Failed to prepare next owned program', error);
      }
      Alert.alert(
        'Could not set up the next program',
        'Open My Programs and try again. Your completed journey is already saved.'
      );
    } finally {
      setIsPreparingNext(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ProgramWatermark
        width={330}
        height={200}
        opacity={0.08}
        style={styles.watermark}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ScreenEntrance style={styles.hero}>
            <View style={styles.badge}>
              <Ionicons name="checkmark" size={28} color={AppColors.forest} />
            </View>
            <Text style={styles.eyebrow}>Journey Complete</Text>
            <Text style={styles.title}>
              {completedProgram
                ? `${formatProgramName(completedProgram.name)} is complete.`
                : 'Your program is complete.'}
            </Text>
            <Text style={styles.body}>
              {completedProgram
                ? `All ${completedProgram.totalDays} days are saved. You can revisit the full timeline anytime.`
                : 'Your journey is saved and available to revisit.'}
            </Text>
          </ScreenEntrance>

          <ScreenEntrance delay={120} distance={10} style={styles.sheet}>
            <PaperGrain />
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryEyebrow}>Journey summary</Text>
              <Text style={styles.summaryTitle}>Steady work counts.</Text>
              <Text style={styles.summaryBody}>
                Perfection was never the gate. This record shows how the journey closed.
              </Text>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{dayCoverageCount}</Text>
                <Text style={styles.metricLabel}>Days saved</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{journeyCompletionSummary.completionPercentage}%</Text>
                <Text style={styles.metricLabel}>Card score</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{dayStateSummary.bestStreak}</Text>
                <Text style={styles.metricLabel}>Best streak</Text>
              </View>
            </View>

            <View style={styles.dayBreakdown}>
              <View style={styles.breakdownRow}>
                <View style={[styles.breakdownDot, styles.completedDot]} />
                <Text style={styles.breakdownLabel}>Completed</Text>
                <Text style={styles.breakdownValue}>{completedDaysCount}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <View style={[styles.breakdownDot, styles.partialDot]} />
                <Text style={styles.breakdownLabel}>Partial</Text>
                <Text style={styles.breakdownValue}>{partialDaysCount}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <View style={[styles.breakdownDot, styles.skippedDot]} />
                <Text style={styles.breakdownLabel}>Missed</Text>
                <Text style={styles.breakdownValue}>{skippedDaysCount}</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownRow}>
                <Ionicons name="layers-outline" size={15} color={AppColors.subtleInk} />
                <Text style={styles.breakdownLabel}>Cards completed</Text>
                <Text style={styles.breakdownValue}>{cardCompletionLabel}</Text>
              </View>
            </View>

            {nextProgramMetadata ? (
              <View style={styles.nextCard}>
                <View style={styles.nextIcon}>
                  <Ionicons name="trail-sign-outline" size={20} color={AppColors.forest} />
                </View>
                <View style={styles.nextCopy}>
                  <Text style={styles.nextEyebrow}>Up next</Text>
                  <Text style={styles.nextTitle}>{nextProgramMetadata.name}</Text>
                  <Text style={styles.nextBody}>Queued and ready for Program Setup.</Text>
                </View>
              </View>
            ) : (
              <View style={styles.nextCard}>
                <View style={styles.nextIcon}>
                  <Ionicons name="leaf-outline" size={20} color={AppColors.forest} />
                </View>
                <View style={styles.nextCopy}>
                  <Text style={styles.nextEyebrow}>Saved</Text>
                  <Text style={styles.nextTitle}>Review anytime</Text>
                  <Text style={styles.nextBody}>Your completed journey stays open in My Programs.</Text>
                </View>
              </View>
            )}

            <PressableScale
              accessibilityRole="button"
              accessibilityState={{ busy: isPreparingNext }}
              disabled={isPreparingNext}
              pressScale={MotionScale.pressLarge}
              onPress={nextProgramMetadata ? handleSetUpNext : handleViewJourney}
              style={[
                styles.primaryButton,
                isPreparingNext ? styles.disabledButton : null,
              ]}
            >
              {isPreparingNext ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {nextProgramMetadata ? 'Set up next' : 'View completed journey'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={AppColors.white} />
                </>
              )}
            </PressableScale>

            <PressableScale
              accessibilityRole="button"
              onPress={nextProgramMetadata ? handleViewJourney : handleExplorePrograms}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                {nextProgramMetadata ? 'View completed journey' : 'Explore programs'}
              </Text>
            </PressableScale>
          </ScreenEntrance>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppColors.forest,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  watermark: {
    position: 'absolute',
    right: -78,
    top: 92,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
  },
  hero: {
    paddingTop: 36,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 32,
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  eyebrow: {
    ...AppTypography.eyebrow,
    color: 'rgba(255,255,255,0.56)',
    letterSpacing: 4,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  title: {
    ...AppTypography.displayHeroLarge,
    color: AppColors.white,
    maxWidth: 330,
  },
  body: {
    ...AppTypography.bodyLarge,
    color: 'rgba(255,255,255,0.58)',
    marginTop: 16,
    maxWidth: 320,
  },
  sheet: {
    backgroundColor: AppColors.canvas,
    borderRadius: 34,
    overflow: 'hidden',
    padding: 18,
  },
  summaryHeader: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  summaryEyebrow: {
    ...AppTypography.eyebrow,
    color: AppColors.subtleInk,
    letterSpacing: 2.2,
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  summaryTitle: {
    ...AppTypography.displaySectionTitle,
    color: AppColors.forest,
  },
  summaryBody: {
    ...AppTypography.bodyCompact,
    color: AppColors.subtleInk,
    marginTop: 5,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: AppColors.sageSoft,
    borderRadius: 20,
    flex: 1,
    minHeight: 96,
    padding: 16,
    justifyContent: 'center',
  },
  metricValue: {
    ...AppTypography.displayMetricSemibold,
    color: AppColors.forest,
  },
  metricLabel: {
    ...AppTypography.metaMedium,
    color: AppColors.subtleInk,
    marginTop: 8,
  },
  dayBreakdown: {
    backgroundColor: 'rgba(6,41,12,0.03)',
    borderRadius: 20,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  breakdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 32,
  },
  breakdownDot: {
    borderRadius: 5,
    height: 10,
    marginRight: 10,
    width: 10,
  },
  completedDot: {
    backgroundColor: AppColors.success,
  },
  partialDot: {
    backgroundColor: '#C0842F',
  },
  skippedDot: {
    backgroundColor: 'rgba(6,41,12,0.24)',
  },
  breakdownLabel: {
    ...AppTypography.metaMedium,
    color: AppColors.mutedInk,
    flex: 1,
    marginLeft: 8,
  },
  breakdownValue: {
    ...AppTypography.metaMedium,
    color: AppColors.forest,
  },
  breakdownDivider: {
    backgroundColor: 'rgba(6,41,12,0.07)',
    height: 1,
    marginVertical: 8,
  },
  nextCard: {
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderColor: 'rgba(6,41,12,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  nextIcon: {
    alignItems: 'center',
    backgroundColor: AppColors.sageSoft,
    borderRadius: 22,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  nextCopy: {
    flex: 1,
  },
  nextEyebrow: {
    ...AppTypography.eyebrow,
    color: AppColors.subtleInk,
    letterSpacing: 2.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  nextTitle: {
    ...AppTypography.displaySectionTitle,
    color: AppColors.forest,
  },
  nextBody: {
    ...AppTypography.bodyCompact,
    color: AppColors.subtleInk,
    marginTop: 3,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: AppColors.forest,
    borderRadius: 22,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 58,
  },
  primaryButtonText: {
    ...AppTypography.buttonLg,
    color: AppColors.white,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryButtonText: {
    ...AppTypography.buttonMd,
    color: AppColors.mutedInk,
  },
  pressed: {
    opacity: 0.82,
  },
  disabledButton: {
    opacity: 0.72,
  },
});
