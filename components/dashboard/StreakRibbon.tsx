import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useProfile } from '@/providers/profile';
import { useMinuteClock } from '@/hooks/useMinuteClock';
import { useFinalizedDayStates } from '@/hooks/useFinalizedDayStates';
import { buildDayStateProgressSummary } from '@/lib/day-state-summary';
import { getProgramActiveDay, getProgramScheduledDay } from '@/lib/programs/schedule';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import type { ProgramSlug } from '@/types/content';

export function StreakRibbon() {
    const { access, profile, progress } = useProfile();
    const activeProgram = access.ownedProgram as ProgramSlug | null;
    const programMeta = activeProgram ? PROGRAM_METADATA[activeProgram] : null;
    const totalDays = programMeta?.totalDays ?? 1;
    const now = useMinuteClock();
    const userId = profile?.id ?? access.ownerUserId ?? null;
    const finalizedDayStatesQuery = useFinalizedDayStates(userId, activeProgram);
    const finalizedDayStates = finalizedDayStatesQuery.data ?? [];
    const dayStateSummary = useMemo(
        () => buildDayStateProgressSummary(finalizedDayStates),
        [finalizedDayStates]
    );
    const finalizedStateByDay = useMemo(
        () => new Map(finalizedDayStates.map((dayState) => [dayState.dayNumber, dayState.dayState])),
        [finalizedDayStates]
    );
    const hasFinalizedDayStateTruth = finalizedDayStates.length > 0;

    // Pulse animation for "today" dot
    const pulseOpacity = useSharedValue(0.4);
    React.useEffect(() => {
        pulseOpacity.value = withRepeat(
            withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, [pulseOpacity]);

    const pulseStyle = useAnimatedStyle(() => ({
        opacity: pulseOpacity.value,
    }));

    const { dots, completedCount } = useMemo(() => {
        const completedDays = hasFinalizedDayStateTruth
            ? dayStateSummary.completedDays
            : progress?.completedDays ?? [];
        const partialDays = hasFinalizedDayStateTruth
            ? dayStateSummary.partialDays
            : progress?.partialDays ?? [];
        const currentScheduledDay = access.startedAt
            ? getProgramScheduledDay(access.startedAt, totalDays, now)
            : access.currentDay ?? 1;
        const activeDayNumber = access.startedAt
            ? getProgramActiveDay(access.startedAt, totalDays, now)
            : currentScheduledDay;

        // Show days 1 through min(7, currentScheduledDay), left-to-right
        // Early users see fewer dots, not empty padding
        const windowSize = Math.min(7, currentScheduledDay);
        const startDay = currentScheduledDay - windowSize + 1;

        const result: { dayNumber: number; status: 'completed' | 'partial' | 'today' | 'missed' }[] = [];
        let completed = 0;

        for (let dayNum = startDay; dayNum <= currentScheduledDay; dayNum++) {
            const finalizedState = finalizedStateByDay.get(dayNum);
            if (finalizedState === 'completed') {
                result.push({ dayNumber: dayNum, status: 'completed' });
                completed++;
                continue;
            }
            if (finalizedState === 'partial') {
                result.push({ dayNumber: dayNum, status: 'partial' });
                continue;
            }
            if (finalizedState === 'skipped') {
                result.push({ dayNumber: dayNum, status: 'missed' });
                continue;
            }

            if (dayNum === currentScheduledDay) {
                const isCompleted = completedDays.includes(dayNum);
                if (isCompleted) {
                    result.push({ dayNumber: dayNum, status: 'completed' });
                    completed++;
                } else if (partialDays.includes(dayNum)) {
                    result.push({ dayNumber: dayNum, status: 'partial' });
                } else if (activeDayNumber === dayNum) {
                    result.push({ dayNumber: dayNum, status: 'today' });
                } else {
                    result.push({ dayNumber: dayNum, status: 'missed' });
                }
            } else if (completedDays.includes(dayNum)) {
                result.push({ dayNumber: dayNum, status: 'completed' });
                completed++;
            } else if (partialDays.includes(dayNum)) {
                result.push({ dayNumber: dayNum, status: 'partial' });
            } else {
                result.push({ dayNumber: dayNum, status: 'missed' });
            }
        }

        return { dots: result, completedCount: completed };
    }, [
        access.currentDay,
        access.startedAt,
        dayStateSummary.completedDays,
        dayStateSummary.partialDays,
        finalizedStateByDay,
        hasFinalizedDayStateTruth,
        now,
        progress?.completedDays,
        progress?.partialDays,
        totalDays,
    ]);

    if (!activeProgram || access.purchaseState === 'not_owned') {
        return null;
    }

    const windowLabel = dots.length < 7
        ? `${completedCount} of ${dots.length} day${dots.length === 1 ? '' : 's'} completed`
        : `${completedCount} of the last 7 days completed`;

    return (
        <View className="mb-6">
            {/* Day dot row */}
            <View className="flex-row items-center justify-center gap-3 mb-3">
                {dots.map((dot, index) => {
                    if (dot.status === 'completed') {
                        return (
                            <View
                                key={index}
                                className="w-4 h-4 rounded-full bg-success"
                            />
                        );
                    }
                    if (dot.status === 'partial') {
                        return (
                            <View
                                key={index}
                                className="w-4 h-4 rounded-full border-2 border-[#9A5B13]/70 bg-[#F7E2B5]"
                            />
                        );
                    }
                    if (dot.status === 'today') {
                        return (
                            <View key={index} className="w-6 h-6 items-center justify-center">
                                <Animated.View
                                    className="absolute w-6 h-6 rounded-full bg-success/20"
                                    style={pulseStyle}
                                />
                                <View className="w-4 h-4 rounded-full bg-forest" />
                            </View>
                        );
                    }
                    // missed
                    return (
                        <View
                            key={index}
                            className="w-4 h-4 rounded-full border-2 border-forest/30 bg-forest/5"
                        />
                    );
                })}
            </View>

            {/* Summary line */}
            <Text className="text-center font-satoshi text-[13px] tracking-[0.5px] text-forest/40">
                {windowLabel}
            </Text>
        </View>
    );
}
