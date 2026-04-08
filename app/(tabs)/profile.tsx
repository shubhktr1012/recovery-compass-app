import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { useAuth } from '@/providers/auth';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { formatInr, getOnboardingProjection } from '@/lib/onboarding-metrics';
import { useProfile } from '@/providers/profile';
import { EditProfileSheet } from '@/components/account/EditProfileSheet';
import type { ProgramSlug } from '@/types/content';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STAT_CARD_WIDTH = SCREEN_WIDTH - 48; // p-6 on both sides

interface StatCard {
  label: string;
  value: string | number;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { access, profile, progress } = useProfile();
  const onboardingQuery = useOnboardingResponse();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeStatIndex, setActiveStatIndex] = useState(0);

  const stats = useMemo(() => {
    const projection = getOnboardingProjection(onboardingQuery.data ?? null);
    const joinedDays = profile?.created_at
      ? Math.floor(Math.max(0, Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      avoidedUnits90Days: projection.avoidedUnits90Days,
      joinedDays,
      projectedSavings90Days: projection.projectedSavings90Days,
    };
  }, [onboardingQuery.data, profile?.created_at]);

  const activeProgram = access.ownedProgram ? PROGRAM_METADATA[access.ownedProgram as ProgramSlug] : null;

  // Derive display name with fallbacks
  const displayName = profile?.display_name
    || onboardingQuery.data?.full_name?.trim().split(/\s+/)[0]
    || user?.email?.split('@')[0]
    || 'Your Account';

  const avatarUrl = profile?.avatar_url ?? null;
  const emailDisplay = user?.email ?? 'Signed in';

  // Featured stat cards
  const statCards: StatCard[] = useMemo(() => {
    const cards: StatCard[] = [
      {
        label: 'Days in Motion',
        value: stats.joinedDays,
        subtitle: 'since you started your journey',
        icon: 'flame-outline',
      },
      {
        label: 'Projected 90-Day Savings',
        value: formatInr(stats.projectedSavings90Days),
        subtitle: 'based on your daily spend',
        icon: 'wallet-outline',
      },
      {
        label: '90-Day Units Avoided',
        value: stats.avoidedUnits90Days,
        subtitle: 'if you stay on track',
        icon: 'shield-checkmark-outline',
      },
    ];

    if (activeProgram && progress) {
      cards.push({
        label: 'Program Progress',
        value: `${progress.completedDays.length}/${activeProgram.totalDays}`,
        subtitle: `days completed in ${activeProgram.name}`,
        icon: 'checkmark-circle-outline',
      });
    }

    return cards;
  }, [stats, activeProgram, progress]);

  const handleStatScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / STAT_CARD_WIDTH);
    setActiveStatIndex(Math.max(0, Math.min(index, statCards.length - 1)));
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="pb-32">
        {/* ─── Header ─── */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <Text className="font-erode-bold text-3xl text-forest">Account</Text>
          <TouchableOpacity
            onPress={() => router.push('/account/settings')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color="#06290C" />
          </TouchableOpacity>
        </View>

        {/* ─── Identity Block ─── */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center">
            {/* Avatar */}
            <TouchableOpacity
              onPress={() => setIsEditOpen(true)}
              activeOpacity={0.8}
            >
              <View className="w-20 h-20 rounded-full overflow-hidden bg-sage items-center justify-center border-2 border-forest/10">
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="font-erode-bold text-3xl text-forest/30">
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Name & Email */}
            <View className="ml-4 flex-1">
              <Text className="font-erode-bold text-2xl text-forest leading-8" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="font-satoshi text-sm text-gray-500 mt-0.5" numberOfLines={1}>
                {emailDisplay}
              </Text>
            </View>
          </View>

          {/* Edit Profile CTA */}
          <TouchableOpacity
            onPress={() => setIsEditOpen(true)}
            className="mt-4 flex-row items-center justify-center py-2.5 rounded-full border border-gray-200 bg-white"
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color="#06290C" />
            <Text className="font-satoshi-medium text-sm text-forest ml-1.5">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Active Program Block ─── */}
        <View className="px-6 mb-5">
          <View className="rounded-3xl bg-white border border-gray-200 p-5">
            <Text className="font-satoshi-bold text-xs uppercase text-gray-400 tracking-wider mb-2">
              Active Program
            </Text>
            {activeProgram ? (
              <>
                <Text className="font-erode-semibold text-xl text-forest">
                  {activeProgram.name}
                </Text>
                <Text className="font-satoshi text-sm text-gray-500 mt-1">
                  Day {progress?.completedDays.length ?? 0} of {activeProgram.totalDays}
                  {access.completionState === 'completed' ? ' · Completed' : ''}
                </Text>
              </>
            ) : (
              <Text className="font-satoshi text-base text-gray-400 italic">
                No active program yet
              </Text>
            )}
          </View>
        </View>

        {/* ─── Featured Stat Card (swipeable) ─── */}
        <View className="mb-2">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleStatScroll}
            decelerationRate="fast"
            snapToInterval={STAT_CARD_WIDTH}
            snapToAlignment="start"
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {statCards.map((card, index) => (
              <View
                key={card.label}
                className="rounded-3xl bg-forest p-6"
                style={{
                  width: STAT_CARD_WIDTH,
                  marginRight: index < statCards.length - 1 ? 12 : 0,
                }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="w-9 h-9 rounded-full bg-white/15 items-center justify-center mr-2.5">
                    <Ionicons name={card.icon} size={18} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text className="font-satoshi-bold text-white/70 text-xs uppercase tracking-wider">
                    {card.label}
                  </Text>
                </View>
                <Text className="font-erode-bold text-white text-4xl mb-1">
                  {card.value}
                </Text>
                <Text className="font-satoshi text-white/60 text-sm">
                  {card.subtitle}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Pagination dots */}
          {statCards.length > 1 && (
            <View className="flex-row items-center justify-center mt-3 gap-1.5">
              {statCards.map((_, index) => (
                <View
                  key={index}
                  className={`rounded-full ${index === activeStatIndex ? 'bg-forest w-5 h-1.5' : 'bg-gray-300 w-1.5 h-1.5'}`}
                />
              ))}
            </View>
          )}
        </View>

        {/* ─── View Statistics CTA ─── */}
        <View className="px-6 mt-3 mb-5">
          <TouchableOpacity
            onPress={() => router.push('/account/statistics')}
            className="flex-row items-center justify-between py-4 px-5 rounded-2xl bg-white border border-gray-200"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="stats-chart-outline" size={20} color="#06290C" />
              <Text className="font-satoshi-medium text-base text-forest ml-2">View All Statistics</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(5, 41, 12, 0.4)" />
          </TouchableOpacity>
        </View>

        {/* ─── Why You Started ─── */}
        <View className="px-6 mb-6">
          <View className="rounded-3xl bg-sage/60 border border-forest/5 p-6">
            <Text className="font-erode-semibold text-lg text-forest mb-2">Why You Started</Text>
            <Text className="font-satoshi text-gray-700 leading-7 text-base">
              {onboardingQuery.data?.primary_goal ?? 'Finish onboarding to generate your personal reason and projection.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Bottom Sheet */}
      <EditProfileSheet isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </SafeAreaView>
  );
}
