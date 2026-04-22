import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
  Linking,
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

// Reusing intake components for the premium aesthetic
import { CompassCTA } from '@/components/onboarding/intake/CompassCTA';
import { FocusPointRow } from '@/components/onboarding/intake/FocusPointRow';

const ACCESS_CONFIRMATION_RETRY_DELAY_MS = 1500;
const ACCESS_CONFIRMATION_RETRY_COUNT = 4;
const PROGRAM_TAB_ROUTE = '/(tabs)/program' as const;
const REALIGNMENT_ROUTE = '/personalization?mode=realign' as const;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open link', 'Please try again in a moment.');
  }
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

function RadioIndicator({ isSelected }: { isSelected: boolean }) {
  const opacity = React.useRef(new RNAnimated.Value(isSelected ? 1 : 0)).current;

  React.useEffect(() => {
    RNAnimated.timing(opacity, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelected, opacity]);

  return (
    <View className={`mt-1 h-6 w-6 rounded-full border-[1.5px] items-center justify-center ${isSelected ? 'border-forest/40 bg-white' : 'border-forest/20 bg-transparent'}`}>
      <RNAnimated.View style={{ opacity }} className="h-2.5 w-2.5 rounded-full bg-forest" />
    </View>
  );
}

export default function Paywall() {
  const params = useLocalSearchParams<{ program?: string | string[] }>();
  const router = useRouter();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { access, profile, refreshAccess, setProgramAccess } = useProfile();

  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [fetchingOfferings, setFetchingOfferings] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const targetedProgram = getProgramSlugFromRouteParam(params.program);
  const launchPurchaseLocked =
    Boolean(access.ownedProgram) &&
    Boolean(targetedProgram) &&
    access.ownedProgram !== targetedProgram;

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
        });

        if (currentOffering && currentOffering.availablePackages.length > 0) {
          setPackages(currentOffering.availablePackages);
        } else {
          setPackages([]);
        }
      } catch (e) {
        console.error('Error fetching offerings', e);
        void captureError(e, { source: 'paywall', metadata: { stage: 'get_offerings' } });
        Alert.alert('Error', 'Could not load purchase options.');
      } finally {
        setFetchingOfferings(false);
      }
    };

    void getOfferings();
  }, [refreshAccess]);

  const recommendedProgram = profile?.recommended_program ?? null;
  const needsOnboardingRealignment = hasOnboardingContextMismatch({
    onboardingComplete: profile?.onboarding_complete,
    ownedProgram: access.ownedProgram,
    questionnaireAnswers: profile?.questionnaire_answers ?? null,
    recommendedProgram,
  });

  useEffect(() => {
    if (!access.ownedProgram || targetedProgram) {
      return;
    }

    router.replace(needsOnboardingRealignment ? REALIGNMENT_ROUTE : PROGRAM_TAB_ROUTE);
  }, [access.ownedProgram, needsOnboardingRealignment, router, targetedProgram]);

  const handleBack = () => {
    if (targetedProgram) {
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
    if (launchPurchaseLocked) {
      return [] as ProgramSlug[];
    }

    if (targetedProgram) {
      return [targetedProgram] as ProgramSlug[];
    }

    if (access.ownedProgram) {
      return [] as ProgramSlug[];
    }
    return getRecommendedPrograms(recommendedProgram);
  }, [access.ownedProgram, launchPurchaseLocked, recommendedProgram, targetedProgram]);

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
      setSelectedPackageId(eligiblePackages[0].identifier);
    }
  }, [eligiblePackages, selectedPackageId]);

  const headerTitle = targetedProgram
    ? getDisplayNameForProgram(targetedProgram)
    : access.ownedProgram
    ? 'Program Already Unlocked'
    : recommendedProgram
      ? `${getDisplayNameForProgram(recommendedProgram)}`
      : 'Your Recovery Path';

  const headerBody = targetedProgram
    ? launchPurchaseLocked
      ? 'Recovery Compass is launching with one unlocked program per account while we finish a smoother multi-program experience.'
      : 'This program is ready to unlock whenever you are. Your current journey stays intact until you choose a new one.'
    : access.ownedProgram
    ? 'Recovery Compass currently supports one active program at a time. Head to the Program tab to continue your journey.'
    : recommendedProgram
      ? 'This program matches your assessment and is ready to begin.'
      : 'Select the program that fits your journey.';

  const activePackage = eligiblePackages.find(p => p.identifier === selectedPackageId);

  const handlePurchase = async () => {
    if (launchPurchaseLocked) {
      Alert.alert(
        'One Program At Launch',
        'This account already has an unlocked program. We are limiting launch access to one program per account for now.'
      );
      return;
    }

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

      await setProgramAccess(confirmedProgram);
      await refreshAccess();

      // No alert needed for success if we just drop them into the program smoothly
      router.replace(PROGRAM_TAB_ROUTE);
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
          await setProgramAccess(restoredProgram);
          Alert.alert(
            'Already Unlocked',
            `This account already owns ${getDisplayNameForProgram(restoredProgram)}. Access has been restored.`
          );
          router.replace(PROGRAM_TAB_ROUTE);
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
          router.replace(PROGRAM_TAB_ROUTE);
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

  const getPackageDisplayName = (pack: PurchasesPackage) => {
    const programSlug = getProgramSlugForPackage(pack);
    if (programSlug) return getDisplayNameForProgram(programSlug);
    return pack.product.title;
  };

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingHorizontal: 24,
          paddingBottom: 220 + insets.bottom,
        }}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={20}
          className="self-start mb-10 h-12 w-12 items-center justify-center rounded-full border border-forest/10 bg-white"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="#06290C" />
        </Pressable>

        <View className="mb-12">
          <Text className="font-erode text-[36px] text-forest leading-[42px] tracking-tight mb-3">
            {headerTitle}
          </Text>
          <Text className="font-satoshi text-[17px] leading-[26px] text-forest/70 pr-4">
            {headerBody}
          </Text>
        </View>

        {fetchingOfferings ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="small" color="#06290C" />
          </View>
        ) : eligiblePackages.length === 0 ? (
          <View className="items-center py-12 px-6 rounded-3xl bg-forest/5 border border-forest/10">
            <Text className="font-satoshi text-center text-[15px] text-forest/70 leading-[24px]">
              {launchPurchaseLocked
                ? `You already have ${getDisplayNameForProgram(access.ownedProgram as ProgramSlug)} unlocked. Additional program purchases will open once multi-program support is ready.`
                : access.ownedProgram
                ? targetedProgram
                  ? `Purchase options for ${getDisplayNameForProgram(targetedProgram)} are not available right now.`
                  : 'Your account has full access to Recovery Compass. Head to the Program tab to continue your journey.'
                : 'No eligible setups are available right now. This usually means your account is already fully unlocked.'}
            </Text>
            {launchPurchaseLocked ? (
              <Pressable
                onPress={() => router.replace(PROGRAM_TAB_ROUTE)}
                hitSlop={20}
                className="mt-8 rounded-full border border-forest/10 px-8 py-3.5 bg-white"
              >
                <Text className="font-satoshi-bold text-[14px] text-forest">
                  Return to my program
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleRestore}
                disabled={loading}
                hitSlop={20}
                className="mt-8 rounded-full border border-forest/10 px-8 py-3.5 bg-white"
              >
                <Text className="font-satoshi-bold text-[14px] text-forest">
                  {loading ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View>
            <View className="mb-12 pl-1" style={{ gap: 16 }}>
              <FocusPointRow text="Private daily progress tracking" />
              <FocusPointRow text="Science-based behavioral grounding" />
              <FocusPointRow text="One-time unlock. No recurring fees." />
            </View>

            <View style={{ gap: 16 }}>
              {eligiblePackages.map((pack) => {
                const programSlug = getProgramSlugForPackage(pack);
                const isSelected = selectedPackageId === pack.identifier;

                return (
                  <Pressable
                    key={pack.identifier}
                    onPress={() => setSelectedPackageId(pack.identifier)}
                    className={`flex-row items-start px-6 py-6 rounded-3xl border transition-colors duration-200 ${
                      isSelected
                        ? 'bg-sage border-forest/15'
                        : 'bg-white border-forest/10'
                    }`}
                  >
                    <View className="flex-1 pr-6">
                      <Text className={`font-erode text-[24px] tracking-tight mb-2 ${isSelected ? 'text-forest' : 'text-forest/80'}`}>
                        {getPackageDisplayName(pack)}
                      </Text>

                      <Text className={`font-satoshi text-[15px] leading-6 mb-5 ${isSelected ? 'text-forest/80' : 'text-forest/60'}`}>
                        {pack.product.description ||
                          (programSlug ? PROGRAM_METADATA[programSlug].description : 'A guided Recovery Compass program.')}
                      </Text>

                      <View className="flex-row items-baseline">
                        <Text className={`font-satoshi-bold text-[22px] tracking-tight ${isSelected ? 'text-forest' : 'text-forest/70'}`}>
                          {pack.product.priceString}
                        </Text>
                        <Text className={`font-satoshi text-[14px] ml-1.5 ${isSelected ? 'text-forest/70' : 'text-forest/50'}`}>
                          one-time
                        </Text>
                      </View>
                    </View>

                    {/* Premium Radio indicator */}
                    <RadioIndicator isSelected={isSelected} />
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
          className="absolute bottom-0 left-0 right-0 bg-surface/95 border-t border-forest/10"
          style={{
            paddingTop: 20,
            paddingHorizontal: 24,
            paddingBottom: Math.max(insets.bottom, 12) + 12,
          }}
        >
          <CompassCTA
            label={`Unlock ${activePackage ? getPackageDisplayName(activePackage) : 'Access'}`}
            onPress={handlePurchase}
            loading={loading}
            disabled={!selectedPackageId || loading}
          />

          <View className="mt-6 flex-row items-center justify-between px-1">
            <Text className="font-satoshi text-[14px] text-forest/70">
              One-time payment
            </Text>
            <Pressable onPress={handleRestore} disabled={loading} hitSlop={20}>
              <Text className="font-satoshi text-[14px] text-forest/70 underline">
                Restore Purchases
              </Text>
            </Pressable>
          </View>

          <Text className="mt-5 text-center font-satoshi text-[12px] leading-[18px] text-forest/40 mx-4">
            By continuing, you agree to our{' '}
            <Text
              className="text-forest/60 underline"
              onPress={() => void openLink('https://recoverycompass.co/terms')}
            >
              Terms
            </Text>{' '}
            and{' '}
            <Text
              className="text-forest/60 underline"
              onPress={() => void openLink('https://recoverycompass.co/privacy')}
            >
              Privacy
            </Text>
            . No subscriptions or recurring charges.
          </Text>
        </View>
      )}
    </View>
  );
}
