import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Svg, Path } from 'react-native-svg';
import { AppTypography } from '@/constants/typography';

interface MyProgramsProps {
  activeCount: number;
}

export function MyPrograms({
  activeCount,
}: MyProgramsProps) {
  const router = useRouter();

  return (
    <View className="mt-1">
      <Pressable
        onPress={() => router.push('/account/programs')}
        className="bg-white rounded-[20px] p-4 shadow-sm shadow-forest/5 flex-row gap-3.5 items-start"
      >
        <View className="w-[44px] h-[44px] rounded-2xl bg-[#E3F2E5] items-center justify-center shrink-0">
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </Svg>
        </View>
        <View className="flex-1">
          <Text className="font-erode-medium text-[18px] text-forest leading-snug">My Programs</Text>
          <Text
            className="text-forest/50 mt-1"
            style={AppTypography.body}
          >
            {activeCount > 1
              ? `Switch your current journey or open ${activeCount} unlocked programs.`
              : 'Open your current journey or manage unlocked programs.'}
          </Text>
        </View>
        <View className="pt-1">
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.35)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 18l6-6-6-6" />
          </Svg>
        </View>
      </Pressable>
    </View>
  );
}
