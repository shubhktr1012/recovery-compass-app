
import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { OnboardingItem } from './onboardingData';

interface OnboardingSlideProps {
    item: OnboardingItem;
    index: number;
    totalSlides: number;
}

const MOTIF_COPY: Record<string, { chip: string; note: string; initial: string }> = {
    compass: {
        chip: 'Grounded response',
        note: 'Slow the spiral before it takes over.',
        initial: '01',
    },
    path: {
        chip: 'Built to hold you',
        note: 'Clear structure, softer pressure, daily movement.',
        initial: '02',
    },
    journal: {
        chip: 'Proof of progress',
        note: 'Small reflections that keep your direction visible.',
        initial: '03',
    },
};

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ item, index, totalSlides }) => {
    const { width } = useWindowDimensions();
    const motif = MOTIF_COPY[item.image] ?? MOTIF_COPY.compass;

    return (
        <View style={{ width }} className="flex-1 px-7 pb-12 pt-10">
            <View className="mb-9 flex-row items-center justify-between">
                <Text className="font-satoshi-bold text-[11px] uppercase tracking-[2.2px] text-[#6E695F]">
                    Recovery Compass
                </Text>
                <Text className="font-satoshi text-[12px] tracking-[1.4px] text-[#8F8776]">
                    {String(index + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                </Text>
            </View>

            <View className="relative mb-10 h-[280px] overflow-hidden rounded-[34px] border border-[#E4E7E0] bg-[#F7F8F3] px-6 py-6">
                <View className="absolute left-6 top-6 h-20 w-20 rounded-full bg-[#E7F0E5]" />
                <View className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-[#EEF2EC]" />
                <View className="absolute bottom-0 right-0 h-48 w-36 rounded-tl-[42px] bg-[#163126]" />
                <View className="absolute bottom-7 left-7 h-[1px] w-24 bg-[#D7DBD2]" />

                <View className="h-full justify-between">
                    <View className="max-w-[76%]">
                        <View className="self-start rounded-full border border-[#D8DED5] bg-white/80 px-3 py-1.5">
                            <Text className="font-satoshi-bold text-[10px] uppercase tracking-[1.8px] text-[#5F5A50]">
                                {item.eyebrow}
                            </Text>
                        </View>

                        <View className="mt-6">
                            <Text className="font-erode-semibold text-[28px] leading-[34px] text-[#13281D]">
                                {item.accent}
                            </Text>
                        </View>
                    </View>

                    <View className="w-[74%]">
                        <Text className="font-satoshi-bold text-[11px] uppercase tracking-[1.8px] text-[#7F786B]">
                            {motif.chip}
                        </Text>
                        <Text className="mt-2 font-satoshi text-[14px] leading-6 text-[#514D44]">
                            {motif.note}
                        </Text>
                    </View>
                </View>

                <View className="absolute bottom-6 right-6">
                    <Text className="font-satoshi text-[28px] tracking-[-1px] text-white/88">{motif.initial}</Text>
                </View>
            </View>

            <View className="max-w-[92%]">
                <Text className="font-satoshi-bold text-[11px] uppercase tracking-[2.1px] text-[#6F6A5F]">
                    {item.eyebrow}
                </Text>
                <Text className="mt-4 font-erode-semibold text-[35px] leading-[39px] text-[#13281D]">
                    {item.title}
                </Text>
                <Text className="mt-4 max-w-[94%] font-satoshi text-[15px] leading-7 text-[#5F5A50]">
                    {item.description}
                </Text>
            </View>
        </View>
    );
};
