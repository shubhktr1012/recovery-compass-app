import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/providers/profile';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

export default function Paywall() {
    const router = useRouter();
    const { setSubscriptionStatus } = useProfile();
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
                Alert.alert("Error", "Could not load subscription options.");
            } finally {
                setFetchingOfferings(false);
            }
        };

        getOfferings();
    }, []);

    const handlePurchase = async (pack: PurchasesPackage) => {
        setLoading(true);
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            
            if (typeof customerInfo.entitlements.active['Recovery Compass Pro'] !== "undefined") {
                Alert.alert('Success', 'Welcome to Recovery Compass Pro!');
                setSubscriptionStatus(true);
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert('Purchase Failed', e.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            const customerInfo = await Purchases.restorePurchases();
            if (typeof customerInfo.entitlements.active['Recovery Compass Pro'] !== "undefined") {
                Alert.alert('Success', 'Purchases restored successfully!');
                setSubscriptionStatus(true);
            } else {
                Alert.alert('Restore Failed', 'No active subscription found.');
            }
        } catch (e: any) {
            Alert.alert('Restore Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    const getPackageDisplayName = (pack: PurchasesPackage) => {
        if (pack.packageType === "WEEKLY") return "Weekly";
        if (pack.packageType === "MONTHLY") return "Monthly";
        if (pack.packageType === "ANNUAL") return "Yearly";
        return pack.product.title;
    };

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <StatusBar style="dark" />
            <ScrollView contentContainerClassName="p-6 pb-20">
                <View className="items-center mb-10 mt-4">
                    <Text className="font-erode-bold text-3xl text-forest text-center mb-2">
                        Commit to Your Freedom
                    </Text>
                    <Text className="font-satoshi text-gray-500 text-center text-lg">
                        Choose the plan that fits your journey.
                    </Text>
                </View>

                {fetchingOfferings ? (
                    <ActivityIndicator size="large" color="#2A3F33" className="mt-10" />
                ) : packages.length === 0 ? (
                    <View className="items-center mt-10">
                        <Text className="font-satoshi border border-dashed border-gray-300 p-4 rounded-xl text-gray-500 text-center">
                            No subscription packages found. Please check your RevenueCat configuration in the dashboard. Ensure you have activated an offering with Weekly, Monthly, and Yearly products attached.
                        </Text>
                    </View>
                ) : (
                    packages.map((pack, index) => {
                        const isPrimary = index === packages.length - 1; // Make the longest/last one primary (usually Yearly)
                        
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
                                    {pack.product.description || "Unlock full access to the Recovery Compass Pro protocol."}
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
                    Secured by RevenueCat
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}
