import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { Button } from '@/components/ui/Button';
import { captureError } from '@/lib/monitoring';
import { ProgramSlug } from '@/lib/programs/types';
import {
  getDisplayNameForProgram,
  getOwnedProgramsFromCustomerInfo,
  getProgramSlugForPackage,
} from '@/lib/revenuecat/config';
import { useProfile } from '@/providers/profile';

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
  const { access, profile, refreshAccess, setProgramAccess } = useProfile();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [fetchingOfferings, setFetchingOfferings] = useState(true);

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
  }, []);

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
  const headerTitle = isUpgradeFlow
    ? 'Your Reset Is Complete'
    : recommendedProgram === 'six_day_reset'
      ? 'Choose Your Smoking Path'
      : recommendedProgram
        ? `${getDisplayNameForProgram(recommendedProgram)} Is Ready`
        : 'Commit to Your Freedom';
  const headerBody = isUpgradeFlow
    ? 'Unlock the 90-Day Smoking Reset to continue with daily guided recovery work.'
    : recommendedProgram === 'six_day_reset'
      ? 'Both smoking plans are available. Pick the level of support you want right now.'
      : recommendedProgram
        ? 'This program was matched to your questionnaire answers and is ready to unlock.'
        : 'Choose the program path that fits your journey.';

  const handlePurchase = async (pack: PurchasesPackage) => {
    setLoading(true);
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

      Alert.alert('Success', `Your ${getPackageDisplayName(pack)} is now unlocked.`);
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
          Alert.alert('Success', `Your ${getDisplayNameForProgram(restoredProgram)} is now unlocked.`);
          router.replace('/(tabs)/program');
          return;
        }

        Alert.alert(
          'Purchase Already Owned',
          'Google Play says this item is already owned. We tried restoring access, but it is not confirmed yet. Please use Restore Purchases again after the billing credentials issue is resolved.'
        );
        return;
      }

      if (isCredentialError) {
        const restoredProgram = await confirmUnlockedProgram(programSlug);

        if (restoredProgram) {
          await setProgramAccess(restoredProgram);
          Alert.alert('Success', `Your ${getDisplayNameForProgram(restoredProgram)} is now unlocked.`);
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
            ? 'Google Play completed the purchase, but Recovery Compass could not validate it yet because of a billing credentials issue. Please use Restore Purchases after the RevenueCat Google Play credentials are fixed.'
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
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="p-6 pb-20">
        <View className="items-center mb-10 mt-4">
          <Text className="font-erode-bold text-3xl text-forest text-center mb-2">{headerTitle}</Text>
          <Text className="font-satoshi text-gray-500 text-center text-lg">{headerBody}</Text>
        </View>

        {fetchingOfferings ? (
          <ActivityIndicator size="large" color="#2A3F33" className="mt-10" />
        ) : eligiblePackages.length === 0 ? (
          <View className="items-center mt-10">
            <Text className="font-satoshi border border-dashed border-gray-300 p-4 rounded-xl text-gray-500 text-center">
              No eligible purchases are available for this account right now. This usually means this account already owns the highest available program path.
            </Text>
          </View>
        ) : (
          eligiblePackages.map((pack) => {
            const programSlug = getProgramSlugForPackage(pack);
            const isPrimary = eligiblePackages.length === 1 || programSlug === 'ninety_day_transform';

            return (
              <View
                key={pack.identifier}
                className={`rounded-3xl p-6 mb-6 shadow-sm border ${
                  isPrimary ? 'bg-forest border-transparent' : 'bg-white border-gray-100'
                }`}
              >
                <View className="flex-row justify-between items-center mb-4">
                  <Text className={`font-erode-bold text-2xl ${isPrimary ? 'text-white' : 'text-forest'}`}>
                    {getPackageDisplayName(pack)}
                  </Text>
                  {isPrimary ? (
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                      <Text className="text-white font-satoshi-bold text-xs uppercase">
                        {eligiblePackages.length === 1 ? 'Recommended' : 'Best Value'}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text className={`font-satoshi mb-6 leading-6 ${isPrimary ? 'text-gray-300' : 'text-gray-500'}`}>
                  {pack.product.description ||
                    (programSlug ? PROGRAM_METADATA[programSlug].description : 'A guided Recovery Compass program.')}
                </Text>

                <View className="mb-6">
                  <Text className={`font-satoshi-bold text-3xl ${isPrimary ? 'text-white' : 'text-forest'}`}>
                    {pack.product.priceString}
                  </Text>
                </View>

                <Button
                  label={`Select ${getPackageDisplayName(pack)}`}
                  variant={isPrimary ? 'secondary' : 'primary'}
                  onPress={() => handlePurchase(pack)}
                  loading={loading}
                />
              </View>
            );
          })
        )}

        <View className="items-center mt-6">
          <Button
            label="Restore Purchases"
            variant="ghost"
            size="sm"
            onPress={handleRestore}
            loading={loading}
          />
        </View>

        <Text className="text-center text-gray-400 text-xs mt-8">
          One-time program unlocks. Restore anytime from this screen.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
