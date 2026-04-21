import { View, ScrollView, Text, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Href, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Svg, Path, Rect, Circle, Polygon } from 'react-native-svg';
import { BlurView } from 'expo-blur';

import { useDay } from '@/content';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { getProgramScheduledDay } from '@/lib/programs/schedule';
import { useProfile } from '@/providers/profile';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { JournalCheckIn } from '@/components/dashboard/JournalCheckIn';
import { WhyThisMatters } from '@/components/dashboard/WhyThisMatters';
import { MyPrograms } from '@/components/dashboard/MyPrograms';
import { ExplorePrograms } from '@/components/dashboard/ExplorePrograms';
import type { ProgramSlug } from '@/types/content';
import { programDayQueryKey, programQueryKey } from '@/hooks/contentQueryUtils';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { getOnboardingProjection, formatInr } from '@/lib/onboarding-metrics';

function DashboardTabIcon({
  focused,
  label,
  icon,
}: {
  focused: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <View className="flex-col items-center flex-1 p-1 py-1.5 gap-1">
      {icon}
      <Text
        className="font-satoshi text-[9px] tracking-[0.04em] font-medium mt-0.5"
        style={{ color: focused ? '#06290C' : 'rgba(6,41,12,0.32)' }}
      >
        {label}
      </Text>
    </View>
  );
}

function HomeScreenContent({ activeProgram }: { activeProgram: ProgramSlug }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { access } = useProfile();
  const program = PROGRAM_METADATA[activeProgram];
  const { data: onboardingResponse } = useOnboardingResponse();
  const queryClient = useQueryClient();

  const currentDayNumber = access.completionState === 'completed'
    ? program.totalDays
    : access.startedAt
      ? getProgramScheduledDay(access.startedAt, program.totalDays)
      : access.currentDay ?? 1;

  const { day: currentDay } = useDay(activeProgram, currentDayNumber);
  const resolvedDayNumber = currentDay?.dayNumber ?? currentDayNumber;

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: programQueryKey(activeProgram) });
      void queryClient.invalidateQueries({
        queryKey: programDayQueryKey(activeProgram, currentDayNumber),
      });
    }, [activeProgram, currentDayNumber, queryClient])
  );

  const dayPreview = (() => {
    if (!currentDay) return program.description;
    const introCard = currentDay.cards.find((c) => c.type === 'intro');
    if (introCard?.type === 'intro') return introCard.goal;
    const lessonCard = currentDay.cards.find((c) => c.type === 'lesson');
    if (lessonCard?.type === 'lesson') return lessonCard.highlight ?? lessonCard.paragraphs[0] ?? program.description;
    return program.description;
  })();

  const projection = getOnboardingProjection(onboardingResponse ?? null);
  const firstName = projection.firstName || 'Friend';
  const avatarLetter = firstName[0]?.toUpperCase() ?? 'S';
  const percentageComplete = Math.min(100, Math.round((currentDayNumber / program.totalDays) * 100));

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="light" />
      <ScrollView contentContainerClassName="flex-grow pb-32" bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <DashboardHeader
          firstName={firstName}
          avatarLetter={avatarLetter}
          currentDayNumber={currentDayNumber}
          percentageComplete={percentageComplete}
          totalDays={program.totalDays}
          projectedSavings90Days={projection.projectedSavings90Days}
        />

        {/* CONTENT AREA */}
        {/* CRITICAL: rounded-[28px] top corners ONLY, marginTop: -28px to overlap the dark header */}
        <View 
          className="bg-surface rounded-t-[28px] -mt-[28px] px-5 pt-6 pb-28 relative z-10 flex-col gap-4"
          style={{ minHeight: 600 }}
        >
          
          <ActionCard
            currentDayNumber={currentDayNumber}
            programName={program.name}
            dayTitle={
              currentDay?.dayTitle ? currentDay.dayTitle.split(' ').map((word, i, arr) => 
                i === arr.length - 1 ? <Text key={i} className="font-erode-medium-italic">{word}</Text> : `${word} `
              ) : <><Text>Your next</Text> <Text className="font-erode-medium-italic">recovery step.</Text></>
            }
            dayPreview={dayPreview}
            estimatedMinutes={currentDay?.estimatedMinutes ?? 5}
            activeProgram={activeProgram}
            resolvedDayNumber={resolvedDayNumber}
          />

          <StatsRow
            currentDayNumber={currentDayNumber}
            monthlySpend={projection.monthlySpend}
          />

          <JournalCheckIn />
          
          <WhyThisMatters />

          <MyPrograms
            programName={program.name}
            programDescription={program.description}
            currentDayNumber={currentDayNumber}
            totalDays={program.totalDays}
            percentageComplete={percentageComplete}
          />

          <ExplorePrograms />

        </View>
      </ScrollView>

      {/* TAB BAR — floating, frosted glass */}
      {/* CRITICAL: position: absolute, bottom: 16 (or safe area), backdrop-filter blur(20px), borderRadius: 28px */}
      <View style={{ bottom: Math.max(insets.bottom + 8, 16) }} className="absolute left-4 right-4 z-50 rounded-[28px] overflow-hidden shadow-2xl shadow-forest/10 border border-white/20">
        <BlurView intensity={Platform.OS === 'ios' ? 88 : 100} tint="light" className="flex-row items-center justify-around px-2 py-1 bg-white/70">
          <Pressable onPress={() => router.push('/')} className="flex-1">
            <DashboardTabIcon 
              focused={true} 
              label="Home" 
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z"/>
                </Svg>
              } 
            />
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/program')} className="flex-1">
            <DashboardTabIcon 
              focused={false} 
              label="Program" 
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.32)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="3" y="3" width="7" height="7" rx="1"/><Rect x="14" y="3" width="7" height="7" rx="1"/>
                  <Rect x="3" y="14" width="7" height="7" rx="1"/><Rect x="14" y="14" width="7" height="7" rx="1"/>
                </Svg>
              } 
            />
          </Pressable>
          {/* Ground button removed per instructions */}
          <Pressable onPress={() => router.push('/(tabs)/journal')} className="flex-1">
            <DashboardTabIcon 
              focused={false} 
              label="Journal" 
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.32)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </Svg>
              } 
            />
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile')} className="flex-1">
            <DashboardTabIcon 
              focused={false} 
              label="Profile" 
              icon={
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.32)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                </Svg>
              } 
            />
          </Pressable>
        </BlurView>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { access, isLoading } = useProfile();

  if (isLoading || !access.ownedProgram || access.purchaseState === 'not_owned') {
    return null;
  }

  return <HomeScreenContent activeProgram={access.ownedProgram as ProgramSlug} />;
}
