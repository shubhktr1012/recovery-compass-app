import { View, Text } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useProfile } from '@/providers/profile';

const COST_PER_PACK = 12;
const CIGS_PER_PACK = 20;
const COST_PER_CIG = COST_PER_PACK / CIGS_PER_PACK;

export function ProgressHero() {
    const { profile } = useProfile();
    const [nowMs, setNowMs] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setNowMs(Date.now());
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const metrics = useMemo(() => {
        if (!profile?.quit_date) {
            return { days: 0, hours: 0, moneySaved: 0, cigsAvoided: 0 };
        }

        const quitDateMs = new Date(profile.quit_date).getTime();
        const diffMs = Math.max(0, nowMs - quitDateMs);

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const cigarettesPerDay = profile.cigarettes_per_day ?? 0;
        const elapsedDays = diffMs / (1000 * 60 * 60 * 24);
        const cigsAvoided = Math.floor(cigarettesPerDay * elapsedDays);
        const moneySaved = Math.floor(cigsAvoided * COST_PER_CIG);

        return { days, hours, moneySaved, cigsAvoided };
    }, [nowMs, profile?.cigarettes_per_day, profile?.quit_date]);

    return (
        <View className="bg-forest rounded-3xl p-6 mb-6 shadow-md">
            <Text className="text-white/70 font-satoshi text-sm uppercase mb-1 tracking-widest">
                Smoke Free Time
            </Text>

            <View className="flex-row items-baseline mb-6">
                <Text className="text-white font-erode-bold text-5xl mr-2">
                    {metrics.days}
                </Text>
                <Text className="text-white/90 font-satoshi text-xl mr-4">
                    Days
                </Text>
                <Text className="text-white font-erode-bold text-5xl mr-2">
                    {metrics.hours}
                </Text>
                <Text className="text-white/90 font-satoshi text-xl">
                    Hrs
                </Text>
            </View>

            <View className="h-px bg-white/10 w-full mb-4" />

            <View className="flex-row justify-between items-center">
                <View>
                    <Text className="text-white/60 font-satoshi text-xs mb-1">
                        Money Saved
                    </Text>
                    <Text className="text-white font-satoshi-bold text-xl">
                        ${metrics.moneySaved.toLocaleString()}
                    </Text>
                </View>
                <View>
                    <Text className="text-white/60 font-satoshi text-xs mb-1">
                        Cigs Avoided
                    </Text>
                    <Text className="text-white font-satoshi-bold text-xl">
                        {metrics.cigsAvoided}
                    </Text>
                </View>
            </View>
        </View>
    );
}
