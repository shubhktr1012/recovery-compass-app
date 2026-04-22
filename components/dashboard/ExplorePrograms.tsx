import { Alert, View, Text, Pressable } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Svg, Path } from 'react-native-svg';
import type { ProgramContent } from '@/types/content';
import { SkeletonCircle, SkeletonLine, SkeletonTitle } from '@/components/ui/Skeleton';

interface ExploreProgramsProps {
  programs: ProgramContent[];
  isLoading?: boolean;
  isPurchaseLocked?: boolean;
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

function getStatusLabel(program: ProgramContent) {
  if (program.contentStatus === 'ready') {
    return 'Available now';
  }

  if (program.contentStatus === 'sample') {
    return 'Preview available';
  }

  return 'Coming soon';
}

export function ProgramIcon({ category }: { category: ProgramContent['category'] }) {
  if (category === 'sleep') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round">
        <Path d="M20 14A8 8 0 1110 4a7 7 0 0010 10z"/>
      </Svg>
    );
  }

  if (category === 'energy') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round">
        <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>
      </Svg>
    );
  }

  if (category === 'aging') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round">
        <Path d="M12 3C8 8 6 11 6 15a6 6 0 0012 0c0-4-2-7-6-12z"/>
      </Svg>
    );
  }

  if (category === 'sexual_health') {
    return (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round">
        <Path d="M12 21c-4.35-2.55-7-5.6-7-9a4 4 0 017-2.65A4 4 0 0119 12c0 3.4-2.65 6.45-7 9z"/>
      </Svg>
    );
  }

  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round">
      <Path d="M12 3C8 8 6 11 6 15a6 6 0 0012 0c0-4-2-7-6-12z"/>
    </Svg>
  );
}

export function ExplorePrograms({
  programs,
  isLoading = false,
  isPurchaseLocked = false,
}: ExploreProgramsProps) {
  const router = useRouter();

  const handleProgramPress = (programSlug: ProgramContent['slug']) => {
    if (isPurchaseLocked) {
      Alert.alert(
        'One Program At Launch',
        'For launch, each account can unlock one program while we finalize the best multi-program experience.'
      );
      return;
    }

    router.push(`/paywall?program=${programSlug}` as Href);
  };

  return (
    <View className="mt-2">
      <View className="px-0.5 mb-3">
        <Text className="font-erode-medium text-[20px] text-forest tracking-[-0.01em]">Explore Programs</Text>
        {isPurchaseLocked ? (
          <Text className="font-satoshi text-[11px] text-forest/50 leading-relaxed mt-1.5 pr-4">
            At launch, your library is limited to one unlocked program while we shape the multi-program experience.
          </Text>
        ) : null}
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
          <Text className="font-satoshi text-[12px] text-forest/55 leading-relaxed">
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
              <Text className="font-erode-medium text-[16px] text-forest leading-snug">{program.name}</Text>
              <Text className="font-satoshi text-[11px] text-forest/50 mt-1 leading-relaxed">{program.description}</Text>
              <View className="flex-row items-center flex-wrap gap-2 mt-2">
                {program.hasAudio ? (
                  <View className="bg-[#EEF6EF] px-2 py-0.5 rounded-full">
                    <Text className="font-satoshi-bold uppercase text-[8px] tracking-[0.08em] text-forest">Audio</Text>
                  </View>
                ) : null}
                <View className="bg-[#EEF6EF] px-2 py-0.5 rounded-full">
                  <Text className="font-satoshi-bold uppercase text-[8px] tracking-[0.08em] text-forest">
                    {isPurchaseLocked ? 'Launch limit' : getStatusLabel(program)}
                  </Text>
                </View>
              </View>
              {program.priceString ? (
                <View className="mt-3 pt-3 border-t border-forest/8 flex-row items-end justify-between gap-3">
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text
                        className="font-satoshi text-[11px] text-forest/38"
                        style={{ textDecorationLine: 'line-through' }}
                      >
                        {getOriginalPrice(program.priceString) ?? program.priceString}
                      </Text>
                      <View className="bg-[#EEF6EF] px-2 py-0.5 rounded-full">
                        <Text className="font-satoshi-bold uppercase text-[8px] tracking-[0.08em] text-forest">
                          50% OFF
                        </Text>
                      </View>
                    </View>
                    <Text className="font-satoshi-bold text-[14px] text-forest tracking-[0.02em] mt-1">
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
