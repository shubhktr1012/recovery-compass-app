import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as Haptics from 'expo-haptics';
import { useProfile } from '@/providers/profile';
import { useAuth } from '@/providers/auth';
import { AppColors } from '@/constants/theme';

// --- DATA ---
const TRIGGERS_LIST = [
    'Stress / Anxiety',
    'Social Situations',
    'Morning Coffee',
    'After Meals',
    'Alcohol',
    'Boredom',
    'Driving',
    'Work Breaks',
];

// --- TYPES ---
type WizardData = {
    cigarettesPerDay: string;
    yearsSmoked: string;
    quitDate: Date;
    triggers: string[];
    motivation: string;
};

export default function Personalization() {
    const router = useRouter();
    const { refreshProfile } = useProfile();
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<WizardData>({
        cigarettesPerDay: '',
        yearsSmoked: '',
        quitDate: new Date(),
        triggers: [],
        motivation: '',
    });

    // --- STEPS CONFIG ---
    const steps = [
        { title: 'Habits', description: 'Understanding your baseline helps us tailor the plan.' },
        { title: 'Quit Date', description: 'When was your last cigarette? Or when do you plan to quit?' },
        { title: 'Triggers', description: 'Select your top 3 triggers.' },
        { title: 'Motivation', description: 'Why is this important to you?' },
    ];

    // --- HANDLERS ---
    const handleUpdate = (key: keyof WizardData, value: any) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const toggleTrigger = (trigger: string) => {
        Haptics.selectionAsync();
        setData((prev) => {
            const exists = prev.triggers.includes(trigger);
            if (exists) {
                return { ...prev, triggers: prev.triggers.filter((t) => t !== trigger) };
            }
            if (prev.triggers.length >= 3) {
                Alert.alert('Limit Reached', 'Please select only your top 3 triggers.');
                return prev;
            }
            return { ...prev, triggers: [...prev.triggers, trigger] };
        });
    };

    const handleNext = async () => {
        if (step < steps.length - 1) {
            // Validation per step
            if (step === 0 && (!data.cigarettesPerDay || !data.yearsSmoked)) {
                return Alert.alert('Required', 'Please fill in all fields.');
            }
            if (step === 2 && data.triggers.length === 0) {
                return Alert.alert('Required', 'Please select at least one trigger.');
            }

            setStep(step + 1);
        } else {
            await saveProfile();
        }
    };

    const saveProfileMutation = useMutation({
        mutationFn: async (wizardData: WizardData) => {
            if (!user) {
                throw new Error('No user found');
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    cigarettes_per_day: parseInt(wizardData.cigarettesPerDay, 10),
                    // years_smoked: parseInt(wizardData.yearsSmoked), // Assuming we add this column later or just use it for analytics
                    quit_date: wizardData.quitDate.toISOString(),
                    triggers: wizardData.triggers,
                    onboarding_complete: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;
        },
    });

    const saveProfile = async () => {
        try {
            await saveProfileMutation.mutateAsync(data);
            await refreshProfile();

            // Success!
            router.replace('/paywall' as Href); // Navigate to Paywall next

        } catch (error: any) {
            Alert.alert('Error Saving Profile', error.message);
        }
    };

    // --- RENDERERS ---
    const renderStepContent = () => {
        switch (step) {
            case 0: // Habits
                return (
                    <View className="space-y-6">
                        <Input
                            label="Cigarettes per day"
                            placeholder="e.g. 15"
                            keyboardType="numeric"
                            value={data.cigarettesPerDay}
                            onChangeText={(t) => handleUpdate('cigarettesPerDay', t)}
                        />
                        <Input
                            label="Years smoked"
                            placeholder="e.g. 5"
                            keyboardType="numeric"
                            value={data.yearsSmoked}
                            onChangeText={(t) => handleUpdate('yearsSmoked', t)}
                        />
                    </View>
                );
            case 1: // Quit Date
                return (
                    <View className="items-center space-y-4">
                        {Platform.OS === 'ios' ? (
                            <DateTimePicker
                                value={data.quitDate}
                                mode="datetime"
                                display="spinner"
                                onChange={(e, date) => date && handleUpdate('quitDate', date)}
                                style={{ width: '100%', height: 200 }}
                                textColor={AppColors.forest}
                            />
                        ) : (
                            <Button
                                label={data.quitDate.toLocaleDateString()}
                                onPress={() => {/* Show Android Picker Logic - Simplified for now */ }}
                                variant="outline"
                            />
                        )}
                        <Text className="text-gray-500 text-sm text-center">
                            Accurate tracking starts from this moment.
                        </Text>
                    </View>
                );
            case 2: // Triggers
                return (
                    <ScrollView className="max-h-96">
                        <View className="flex-row flex-wrap gap-3">
                            {TRIGGERS_LIST.map((t) => {
                                const selected = data.triggers.includes(t);
                                return (
                                    <Button
                                        key={t}
                                        label={t}
                                        size="sm"
                                        variant={selected ? 'primary' : 'outline'}
                                        onPress={() => toggleTrigger(t)}
                                        className="min-w-[45%]"
                                    />
                                );
                            })}
                        </View>
                    </ScrollView>
                );
            case 3: // Motivation
                return (
                    <View>
                        <Input
                            label="I want to quit because..."
                            placeholder="My health, my family, financial freedom..."
                            multiline
                            numberOfLines={4}
                            value={data.motivation}
                            onChangeText={(t) => handleUpdate('motivation', t)}
                            style={{ height: 120, textAlignVertical: 'top' }}
                        />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <StatusBar style="dark" />
            <View className="flex-1 px-6 pt-6">
                {/* Header */}
                <View className="mb-8">
                    <Text className="text-sm font-satoshi-bold text-gray-400 mb-2">
                        Step {step + 1} of {steps.length}
                    </Text>
                    <View className="h-1 bg-gray-200 rounded-full mb-6 overflow-hidden">
                        <View
                            className="h-full bg-forest transition-all duration-300"
                            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                        />
                    </View>
                    <Text className="font-erode-bold text-3xl text-forest mb-2">
                        {steps[step].title}
                    </Text>
                    <Text className="font-satoshi text-gray-500 text-lg">
                        {steps[step].description}
                    </Text>
                </View>

                {/* Content */}
                <View className="flex-1">
                    {renderStepContent()}
                </View>

                {/* Footer */}
                <View className="pb-8 pt-4">
                    <Button
                        label={step === steps.length - 1 ? "Complete Setup" : "Next"}
                        onPress={handleNext}
                        loading={saveProfileMutation.isPending}
                        size="lg"
                    />
                    {step > 0 && (
                        <Button
                            label="Back"
                            variant="ghost"
                            onPress={() => setStep(step - 1)}
                            className="mt-2"
                        />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
