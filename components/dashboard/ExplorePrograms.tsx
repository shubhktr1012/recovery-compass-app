import { Alert, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { Svg, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import type { ProgramContent } from '@/types/content';
import { SkeletonCircle, SkeletonLine, SkeletonTitle } from '@/components/ui/Skeleton';
import { AppTypography } from '@/constants/typography';
import { getAppWebHandoffUrl } from '@/lib/app-web-handoff';

const DIET_PLAN_WEBSITE_PATH = '/diet-plan';

interface ExploreProgramsProps {
  programs: ProgramContent[];
  isLoading?: boolean;
  recommendedProgramSlug?: ProgramContent['slug'] | null;
  title?: string;
  emptyMessage?: string;
}

const programStatusTextStyle = {
  ...AppTypography.eyebrow,
  letterSpacing: 0.66,
  textTransform: 'uppercase' as const,
};

function parsePriceString(priceString: string): number | null {
  const numeric = Number(priceString.replace(/[^\d.]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function formatInr(value: number): string {
  return `₹${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function getDiscountedPrice(priceString?: string | null): string | null {
  if (!priceString) return null;
  const numeric = parsePriceString(priceString);
  if (numeric === null) return null;
  return formatInr(numeric);
}

function getOriginalPrice(priceString?: string | null): string | null {
  if (!priceString) return null;
  const numeric = parsePriceString(priceString);
  if (numeric === null) return null;
  return formatInr(numeric * 2);
}

function getStatusTagProps(program: ProgramContent) {
  if (program.contentStatus === 'ready') {
    return {
      label: 'Available now',
      containerClass: 'bg-[#E3F2E5] px-2 py-0.5 rounded-full',
      textClass: 'text-forest',
    };
  }

  if (program.contentStatus === 'sample') {
    return {
      label: 'Preview available',
      containerClass: 'bg-[#FDF6E3] px-2 py-0.5 rounded-full border border-[#E8DCC2]',
      textClass: 'text-[#916A15]',
    };
  }

  return {
    label: 'Coming soon',
    containerClass: 'bg-surface px-2 py-0.5 rounded-full border border-forest/10',
    textClass: 'text-forest/40',
  };
}

async function openDietPlanWebsite() {
  try {
    const url = await getAppWebHandoffUrl(DIET_PLAN_WEBSITE_PATH);
    await openBrowserAsync(url, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  } catch (error: any) {
    Alert.alert('Could not open Diet Plan', error?.message ?? 'Please visit recoverycompass.co/diet-plan.');
  }
}

export function ProgramIcon({ category }: { category: ProgramContent['category'] }) {
  if (category === 'sleep') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        <Path d="M19 3v4" />
        <Path d="M21 5h-4" />
      </Svg>
    );
  }

  if (category === 'energy') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </Svg>
    );
  }

  if (category === 'aging') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <Path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </Svg>
    );
  }

  if (category === 'sexual_health') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </Svg>
    );
  }

  if (category === 'gut_health') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M7.5 4.5c-1.7 1.4-2.5 3.3-2.5 5.7 0 5.9 4.6 9.3 7 9.3s7-3.4 7-9.3c0-2.4-.8-4.3-2.5-5.7" />
        <Path d="M9 4c0 3.2 1.3 4.5 3 4.5S15 7.2 15 4" />
        <Path d="M9.5 13.2c.8.7 1.6 1 2.5 1s1.7-.3 2.5-1" />
      </Svg>
    );
  }

  if (category === 'smoking') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M2 2l20 20"/><Path d="M12 12H2v4h14"/><Path d="M22 12v4"/><Path d="M18 12h-2v4h2z"/><Path d="M14 16H2v-4h12"/><Path d="M22 12h-4"/><Path d="M18 12V8"/><Path d="M22 12V8"/><Path d="M18 8a2 2 0 0 1 2-2 2 2 0 0 0 2-2"/>
      </Svg>
    );
  }

  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3C8 8 6 11 6 15a6 6 0 0012 0c0-4-2-7-6-12z" />
    </Svg>
  );
}

function DietPlanWebsiteCard() {
  return (
    <View className="relative mt-5 rounded-[26px] overflow-hidden border border-white/10 shadow-lg shadow-forest/15">
      <LinearGradient
        colors={['#06290C', '#0C3D15']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View 
        className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-sage/10 blur-2xl" 
        pointerEvents="none" 
      />

      <View className="p-5 flex-col gap-4">
        <View className="flex-row items-center gap-2 flex-wrap">
          <View className="bg-white/12 px-2.5 py-0.5 rounded-full flex-row items-center gap-1.5 border border-white/10">
            <Svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#E3F3E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
            </Svg>
            <Text className="text-sage text-[9px] uppercase font-bold tracking-[1.3px]" style={AppTypography.eyebrow}>
              Companion Plan
            </Text>
          </View>
          
          <View className="bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
            <Text className="text-sage/60 text-[9px] uppercase font-bold tracking-[0.5px]" style={AppTypography.eyebrow}>
              Personalised PDF
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-white font-medium" style={AppTypography.displayCardMd}>
            Want a diet plan for your routine?
          </Text>
          <Text className="text-sage/75 mt-1.5" style={AppTypography.bodyCompact}>
            Get a personalised PDF built around your health context, regional food habits, dislikes, schedule, and home cooking setup.
          </Text>
        </View>

        <View className="gap-y-2 border-t border-b border-white/8 py-3.5 my-0.5">
          <View className="flex-row items-center gap-2.5">
            <View className="w-[18px] h-[18px] rounded-full bg-white/12 items-center justify-center border border-white/5">
              <Svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#E3F3E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>
            <Text className="text-sage/90 text-[13px] font-semibold" style={AppTypography.bodyCompact}>
              Health context, allergies, and preferences
            </Text>
          </View>
          
          <View className="flex-row items-center gap-2.5">
            <View className="w-[18px] h-[18px] rounded-full bg-white/12 items-center justify-center border border-white/5">
              <Svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#E3F3E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>
            <Text className="text-sage/90 text-[13px] font-semibold" style={AppTypography.bodyCompact}>
              Regional meals you can actually follow
            </Text>
          </View>
          
          <View className="flex-row items-center gap-2.5">
            <View className="w-[18px] h-[18px] rounded-full bg-white/12 items-center justify-center border border-white/5">
              <Svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#E3F3E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>
            <Text className="text-sage/90 text-[13px] font-semibold" style={AppTypography.bodyCompact}>
              Built for family or separate cooking
            </Text>
          </View>

          <View className="flex-row items-center gap-2.5">
            <View className="w-[18px] h-[18px] rounded-full bg-white/12 items-center justify-center border border-white/5">
              <Svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#E3F3E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>
            <Text className="text-sage/90 text-[13px] font-semibold" style={AppTypography.bodyCompact}>
              Buy again later for yourself or someone else
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between gap-4 mt-1">
          <View>
            <Text className="text-[10px] uppercase font-bold text-sage/40 tracking-[0.5px]" style={AppTypography.eyebrow}>
              Diet Plan
            </Text>
            <View className="flex-row items-baseline gap-1 mt-0.5">
              <Text className="text-white font-bold text-[20px] font-serif" style={AppTypography.displayMetric}>
                ₹1,299
              </Text>
              <Text className="text-[10px] text-sage/50 font-medium" style={AppTypography.meta}>
                per plan
              </Text>
            </View>
          </View>

          <Pressable
            onPress={openDietPlanWebsite}
            className="flex-1 max-w-[190px] bg-white rounded-full py-3 px-4 flex-row items-center justify-center gap-2 shadow-sm active:opacity-90"
          >
            <Text className="text-forest text-[14px] font-bold" style={AppTypography.buttonSm}>
              Get My Diet Plan
            </Text>
            <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M12 5l7 7-7 7" />
            </Svg>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function ExplorePrograms({
  programs,
  isLoading = false,
  recommendedProgramSlug = null,
  title = 'Explore Programs',
  emptyMessage = 'You have already unlocked the programs currently available here.',
}: ExploreProgramsProps) {
  const router = useRouter();

  const handleProgramPress = (programSlug: ProgramContent['slug']) => {
    router.push({
      pathname: '/paywall',
      params: { program: programSlug },
    });
  };

  return (
    <View className="mt-2">
      <View className="px-0.5 mb-3">
        <Text className="text-forest tracking-[-0.01em]" style={AppTypography.displaySectionTitle}>{title}</Text>
      </View>

      {isLoading ? (
        <>
          {[0, 1].map((index) => (
            <View
              key={index}
              className={`bg-white rounded-[20px] p-4 shadow-sm shadow-forest/5 flex-row gap-3.5 items-start ${index === 0 ? 'mb-2.5' : ''}`}
            >
              <SkeletonCircle className="bg-forest/10" />
              <View className="flex-1 pt-1">
                <SkeletonTitle className="bg-forest/10" />
                <SkeletonLine className="bg-forest/10 mt-3" width="95%" />
                <SkeletonLine className="bg-forest/10 mt-2" width="78%" />
                <View className="flex-row gap-2 mt-3">
                  <SkeletonLine className="bg-forest/10" width={76} />
                  <SkeletonLine className="bg-forest/10" width={92} />
                </View>
              </View>
            </View>
          ))}
        </>
      ) : programs.length === 0 ? (
        <View className="bg-white rounded-[20px] p-4 shadow-sm shadow-forest/5">
          <Text
            className="text-forest/55"
            style={AppTypography.body}
          >
            {emptyMessage}
          </Text>
        </View>
      ) : (
        programs.map((program, index) => (
          <Pressable
            key={program.slug}
            onPress={() => handleProgramPress(program.slug)}
            className={`bg-white rounded-[20px] p-4 shadow-sm shadow-forest/5 flex-row gap-3.5 items-start ${index < programs.length - 1 ? 'mb-2.5' : ''}`}
          >
            <View className="w-[44px] h-[44px] rounded-2xl bg-[#E3F2E5] items-center justify-center shrink-0">
              <ProgramIcon category={program.category} />
            </View>
            <View className="flex-1">
              <Text className="text-forest" style={AppTypography.displayCardSm}>{program.name}</Text>
              <Text
                className="text-forest/50 mt-1"
                style={AppTypography.body}
              >
                {program.description}
              </Text>
              <View className="flex-row items-center flex-wrap gap-2 mt-2">
                {program.slug === recommendedProgramSlug ? (
                  <View className="bg-forest px-2 py-0.5 rounded-full">
                    <Text className="text-white" style={programStatusTextStyle}>
                      Recommended for you
                    </Text>
                  </View>
                ) : null}
                {program.hasAudio ? (
                  <View className="bg-[#E3F2E5] px-2 py-0.5 rounded-full">
                    <Text className="text-forest" style={programStatusTextStyle}>Audio</Text>
                  </View>
                ) : null}
                {(() => {
                  const tag = getStatusTagProps(program);
                  return (
                    <View className={tag.containerClass}>
                      <Text className={tag.textClass} style={programStatusTextStyle}>
                        {tag.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              {program.priceString ? (
                <View className="mt-3 pt-3 border-t border-forest/8 flex-row items-end justify-between gap-3">
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text
                        className="text-forest/38"
                        style={[AppTypography.meta, { textDecorationLine: 'line-through' }]}
                      >
                        {getOriginalPrice(program.priceString) ?? program.priceString}
                      </Text>
                      <View className="bg-[#E3F2E5] px-2 py-0.5 rounded-full">
                        <Text className="text-forest" style={programStatusTextStyle}>
                          50% OFF
                        </Text>
                      </View>
                    </View>
                    <Text className="text-forest mt-1" style={[AppTypography.bodyStrong, { letterSpacing: 0.3 }]}>
                      {getDiscountedPrice(program.priceString) ?? program.priceString}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))
      )}
      <DietPlanWebsiteCard />
    </View>
  );
}
