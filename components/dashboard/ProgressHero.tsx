import { View, Text } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { formatInr, getOnboardingProjection } from '@/lib/onboarding-metrics';
import { useProfile } from '@/providers/profile';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { AppTypography } from '@/constants/typography';

export function ProgressHero() {
    const { access, profile } = useProfile();
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
    const activeProgramName = access.ownedProgram ? PROGRAM_METADATA[access.ownedProgram]?.name ?? null : null;

    return (
        <View className="mb-6">
            {/* Primary metric — the anchor */}
            {hasMoneyProjection ? (
                <View className="mb-5">
                    <Text className="uppercase text-forest/35 mb-1" style={[AppTypography.meta, { letterSpacing: 2.2 }]}>
                        90-Day Projection
                    </Text>
                    <Text className="text-forest tracking-tight" style={AppTypography.displayNumberXl}>
                        {formatInr(metrics.projectedSavings90Days)}
                    </Text>
                    <Text className="mt-1 text-forest/40" style={AppTypography.bodyCompact}>
                        Potential savings if you stay on track
                    </Text>
                </View>
            ) : (
                <View className="mb-5">
                    <Text className="uppercase text-forest/35 mb-1" style={[AppTypography.meta, { letterSpacing: 2.2 }]}>
                        Your Path
                    </Text>
                    <Text className="text-forest tracking-tight" style={AppTypography.displayHero}>
                        {activeProgramName ?? metrics.targetSelection ?? 'Recovery'}
                    </Text>
                </View>
            )}

            {/* Secondary stats — quiet inline row */}
            <View className="flex-row gap-4 mb-2">
                <View className="flex-1 rounded-2xl bg-sage/60 p-4">
                    <Text className="uppercase text-forest/40 mb-1" style={[AppTypography.meta, { letterSpacing: 1.6 }]}>
                        In Motion
                    </Text>
                    <Text className="text-forest" style={AppTypography.dataPoint}>
                        {metrics.days}d {metrics.hours}h
                    </Text>
                </View>
                {hasMoneyProjection && (
                    <View className="flex-1 rounded-2xl bg-sage/60 p-4">
                        <Text className="uppercase text-forest/40 mb-1" style={[AppTypography.meta, { letterSpacing: 1.6 }]}>
                            {unitsLabel}
                        </Text>
                        <Text className="text-forest" style={AppTypography.dataPoint}>
                            {metrics.avoidedUnits90Days.toLocaleString()}
                        </Text>
                    </View>
                )}
            </View>

            {/* Primary goal — editorial quote block */}
            {metrics.primaryGoal ? (
                <View className="mt-3 border-l-2 border-forest/10 pl-4 py-1">
                    <Text className="uppercase text-forest/30 mb-1" style={[AppTypography.metaMedium, { letterSpacing: 1.6 }]}>
                        Why this matters
                    </Text>
                    <Text className="text-forest/60" style={AppTypography.displayQuoteLarge}>
                        {metrics.primaryGoal}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}
