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
    const hasMoneyProjection = metrics.projectedSavings90Days > 0;

    return (
        <View className="mb-6">
            {/* Primary metric — the anchor */}
            {hasMoneyProjection ? (
                <View className="mb-5">
                    <Text className="font-satoshi text-[11px] uppercase tracking-[3px] text-forest/35 mb-1">
                        90-Day Projection
                    </Text>
                    <Text className="font-erode-medium text-[48px] leading-[52px] tracking-tight text-forest">
                        {formatInr(metrics.projectedSavings90Days)}
                    </Text>
                    <Text className="mt-1 font-satoshi text-[14px] leading-5 text-forest/40">
                        Potential savings if you stay on track
                    </Text>
                </View>
            ) : (
                <View className="mb-5">
                    <Text className="font-satoshi text-[11px] uppercase tracking-[3px] text-forest/35 mb-1">
                        Your Path
                    </Text>
                    <Text className="font-erode-medium text-[32px] leading-[38px] tracking-tight text-forest">
                        {metrics.targetSelection ?? 'Recovery'}
                    </Text>
                </View>
            )}

            {/* Secondary stats — quiet inline row */}
            <View className="flex-row gap-4 mb-2">
                <View className="flex-1 rounded-2xl bg-sage/60 p-4">
                    <Text className="font-satoshi text-[11px] uppercase tracking-[2px] text-forest/40 mb-1">
                        In Motion
                    </Text>
                    <Text className="font-satoshi-bold text-[20px] text-forest">
                        {metrics.days}d {metrics.hours}h
                    </Text>
                </View>
                {hasMoneyProjection && (
                    <View className="flex-1 rounded-2xl bg-sage/60 p-4">
                        <Text className="font-satoshi text-[11px] uppercase tracking-[2px] text-forest/40 mb-1">
                            {unitsLabel}
                        </Text>
                        <Text className="font-satoshi-bold text-[20px] text-forest">
                            {metrics.avoidedUnits90Days.toLocaleString()}
                        </Text>
                    </View>
                )}
            </View>

            {/* Primary goal — editorial quote block */}
            {metrics.primaryGoal ? (
                <View className="mt-3 border-l-2 border-forest/10 pl-4 py-1">
                    <Text className="font-satoshi-medium text-[11px] uppercase tracking-[2px] text-forest/30 mb-1">
                        Why this matters
                    </Text>
                    <Text className="font-erode-italic text-[16px] leading-7 text-forest/60">
                        {metrics.primaryGoal}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}
