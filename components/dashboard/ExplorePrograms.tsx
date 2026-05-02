import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Svg, Path } from 'react-native-svg';
import type { ProgramContent } from '@/types/content';
import { SkeletonCircle, SkeletonLine, SkeletonTitle } from '@/components/ui/Skeleton';

interface ExploreProgramsProps {
  programs: ProgramContent[];
  isLoading?: boolean;
}

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
      containerClass: 'bg-[#EEF6EF] px-2 py-0.5 rounded-full',
      textClass: 'font-satoshi-bold uppercase text-[9px] tracking-[0.08em] text-forest',
    };
  }

  if (program.contentStatus === 'sample') {
    return {
      label: 'Preview available',
      containerClass: 'bg-[#FDF6E3] px-2 py-0.5 rounded-full border border-[#E8DCC2]',
      textClass: 'font-satoshi-bold uppercase text-[9px] tracking-[0.08em] text-[#916A15]',
    };
  }

  return {
    label: 'Coming soon',
    containerClass: 'bg-surface px-2 py-0.5 rounded-full border border-forest/10',
    textClass: 'font-satoshi-bold uppercase text-[9px] tracking-[0.08em] text-forest/40',
  };
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

export function ExplorePrograms({
  programs,
  isLoading = false,
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
        <Text className="font-erode-medium text-[21px] text-forest tracking-[-0.01em]">Explore Programs</Text>
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
          <Text className="font-satoshi text-[14px] text-forest/55 leading-relaxed">
            You have already unlocked the programs currently available here.
          </Text>
        </View>
      ) : (
        programs.map((program, index) => (
          <Pressable
            key={program.slug}
            onPress={() => handleProgramPress(program.slug)}
            className={`bg-white rounded-[20px] p-4 shadow-sm shadow-forest/5 flex-row gap-3.5 items-start ${index < programs.length - 1 ? 'mb-2.5' : ''}`}
          >
            <View className="w-[44px] h-[44px] rounded-2xl bg-[#EEF6EF] items-center justify-center shrink-0">
              <ProgramIcon category={program.category} />
            </View>
            <View className="flex-1">
              <Text className="font-erode-medium text-[17px] text-forest leading-snug">{program.name}</Text>
              <Text className="font-satoshi text-[13px] text-forest/50 mt-1 leading-relaxed">{program.description}</Text>
              <View className="flex-row items-center flex-wrap gap-2 mt-2">
                {program.hasAudio ? (
                  <View className="bg-[#EEF6EF] px-2 py-0.5 rounded-full">
                    <Text className="font-satoshi-bold uppercase text-[9px] tracking-[0.08em] text-forest">Audio</Text>
                  </View>
                ) : null}
                {(() => {
                  const tag = getStatusTagProps(program);
                  return (
                    <View className={tag.containerClass}>
                      <Text className={tag.textClass}>
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
                        className="font-satoshi text-[12px] text-forest/38"
                        style={{ textDecorationLine: 'line-through' }}
                      >
                        {getOriginalPrice(program.priceString) ?? program.priceString}
                      </Text>
                      <View className="bg-[#EEF6EF] px-2 py-0.5 rounded-full">
                        <Text className="font-satoshi-bold uppercase text-[9px] tracking-[0.08em] text-forest">
                          50% OFF
                        </Text>
                      </View>
                    </View>
                    <Text className="font-satoshi-bold text-[15px] text-forest tracking-[0.02em] mt-1">
                      {getDiscountedPrice(program.priceString) ?? program.priceString}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}
