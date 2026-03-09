import { View, Text } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { formatInr, getOnboardingProjection } from '@/lib/onboarding-metrics';
import { useProfile } from '@/providers/profile';

export function ProgressHero() {
    const { profile } = useProfile();
    const onboardingQuery = useOnboardingResponse();
    const [nowMs, setNowMs] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setNowMs(Date.now());
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const metrics = useMemo(() => {
        const projection = getOnboardingProjection(onboardingQuery.data ?? null);
        const startMs = profile?.created_at ? new Date(profile.created_at).getTime() : null;
        const diffMs = startMs ? Math.max(0, nowMs - startMs) : 0;

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return {
            avoidedUnits90Days: projection.avoidedUnits90Days,
            days,
            hours,
            primaryGoal: projection.primaryGoal,
            projectedSavings90Days: projection.projectedSavings90Days,
            targetSelection: projection.targetSelection,
        };
    }, [nowMs, onboardingQuery.data, profile?.created_at]);

    const unitsLabel = metrics.targetSelection === 'Quit Alcohol'
        ? 'Drinks avoided'
        : metrics.targetSelection === 'Quit Smoking'
            ? 'Cigarettes avoided'
            : 'Vices sidestepped';

    return (
        <View className="mb-6 overflow-hidden rounded-[32px] bg-forest p-6 shadow-md">
            <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <View className="absolute -bottom-12 right-12 h-28 w-28 rounded-full bg-white/5" />
            <Text className="mb-1 font-satoshi text-sm uppercase tracking-[2px] text-white/70">
                Your 90-Day Projection
            </Text>
            <Text className="mb-2 font-erode-bold text-5xl text-white">
                {formatInr(metrics.projectedSavings90Days)}
            </Text>
            <Text className="mb-6 max-w-[280px] font-satoshi text-base text-white/85">
                Potential money back over the next 90 days if you stick to the plan.
            </Text>

            <View className="mb-4 h-px w-full bg-white/10" />

            <View className="flex-row items-center justify-between rounded-[24px] border border-white/10 bg-white/5 p-4">
                <View>
                    <Text className="mb-1 font-satoshi text-xs text-white/60">
                        Plan In Motion
                    </Text>
                    <Text className="font-satoshi-bold text-xl text-white">
                        {metrics.days}d {metrics.hours}h
                    </Text>
                </View>
                <View className="items-end">
                    <Text className="mb-1 font-satoshi text-xs text-white/60">
                        {unitsLabel}
                    </Text>
                    <Text className="font-satoshi-bold text-xl text-white">
                        {metrics.avoidedUnits90Days.toLocaleString()}
                    </Text>
                </View>
            </View>

            {metrics.primaryGoal ? (
                <View className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <Text className="mb-1 font-satoshi text-xs text-white/60">Why this matters</Text>
                    <Text className="font-satoshi text-base leading-7 text-white">{metrics.primaryGoal}</Text>
                </View>
            ) : null}
        </View>
    );
}
