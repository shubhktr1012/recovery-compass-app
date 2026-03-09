import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/ui/Button';
import { captureError } from '@/lib/monitoring';
import { useProfile } from '@/providers/profile';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { getDisplayNameForProgram, getProgramSlugForPackage } from '@/lib/revenuecat/config';

export default function Paywall() {
    const router = useRouter();
    const { access, refreshAccess, setProgramAccess } = useProfile();
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [fetchingOfferings, setFetchingOfferings] = useState(true);

    useEffect(() => {
        const getOfferings = async () => {
            try {
                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                    setPackages(offerings.current.availablePackages);
                }
            } catch (e) {
                console.error("Error fetching offerings", e);
                void captureError(e, { source: 'paywall', metadata: { stage: 'get_offerings' } });
                Alert.alert("Error", "Could not load subscription options.");
            } finally {
                setFetchingOfferings(false);
            }
        };

        getOfferings();
    }, []);

    const eligiblePackages = packages.filter((pack) => {
        const slug = getProgramSlugForPackage(pack);
        return slug ? access.eligibleProducts.includes(slug) : false;
    });
    const isUpgradeFlow =
        access.ownedProgram === 'six_day_reset' &&
        (access.purchaseState === 'owned_completed' || access.purchaseState === 'owned_archived');

    const handlePurchase = async (pack: PurchasesPackage) => {
        setLoading(true);
        const programSlug = getProgramSlugForPackage(pack);
        try {
            await Purchases.purchasePackage(pack);

            if (programSlug) {
                await setProgramAccess(programSlug);
            }

            await refreshAccess();

            Alert.alert('Success', `Your ${getPackageDisplayName(pack)} is now unlocked.`);
            router.replace('/(tabs)/program');
        } catch (e: any) {
            if (!e.userCancelled) {
                void captureError(e, {
                    source: 'paywall',
                    metadata: {
                        packageIdentifier: pack.identifier,
                        programSlug: programSlug ?? 'unknown',
                        stage: 'purchase',
                    },
                });
                Alert.alert('Purchase Failed', e.message);
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
                    <Text className="font-erode-bold text-3xl text-forest text-center mb-2">
                        {isUpgradeFlow ? 'Your Reset Is Complete' : 'Commit to Your Freedom'}
                    </Text>
                    <Text className="font-satoshi text-gray-500 text-center text-lg">
                        {isUpgradeFlow
                            ? 'Unlock the 90-Day Quit to continue with daily guided recovery work.'
                            : 'Choose the program path that fits your journey.'}
                    </Text>
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
                        const isPrimary = programSlug === 'ninety_day_transform';
                        
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
                                    {isPrimary && (
                                        <View className="bg-white/20 px-3 py-1 rounded-full">
                                            <Text className="text-white font-satoshi-bold text-xs uppercase">
                                                Best Value
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                
                                <Text className={`font-satoshi mb-6 leading-6 ${isPrimary ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {pack.product.description ||
                                        (programSlug === 'six_day_reset'
                                            ? 'A finite six-day intervention designed to break autopilot and build immediate control.'
                                            : 'A long-form ninety-day guided path with daily audio, reflection, and structured practice.')}
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
