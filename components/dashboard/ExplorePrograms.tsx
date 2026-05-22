import { Alert, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { Svg, Path } from 'react-native-svg';
import type { ProgramContent } from '@/types/content';
import { SkeletonCircle, SkeletonLine, SkeletonTitle } from '@/components/ui/Skeleton';
import { AppTypography } from '@/constants/typography';

const DIET_PLAN_WEBSITE_URL = 'https://recoverycompass.co/diet-plan';

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
    await openBrowserAsync(DIET_PLAN_WEBSITE_URL, {
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
    <Pressable
      onPress={openDietPlanWebsite}
      className="bg-forest rounded-[22px] p-4 mt-4 shadow-sm shadow-forest/10 flex-row gap-3.5 items-center"
    >
      <View className="w-[44px] h-[44px] rounded-2xl bg-white/10 border border-white/12 items-center justify-center shrink-0">
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E3F3E5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 19c4-1 7-4 8-8" />
          <Path d="M12 11c2.5-1 4.5-3 6-6" />
          <Path d="M18 5c.5 4-.2 8.5-3.4 11.6C11.4 19.8 7 20.5 3 20c-.5-4 .2-8.4 3.4-11.6C9.6 5.2 14 4.5 18 5Z" />
        </Svg>
      </View>
      <View className="flex-1">
        <Text className="uppercase text-sage/58" style={[AppTypography.eyebrow, { letterSpacing: 1.3 }]}>
          Custom Diet Plan
        </Text>
        <Text className="text-white mt-1" style={AppTypography.displayCardSm}>
          Get a food plan built around your routine.
        </Text>
        <Text className="text-sage/62 mt-1" style={AppTypography.bodyCompact}>
          Opens the Recovery Compass website.
        </Text>
      </View>
      <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(227,243,229,0.72)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 18l6-6-6-6" />
      </Svg>
    </Pressable>
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
