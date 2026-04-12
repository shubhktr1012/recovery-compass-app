import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { useAuth } from '@/providers/auth';
import { useOnboardingResponse } from '@/hooks/useOnboardingResponse';
import { formatInr, getOnboardingProjection } from '@/lib/onboarding-metrics';
import { useProfile } from '@/providers/profile';
import { supabase } from '@/lib/supabase';
import { EditProfileSheet } from '@/components/account/EditProfileSheet';
import type { ProgramSlug } from '@/types/content';
import { AppColors } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STAT_CARD_WIDTH = SCREEN_WIDTH - 48;

interface StatCard {
  label: string;
  value: string | number;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { access, profile, progress, uploadAvatar } = useProfile();
  const onboardingQuery = useOnboardingResponse();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeStatIndex, setActiveStatIndex] = useState(0);
  const userId = user?.id ?? null;

  // Journal entry count
  const journalCountQuery = useQuery({
    queryKey: ['journal-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: Boolean(userId),
  });

  // Calculate streak from completedDays
  const { currentStreak, bestStreak } = useMemo(() => {
    const days = progress?.completedDays ?? [];
    if (days.length === 0) return { currentStreak: 0, bestStreak: 0 };
    const sorted = [...days].sort((a, b) => a - b);
    let best = 1;
    let current = 1;
    let runLength = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1]! + 1) {
        runLength++;
      } else {
        runLength = 1;
      }
      best = Math.max(best, runLength);
    }
    // Current streak = run ending at the last completed day
    current = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      if (sorted[i] === sorted[i - 1]! + 1) {
        current++;
      } else {
        break;
      }
    }
    return { currentStreak: current, bestStreak: best };
  }, [progress?.completedDays]);

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

  const displayName = profile?.display_name
    || onboardingQuery.data?.full_name?.trim().split(/\s+/)[0]
    || user?.email?.split('@')[0]
    || 'Your Account';

  const avatarUrl = profile?.avatar_url ?? null;
  const emailDisplay = user?.email ?? 'Signed in';

  // Direct avatar change via image picker
  const handleAvatarTap = async () => {
    try {
      const { requireOptionalNativeModule } = await import('expo-modules-core');
      const hasImagePickerNativeModule = Boolean(
        requireOptionalNativeModule('ExponentImagePicker')
      );
      if (!hasImagePickerNativeModule) {
        Alert.alert('Profile photo unavailable', 'Photo upload needs a fresh native iOS build.');
        return;
      }
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Profile photo unavailable', 'We could not open your photo library right now.');
    }
  };

  const statCards: StatCard[] = useMemo(() => {
    const cards: StatCard[] = [
      {
        label: 'Days in Motion',
        value: stats.joinedDays,
        subtitle: 'since you started your journey',
        icon: 'flame-outline',
      },
      {
        label: '90-Day Savings',
        value: formatInr(stats.projectedSavings90Days),
        subtitle: 'projected accumulation',
        icon: 'wallet-outline',
      },
      {
        label: 'Units Avoided',
        value: stats.avoidedUnits90Days,
        subtitle: 'across 90 days',
        icon: 'shield-checkmark-outline',
      },
      {
        label: 'Reflections',
        value: journalCountQuery.data ?? 0,
        subtitle: 'journal entries written',
        icon: 'book-outline',
      },
    ];

    if (activeProgram && progress) {
      cards.push({
        label: 'Program Progress',
        value: `${progress.completedDays.length}/${activeProgram.totalDays}`,
        subtitle: `days in ${activeProgram.name}`,
        icon: 'checkmark-circle-outline',
      });
    }

    if (currentStreak > 0) {
      cards.push({
        label: 'Current Streak',
        value: currentStreak,
        subtitle: bestStreak > currentStreak ? `best: ${bestStreak} days` : 'your best yet!',
        icon: 'trending-up-outline',
      });
    }

    return cards;
  }, [stats, activeProgram, progress, journalCountQuery.data, currentStreak, bestStreak]);

  const handleStatScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / STAT_CARD_WIDTH);
    setActiveStatIndex(Math.max(0, Math.min(index, statCards.length - 1)));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity
            onPress={() => router.push('/account/settings')}
            style={styles.settingsButton}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={AppColors.forest} />
          </TouchableOpacity>
        </View>

        {/* Identity Block */}
        <View style={styles.identityBlock}>
          <View style={styles.identityRow}>
            <TouchableOpacity onPress={() => void handleAvatarTap()} activeOpacity={0.8}>
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarPlaceholder}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.identityTextContainer}>
              <Text style={styles.identityName} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.identityEmail} numberOfLines={1}>{emailDisplay}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setIsEditOpen(true)}
            style={styles.editProfileCta}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={AppColors.forest} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Active Program Block */}
        <View style={styles.sectionContainer}>
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>Active Program</Text>
            {activeProgram ? (
              <>
                <Text style={styles.programTitle}>{activeProgram.name}</Text>
                <Text style={styles.programSubtitle}>
                  Day {progress?.completedDays.length ?? 0} of {activeProgram.totalDays}
                  {access.completionState === 'completed' ? ' · Completed' : ''}
                </Text>
              </>
            ) : (
              <Text style={styles.emptyProgramText}>No active program yet</Text>
            )}
          </View>
        </View>

        {/* Featured Stat Card (swipeable) */}
        <View style={styles.statsSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleStatScroll}
            decelerationRate="fast"
            snapToInterval={STAT_CARD_WIDTH}
            snapToAlignment="start"
            contentContainerStyle={styles.statsScrollContent}
          >
            {statCards.map((card, index) => (
              <View
                key={card.label}
                style={[
                  styles.statCardContainer,
                  { width: STAT_CARD_WIDTH, marginRight: index < statCards.length - 1 ? 12 : 0 }
                ]}
              >
                <View style={styles.statCardHeader}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name={card.icon} size={18} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text style={styles.statCardEyebrow}>{card.label}</Text>
                </View>
                <Text style={styles.statCardValue}>{card.value}</Text>
                <Text style={styles.statCardSubtitle}>{card.subtitle}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Pagination dots */}
          {statCards.length > 1 && (
            <View style={styles.paginationDotsContainer}>
              {statCards.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === activeStatIndex ? styles.activeDot : styles.inactiveDot
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* View Statistics CTA */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            onPress={() => router.push('/account/statistics')}
            style={styles.statsCta}
            activeOpacity={0.7}
          >
            <View style={styles.statsCtaLeft}>
              <Ionicons name="stats-chart-outline" size={20} color={AppColors.forest} />
              <Text style={styles.statsCtaText}>View All Statistics</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(5, 41, 12, 0.4)" />
          </TouchableOpacity>
        </View>

        {/* Why You Started */}
        <View style={styles.sectionContainer}>
          <View style={styles.whyStartedCard}>
            <Text style={styles.whyStartedTitle}>Why You Started</Text>
            <Text style={styles.whyStartedText}>
              {onboardingQuery.data?.primary_goal ?? 'Finish onboarding to generate your personal reason and projection.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <EditProfileSheet isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: 'Erode-Bold',
    fontSize: 28,
    color: AppColors.forest,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityBlock: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: AppColors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(5,41,12,0.1)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    fontFamily: 'Erode-Bold',
    fontSize: 32,
    color: 'rgba(5,41,12,0.3)',
  },
  identityTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  identityName: {
    fontFamily: 'Erode-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: AppColors.forest,
  },
  identityEmail: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: AppColors.iconMuted,
    marginTop: 2,
  },
  editProfileCta: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: AppColors.white,
  },
  editProfileText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: AppColors.forest,
    marginLeft: 6,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 24,
  },
  cardEyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: AppColors.iconMuted,
    marginBottom: 8,
  },
  programTitle: {
    fontFamily: 'Erode-SemiBold',
    fontSize: 20,
    color: AppColors.forest,
  },
  programSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: AppColors.iconMuted,
    marginTop: 4,
  },
  emptyProgramText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
    fontStyle: 'italic',
  },
  statsSection: {
    marginBottom: 8,
  },
  statsScrollContent: {
    paddingHorizontal: 24,
  },
  statCardContainer: {
    borderRadius: 24,
    backgroundColor: AppColors.forest,
    padding: 24,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statCardEyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statCardValue: {
    fontFamily: 'Erode-Bold',
    fontSize: 36,
    color: AppColors.white,
    marginBottom: 4,
  },
  statCardSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  paginationDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  dot: {
    borderRadius: 9999,
  },
  activeDot: {
    backgroundColor: AppColors.forest,
    width: 20,
    height: 6,
  },
  inactiveDot: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    width: 6,
    height: 6,
  },
  statsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  statsCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsCtaText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: AppColors.forest,
    marginLeft: 12,
  },
  whyStartedCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(206,215,203,0.3)', // Sage but much softer
    borderWidth: 1,
    borderColor: 'rgba(5,41,12,0.05)',
    padding: 24,
  },
  whyStartedTitle: {
    fontFamily: 'Erode-SemiBold',
    fontSize: 18,
    color: AppColors.forest,
    marginBottom: 10,
  },
  whyStartedText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(0,0,0,0.7)',
  },
});
