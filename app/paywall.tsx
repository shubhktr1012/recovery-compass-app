import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { captureError } from '@/lib/monitoring';
import { ProgramSlug } from '@/lib/programs/types';
import {
  getDisplayNameForProgram,
  getOwnedProgramsFromCustomerInfo,
  getProgramSlugForPackage,
} from '@/lib/revenuecat/config';
import { useProfile } from '@/providers/profile';

// Reusing intake components for the premium aesthetic
import { CompassCTA } from '@/components/onboarding/intake/CompassCTA';
import { FocusPointRow } from '@/components/onboarding/intake/FocusPointRow';

const ACCESS_CONFIRMATION_RETRY_DELAY_MS = 1500;
const ACCESS_CONFIRMATION_RETRY_COUNT = 4;

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

export default function Paywall() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { access, profile, refreshAccess, setProgramAccess } = useProfile();

  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [fetchingOfferings, setFetchingOfferings] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const confirmUnlockedProgram = async (expectedProgram: ProgramSlug | null) => {
    for (let attempt = 0; attempt < ACCESS_CONFIRMATION_RETRY_COUNT; attempt += 1) {
      const snapshot = await refreshAccess();
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
      await Purchases.restorePurchases();
    } catch (error) {
      console.warn('Restore attempt after purchase issue failed', error);
    }

    return await confirmUnlockedProgram(expectedProgram);
  };

  useEffect(() => {
    const getOfferings = async () => {
      try {
        await refreshAccess();
        const offerings = await Purchases.getOfferings();
        const currentOffering = offerings.current ?? null;

        if (currentOffering && currentOffering.availablePackages.length > 0) {
          setPackages(currentOffering.availablePackages);
        } else {
          setPackages([]);
        }
      } catch (e) {
        console.error('Error fetching offerings', e);
        void captureError(e, { source: 'paywall', metadata: { stage: 'get_offerings' } });
        Alert.alert('Error', 'Could not load subscription options.');
      } finally {
        setFetchingOfferings(false);
      }
    };

    void getOfferings();
  }, [refreshAccess]);

  const isUpgradeFlow =
    access.ownedProgram === 'six_day_reset' &&
    (access.purchaseState === 'owned_completed' || access.purchaseState === 'owned_archived');
  const recommendedProgram = profile?.recommended_program ?? null;

  const visibleProgramSlugs = useMemo(() => {
    if (isUpgradeFlow) {
      return ['ninety_day_transform'] as ProgramSlug[];
    }
    if (access.ownedProgram) {
      return [] as ProgramSlug[];
    }
    return getRecommendedPrograms(recommendedProgram);
  }, [access.ownedProgram, isUpgradeFlow, recommendedProgram]);

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

  // Default select the primary package
  useEffect(() => {
    if (eligiblePackages.length > 0 && !selectedPackageId) {
      const primary = eligiblePackages.find(p => getProgramSlugForPackage(p) === 'ninety_day_transform');
      setSelectedPackageId(primary ? primary.identifier : eligiblePackages[0].identifier);
    }
  }, [eligiblePackages, selectedPackageId]);

  const headerTitle = isUpgradeFlow
    ? 'Your Reset Is Complete'
    : recommendedProgram === 'six_day_reset'
      ? 'Choose Your Path'
      : recommendedProgram
        ? `${getDisplayNameForProgram(recommendedProgram)}`
        : 'Your Recovery Path';

  const headerBody = isUpgradeFlow
    ? `Unlock ${getDisplayNameForProgram('ninety_day_transform')} to continue with daily guided recovery work.`
    : recommendedProgram === 'six_day_reset'
      ? 'Both plans are open. Select the level of support you need right now.'
      : recommendedProgram
        ? 'This program matches your assessment and is ready to begin.'
        : 'Select the program that fits your journey.';

  const activePackage = eligiblePackages.find(p => p.identifier === selectedPackageId);

  const handlePurchase = async () => {
    if (!activePackage) return;

    setLoading(true);
    const pack = activePackage;
    const programSlug = getProgramSlugForPackage(pack);
    try {
      const result = await Purchases.purchasePackage(pack);
      const ownedPrograms = getOwnedProgramsFromCustomerInfo(result.customerInfo);
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

      await setProgramAccess(confirmedProgram);
      await refreshAccess();

      // No alert needed for success if we just drop them into the program smoothly
      router.replace('/(tabs)/program');
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
        const restoredProgram = await restoreOwnedPurchase(programSlug);

        if (restoredProgram) {
          await setProgramAccess(restoredProgram);
          Alert.alert(
            'Already Unlocked',
            `This account already owns ${getDisplayNameForProgram(restoredProgram)}. Access has been restored.`
          );
          router.replace('/(tabs)/program');
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
          await setProgramAccess(restoredProgram);
          router.replace('/(tabs)/program');
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
      await Purchases.restorePurchases();
      const snapshot = await refreshAccess();
      if (!snapshot?.ownedProgram) {
        Alert.alert('Restore Failed', 'No eligible Recovery Compass purchase was found for this account.');
        return;
      }
      Alert.alert('Success', 'Purchases restored successfully!');
      router.replace('/(tabs)/program');
    } catch (e: any) {
      void captureError(e, { source: 'paywall', metadata: { stage: 'restore' } });
      Alert.alert('Restore Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const getPackageDisplayName = (pack: PurchasesPackage) => {
    const programSlug = getProgramSlugForPackage(pack);
    if (programSlug) return getDisplayNameForProgram(programSlug);
    return pack.product.title;
  };

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 24) + 24,
          paddingHorizontal: 24,
          // Keep the sticky purchase bar from covering the final card.
          paddingBottom: 180 + insets.bottom,
        }}
      >
        <View className="mb-8">
          <Text className="font-erode-bold text-[32px] text-forest leading-tight mb-4">
            {headerTitle}
          </Text>
          <Text className="font-satoshi text-[16px] leading-[24px] text-forest/65">
            {headerBody}
          </Text>
        </View>

        {fetchingOfferings ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#06290C" />
          </View>
        ) : eligiblePackages.length === 0 ? (
          <View className="items-center py-12 px-4 rounded-3xl bg-forest/5 border border-forest/10">
            <Text className="font-satoshi text-center text-forest/70 leading-[24px]">
              {access.ownedProgram && !isUpgradeFlow
                ? 'You already have full access to Recovery Compass. Head to the Program tab to continue your journey.'
                : 'No eligible setups are available for this account right now. This usually means your account is already fully unlocked.'}
            </Text>
            <Pressable
              onPress={handleRestore}
              disabled={loading}
              hitSlop={15}
              className="mt-8 rounded-full border border-forest/10 px-6 py-3"
            >
              <Text className="font-satoshi-bold text-[13px] text-forest">
                {loading ? 'Restoring...' : 'Restore Purchases'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <View className="mb-10 pl-1" style={{ gap: 12 }}>
              <FocusPointRow text="Private daily progress tracking" />
              <FocusPointRow text="Science-based behavioral grounding" />
              <FocusPointRow text="One-time unlock. No recurring fees." />
            </View>

            <Text className="font-satoshi-bold text-forest text-[13px] uppercase tracking-widest mb-4 opacity-60 ml-2">
              Select Program
            </Text>

            <View style={{ gap: 12 }}>
              {eligiblePackages.map((pack) => {
                const programSlug = getProgramSlugForPackage(pack);
                const isSelected = selectedPackageId === pack.identifier;

                return (
                  <Pressable
                    key={pack.identifier}
                    onPress={() => setSelectedPackageId(pack.identifier)}
                    className={`relative overflow-hidden rounded-3xl px-6 py-6 transition-all ${
                      isSelected
                        ? 'bg-sage border-2 border-forest/15'
                        : 'bg-white border-2 border-transparent shadow-[0_2px_12px_-4px_rgba(6,41,12,0.06)]'
                    }`}
                  >
                    {/* Left Accent & Radio Indicator */}
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className={`font-erode text-[22px] ${isSelected ? 'font-erode-bold text-forest' : 'text-forest/80'}`}>
                        {getPackageDisplayName(pack)}
                      </Text>

                      {/* Premium Radio indicator */}
                      <View className={`h-5 w-5 rounded-full border-[1.5px] items-center justify-center mt-1 ${isSelected ? 'border-forest' : 'border-forest/20'}`}>
                        {isSelected && (
                          <Animated.View entering={FadeIn.duration(150)} className="h-2.5 w-2.5 rounded-full bg-forest" />
                        )}
                      </View>
                    </View>

                    <Text className={`font-satoshi text-[14px] leading-6 pr-4 mb-4 ${isSelected ? 'text-forest/70' : 'text-forest/50'}`}>
                      {pack.product.description ||
                        (programSlug ? PROGRAM_METADATA[programSlug].description : 'A guided Recovery Compass program.')}
                    </Text>

                    <Text className={`font-satoshi-bold text-[24px] ${isSelected ? 'text-forest' : 'text-forest/70'}`}>
                      {pack.product.priceString}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Area */}
      {eligiblePackages.length > 0 && !fetchingOfferings && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-surface border-t border-forest/5"
          style={{
            paddingTop: 20,
            paddingHorizontal: 24,
            paddingBottom: Math.max(insets.bottom, 20) + 12,
            shadowColor: '#06290C',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.03,
            shadowRadius: 15,
            elevation: 10
          }}
        >
          <CompassCTA
            label={`Unlock ${activePackage ? getPackageDisplayName(activePackage) : 'Access'}`}
            onPress={handlePurchase}
            loading={loading}
            disabled={!selectedPackageId || loading}
          />

          <View className="flex-row items-center justify-center mt-5" style={{ gap: 24 }}>
            <Pressable onPress={handleRestore} disabled={loading} hitSlop={15}>
              <Text className="font-satoshi text-[13px] text-forest/40 underline">
                Restore Purchases
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
