import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { captureError } from '@/lib/monitoring';
import { ProgramSlug } from '@/lib/programs/types';
import {
  getDisplayNameForProgram,
  getOwnedProgramsFromCustomerInfo,
  getProgramSlugForPackage,
} from '@/lib/revenuecat/config';
import { hasOnboardingContextMismatch } from '@/lib/onboarding.realignment';
import { useProfile } from '@/providers/profile';

// Paywall v2 components
import { PreviewCard } from '@/components/paywall/PreviewCard';
import { TrustStampBar } from '@/components/paywall/TrustStampBar';
import { PurchaseCard } from '@/components/paywall/PurchaseCard';
import { StickyCtaFooter } from '@/components/paywall/StickyCtaFooter';
import { OWNED_PROGRAMS_QUERY_ROOT } from '@/hooks/useOwnedPrograms';

const ACCESS_CONFIRMATION_RETRY_DELAY_MS = 1500;
const ACCESS_CONFIRMATION_RETRY_COUNT = 4;
const PROGRAM_TAB_ROUTE = '/(tabs)/program' as const;
const PROGRAM_LIBRARY_ROUTE = '/account/programs' as const;
const REALIGNMENT_ROUTE = '/personalization?mode=realign' as const;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



function getRecommendedPrograms(programSlug: ProgramSlug | null | undefined): ProgramSlug[] {
  if (!programSlug) {
    return [];
  }

  if (programSlug === 'six_day_reset') {
    return ['six_day_reset', 'ninety_day_transform'];
  }

  return [programSlug];
}

function getProgramSlugFromRouteParam(value: string | string[] | undefined): ProgramSlug | null {
  if (!value) {
    return null;
  }

  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) {
    return null;
  }

  return candidate in PROGRAM_METADATA ? (candidate as ProgramSlug) : null;
}

function getPreferredOffering(
  offerings: Awaited<ReturnType<typeof Purchases.getOfferings>>
) {
  // Prefer platform-specific offerings so StoreKit/Play only receive products
  // for the current store. main_production stays as a fallback for continuity.
  const preferredKeys =
    Platform.OS === 'ios'
      ? ['main_ios', 'main_production', 'main', 'default']
      : Platform.OS === 'android'
        ? ['main_android', 'main_production', 'main', 'default']
        : ['main_production', 'main', 'default'];

  for (const key of preferredKeys) {
    const offering = offerings.all[key];
    if (offering?.availablePackages?.length) {
      return offering;
    }
  }

  return offerings.current ?? null;
}

export default function Paywall() {
  const params = useLocalSearchParams<{ program?: string | string[] }>();
  const router = useRouter();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { access, profile, refreshAccess, setProgramAccess } = useProfile();

  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [fetchingOfferings, setFetchingOfferings] = useState(true);
  const [offeringsLoadFailed, setOfferingsLoadFailed] = useState(false);
  const [offeringsRetryKey, setOfferingsRetryKey] = useState(0);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [canAutoRedirectOwnedUser, setCanAutoRedirectOwnedUser] = useState(false);
  const hasProgramRouteParam = Array.isArray(params.program)
    ? params.program.some((value) => Boolean(value))
    : Boolean(params.program);
  const targetedProgram = getProgramSlugFromRouteParam(params.program);

  const confirmUnlockedProgram = async (expectedProgram: ProgramSlug | null) => {
    for (let attempt = 0; attempt < ACCESS_CONFIRMATION_RETRY_COUNT; attempt += 1) {
      const snapshot = await refreshAccess();
      if (__DEV__) console.log('[Paywall] confirmUnlockedProgram:attempt', {
        attempt: attempt + 1,
        expectedProgram,
        snapshotOwnedProgram: snapshot.ownedProgram,
        snapshotPurchaseState: snapshot.purchaseState,
        snapshotOwnerUserId: snapshot.ownerUserId ?? null,
      });
      const confirmedProgram =
        expectedProgram && snapshot.ownedProgram === expectedProgram
          ? expectedProgram
          : snapshot.ownedProgram;

      if (confirmedProgram) {
        return confirmedProgram;
      }

      if (attempt < ACCESS_CONFIRMATION_RETRY_COUNT - 1) {
        await wait(ACCESS_CONFIRMATION_RETRY_DELAY_MS);
      }
    }

    return null;
  };

  const restoreOwnedPurchase = async (expectedProgram: ProgramSlug | null) => {
    try {
      if (__DEV__) console.log('[Paywall] restoreOwnedPurchase:start', { expectedProgram });
      await Purchases.restorePurchases();
    } catch (error) {
      console.warn('Restore attempt after purchase issue failed', error);
    }

    return await confirmUnlockedProgram(expectedProgram);
  };

  useEffect(() => {
    const getOfferings = async () => {
      setFetchingOfferings(true);
      setOfferingsLoadFailed(false);
      try {
        await refreshAccess();
        const offerings = await Purchases.getOfferings();
        const currentOffering = getPreferredOffering(offerings);

        if (__DEV__) console.log('[Paywall] getOfferings:resolved', {
          platform: Platform.OS,
          currentOfferingIdentifier: offerings.current?.identifier ?? null,
          selectedOfferingIdentifier: currentOffering?.identifier ?? null,
          selectedPackageCount: currentOffering?.availablePackages?.length ?? 0,
          availableOfferingKeys: Object.keys(offerings.all),
          packages: currentOffering?.availablePackages?.map((pack) => ({
            packageIdentifier: pack.identifier,
            productIdentifier: pack.product.identifier,
            mappedProgramSlug: getProgramSlugForPackage(pack),
            priceString: pack.product.priceString,
          })) ?? [],
        });

        if (currentOffering && currentOffering.availablePackages.length > 0) {
          setPackages(currentOffering.availablePackages);
        } else {
          setPackages([]);
        }
      } catch (e) {
        console.error('Error fetching offerings', e);
        setPackages([]);
        setOfferingsLoadFailed(true);
        void captureError(e, { source: 'paywall', metadata: { stage: 'get_offerings' } });
      } finally {
        setFetchingOfferings(false);
      }
    };

    void getOfferings();
  }, [offeringsRetryKey, refreshAccess]);

  const recommendedProgram = profile?.recommended_program ?? null;
  const needsOnboardingRealignment = hasOnboardingContextMismatch({
    onboardingComplete: profile?.onboarding_complete,
    ownedProgram: access.ownedProgram,
    questionnaireAnswers: profile?.questionnaire_answers ?? null,
    recommendedProgram,
  });

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      setCanAutoRedirectOwnedUser(true);
    }, 250);

    return () => clearTimeout(redirectTimer);
  }, []);

  useEffect(() => {
    if (!canAutoRedirectOwnedUser || !access.ownedProgram || hasProgramRouteParam) {
      return;
    }

    router.replace(needsOnboardingRealignment ? REALIGNMENT_ROUTE : PROGRAM_TAB_ROUTE);
  }, [access.ownedProgram, canAutoRedirectOwnedUser, hasProgramRouteParam, needsOnboardingRealignment, router]);

  const handleBack = () => {
    if (hasProgramRouteParam) {
      if (navigation.canGoBack?.()) {
        router.back();
      } else {
        router.replace('/' as const);
      }
      return;
    }

    if (access.ownedProgram) {
      router.replace(needsOnboardingRealignment ? REALIGNMENT_ROUTE : PROGRAM_TAB_ROUTE);
      return;
    }

    navigation.navigate('personalization', { resume: 'review' });
  };

  const visibleProgramSlugs = useMemo(() => {
    if (targetedProgram) {
      return [targetedProgram] as ProgramSlug[];
    }

    if (access.ownedProgram) {
      return [] as ProgramSlug[];
    }
    return getRecommendedPrograms(recommendedProgram);
  }, [access.ownedProgram, recommendedProgram, targetedProgram]);

  const eligiblePackages = useMemo(() => {
    const matchingPackages = packages
      .map((pack) => ({
        pack,
        slug: getProgramSlugForPackage(pack),
      }))
      .filter((item): item is { pack: PurchasesPackage; slug: ProgramSlug } => {
        return item.slug ? visibleProgramSlugs.includes(item.slug) : false;
      })
      .sort((left, right) => visibleProgramSlugs.indexOf(left.slug) - visibleProgramSlugs.indexOf(right.slug));

    const uniquePackages = new Map<ProgramSlug, PurchasesPackage>();

    matchingPackages.forEach(({ pack, slug }) => {
      if (!uniquePackages.has(slug)) {
        uniquePackages.set(slug, pack);
      }
    });

    return visibleProgramSlugs
      .map((slug) => uniquePackages.get(slug))
      .filter((pack): pack is PurchasesPackage => Boolean(pack));
  }, [packages, visibleProgramSlugs]);

  const hasVisiblePurchaseIntent = visibleProgramSlugs.length > 0;
  const hasStorePackages = packages.length > 0;
  const purchaseOptionsUnavailable =
    !access.ownedProgram &&
    hasVisiblePurchaseIntent &&
    !fetchingOfferings &&
    eligiblePackages.length === 0;

  // Default select the primary package
  useEffect(() => {
    if (eligiblePackages.length > 0 && !selectedPackageId) {
      setSelectedPackageId(eligiblePackages[0].identifier);
    }
  }, [eligiblePackages, selectedPackageId]);

  const activePackage = eligiblePackages.find(p => p.identifier === selectedPackageId);

  const getPackageDisplayName = (pack: PurchasesPackage) => {
    const programSlug = getProgramSlugForPackage(pack);
    if (programSlug) return getDisplayNameForProgram(programSlug);
    return pack.product.title;
  };

  const finalizeUnlockedProgram = async (confirmedProgram: ProgramSlug) => {
    const activeProgram = access.ownedProgram as ProgramSlug | null;

    if (!activeProgram || activeProgram === confirmedProgram) {
      await setProgramAccess(confirmedProgram);
      await refreshAccess();
      await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
      router.replace(PROGRAM_TAB_ROUTE);
      return;
    }

    await refreshAccess();
    await queryClient.invalidateQueries({ queryKey: OWNED_PROGRAMS_QUERY_ROOT });
    Alert.alert(
      'Program Unlocked',
      `${getDisplayNameForProgram(confirmedProgram)} was added to your library. Set it as current from My Programs when you are ready to personalize it.`
    );
    router.replace(PROGRAM_LIBRARY_ROUTE);
  };

  const handlePurchase = async () => {
    if (!activePackage) return;

    setLoading(true);
    const pack = activePackage;
    const programSlug = getProgramSlugForPackage(pack);
    try {
      const result = await Purchases.purchasePackage(pack);
      const ownedPrograms = getOwnedProgramsFromCustomerInfo(result.customerInfo);
      if (__DEV__) console.log('[Paywall] purchasePackage:result', {
        selectedProgram: programSlug,
        ownedPrograms,
        revenueCatAppUserId: result.customerInfo.originalAppUserId,
      });
      let confirmedProgram = programSlug && ownedPrograms.includes(programSlug) ? programSlug : null;

      if (!confirmedProgram) {
        confirmedProgram = await confirmUnlockedProgram(programSlug);
      }

      if (!confirmedProgram) {
        Alert.alert(
          'Purchase Pending',
          'Your purchase appears to have started, but access has not been confirmed yet. Please tap Restore Purchases or reopen the app in a moment.'
        );
        return;
      }

      await finalizeUnlockedProgram(confirmedProgram);
    } catch (e: any) {
      const combinedErrorMessage = [e?.message, e?.underlyingErrorMessage]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .join(' ')
        .toLowerCase();
      const isAlreadyOwnedError =
        combinedErrorMessage.includes('already own') ||
        combinedErrorMessage.includes('already purchased') ||
        combinedErrorMessage.includes('item already owned');
      const isCredentialError =
        combinedErrorMessage.includes('credentials issue') ||
        combinedErrorMessage.includes('invalid credentials');

      if (isAlreadyOwnedError) {
        if (__DEV__) console.log('[Paywall] purchasePackage:alreadyOwned', {
          selectedProgram: programSlug,
          errorMessage: combinedErrorMessage,
        });
        const restoredProgram = await restoreOwnedPurchase(programSlug);

        if (restoredProgram) {
          await finalizeUnlockedProgram(restoredProgram);
          return;
        }

        Alert.alert(
          'Purchase Already Owned',
          'The store indicates this is already owned. We tried restoring access, but it is not confirmed yet. Please use Restore Purchases later.'
        );
        return;
      }

      if (isCredentialError) {
        const restoredProgram = await confirmUnlockedProgram(programSlug);

        if (restoredProgram) {
          await finalizeUnlockedProgram(restoredProgram);
          return;
        }
      }

      if (!e.userCancelled) {
        void captureError(e, {
          source: 'paywall',
          metadata: {
            code: e?.code ?? 'unknown',
            underlyingErrorMessage: e?.underlyingErrorMessage ?? null,
            packageIdentifier: pack.identifier,
            programSlug: programSlug ?? 'unknown',
            stage: 'purchase',
          },
        });
        Alert.alert(
          'Purchase Failed',
          isCredentialError
            ? 'The purchase was processed, but Recovery Compass could not validate it yet. Please use Restore Purchases later.'
            : e.message
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      if (__DEV__) console.log('[Paywall] handleRestore:start', {
        recommendedProgram,
        accessOwnedProgram: access.ownedProgram,
      });
      await Purchases.restorePurchases();
      const snapshot = await refreshAccess();
      if (__DEV__) console.log('[Paywall] handleRestore:resolved', {
        recommendedProgram,
        snapshotOwnedProgram: snapshot?.ownedProgram ?? null,
        snapshotPurchaseState: snapshot?.purchaseState ?? null,
        snapshotOwnerUserId: snapshot?.ownerUserId ?? null,
      });
      if (!snapshot?.ownedProgram) {
        Alert.alert('Restore Failed', 'No eligible Recovery Compass purchase was found for this account.');
        return;
      }
      Alert.alert('Success', 'Purchases restored successfully!');
      router.replace(PROGRAM_TAB_ROUTE);
    } catch (e: any) {
      void captureError(e, { source: 'paywall', metadata: { stage: 'restore' } });
      Alert.alert('Restore Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Derived display values ──────────────────────────────────────────────────

  const isSingleProgram = visibleProgramSlugs.length === 1;
  const isMultiOption = visibleProgramSlugs.length > 1;

  // Primary program metadata for the centered headline + preview card
  const primarySlug = visibleProgramSlugs[0] ?? null;
  const primaryMeta = primarySlug ? PROGRAM_METADATA[primarySlug] : null;

  const headlineTitle = isSingleProgram && primaryMeta
    ? primaryMeta.name
    : isMultiOption
      ? 'Choose your path.'
      : targetedProgram
        ? getDisplayNameForProgram(targetedProgram)
        : 'Your Recovery Path';

  const headlineSubtitle = isSingleProgram && primaryMeta
    ? primaryMeta.description
    : isMultiOption
      ? 'Both programs fit your assessment. Pick the one that calls to you.'
      : targetedProgram
        ? 'This program is ready to unlock whenever you are.'
        : 'Select the program that fits your journey.';

  const kickerText = isSingleProgram
    ? 'Recommended for you'
    : isMultiOption
      ? 'Your options'
      : null;

  const sectionEyebrow = isSingleProgram
    ? 'Begin for'
    : 'Choose a program';

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: 180 + insets.bottom,
        }}
      >
        {/* ── Back button ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <Pressable
            onPress={handleBack}
            hitSlop={20}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(6,41,12,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={14} color="rgba(6,41,12,0.55)" />
          </Pressable>
        </View>

        {/* ── Centered headline block (always rendered) ── */}
        <View style={{ alignItems: 'center', paddingHorizontal: 28, paddingTop: 20 }}>
          {/* Kicker pill */}
          {kickerText && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: isSingleProgram ? '#E3F3E5' : '#F5F5F7',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginBottom: 14,
                ...(isMultiOption && {
                  borderWidth: 1,
                  borderColor: 'rgba(6,41,12,0.07)',
                }),
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: isSingleProgram ? '#06290C' : 'rgba(6,41,12,0.4)',
                }}
              />
              <Text
                style={{
                  fontFamily: 'Satoshi-Bold',
                  fontSize: 9,
                  letterSpacing: 1.08,
                  textTransform: 'uppercase',
                  color: isSingleProgram ? '#06290C' : 'rgba(6,41,12,0.62)',
                }}
              >
                {kickerText}
              </Text>
            </View>
          )}

          {/* Headline — serif */}
          <Text
            style={{
              fontFamily: 'Erode-Medium',
              fontSize: 34,
              lineHeight: 37,
              letterSpacing: -0.68,
              color: '#06290C',
              textAlign: 'center',
            }}
          >
            {headlineTitle}
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontFamily: 'Satoshi-Regular',
              fontSize: 14,
              lineHeight: 21.7,
              color: 'rgba(6,41,12,0.45)',
              textAlign: 'center',
              marginTop: 10,
              maxWidth: 260,
            }}
          >
            {headlineSubtitle}
          </Text>
        </View>

        {/* ── Preview card (single-program only) ── */}
        {isSingleProgram && primaryMeta && (
          <PreviewCard
            totalDays={primaryMeta.totalDays}
            dailyMinutes={primaryMeta.dailyMinutesLabel}
            phaseCount={primaryMeta.phaseCount}
          />
        )}

        {/* ── Trust stamps (only when purchase options are available) ── */}
        {hasVisiblePurchaseIntent && <TrustStampBar />}

        {/* ── Content area ── */}
        {fetchingOfferings ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
            <ActivityIndicator size="small" color="#06290C" />
          </View>
        ) : eligiblePackages.length === 0 ? (
          /* ── Empty / locked / unavailable states ── */
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 22,
              alignItems: 'center',
              paddingVertical: 48,
              paddingHorizontal: 24,
              borderRadius: 24,
              backgroundColor: 'rgba(6,41,12,0.03)',
              borderWidth: 1,
              borderColor: 'rgba(6,41,12,0.07)',
            }}
          >
            <Text
              style={{
                fontFamily: 'Satoshi-Regular',
                fontSize: 15,
                lineHeight: 24,
                color: 'rgba(6,41,12,0.5)',
                textAlign: 'center',
              }}
            >
              {purchaseOptionsUnavailable
                  ? offeringsLoadFailed
                    ? 'Purchase options are not available from the store yet. Please try again, or restore purchases if this program was already unlocked.'
                    : hasStorePackages
                    ? 'Purchase options are temporarily unavailable for this program. Please try again shortly.'
                    : 'Purchase options are temporarily unavailable. Please try again shortly.'
                  : access.ownedProgram
                ? targetedProgram
                  ? `Purchase options for ${getDisplayNameForProgram(targetedProgram)} are not available right now.`
                  : 'Your account has full access to Recovery Compass. Head to the Program tab to continue your journey.'
                : 'Purchase options are temporarily unavailable. Please try again shortly.'}
            </Text>
              <Pressable
                onPress={offeringsLoadFailed ? () => setOfferingsRetryKey((key) => key + 1) : handleRestore}
                disabled={loading}
                hitSlop={20}
                style={{
                  marginTop: 32,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(6,41,12,0.10)',
                  paddingHorizontal: 32,
                  paddingVertical: 14,
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Text style={{ fontFamily: 'Satoshi-SemiBold', fontSize: 14, color: '#06290C' }}>
                  {offeringsLoadFailed ? 'Try again' : loading ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </Pressable>
          </View>
        ) : (
          /* ── Purchase section ── */
          <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
            {/* Section eyebrow */}
            <Text
              style={{
                fontFamily: 'Satoshi-Bold',
                fontSize: 9,
                letterSpacing: 1.8,
                textTransform: 'uppercase',
                color: 'rgba(6,41,12,0.3)',
                marginBottom: 10,
              }}
            >
              {sectionEyebrow}
            </Text>

            {/* Purchase cards */}
            {eligiblePackages.map((pack) => {
              const programSlug = getProgramSlugForPackage(pack);
              const isSelected = selectedPackageId === pack.identifier;
              const meta = programSlug ? PROGRAM_METADATA[programSlug] : null;

              return (
                <PurchaseCard
                  key={pack.identifier}
                  programName={getPackageDisplayName(pack)}
                  durationDays={meta?.totalDays ?? 0}
                  description={
                    pack.product.description ||
                    (meta ? meta.description : 'A guided Recovery Compass program.')
                  }
                  priceString={pack.product.priceString}
                  isSelected={isSelected}
                  showCheckCircle={isMultiOption}
                  onPress={() => setSelectedPackageId(pack.identifier)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Sticky CTA footer ── */}
      {eligiblePackages.length > 0 && !fetchingOfferings && (
        <StickyCtaFooter
          ctaLabel={`Unlock ${activePackage ? getPackageDisplayName(activePackage) : 'Access'}`}
          onPurchase={handlePurchase}
          onRestore={handleRestore}
          loading={loading}
          disabled={!selectedPackageId || loading}
          insetBottom={insets.bottom}
        />
      )}
    </View>
  );
}
