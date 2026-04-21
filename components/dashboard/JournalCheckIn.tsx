import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Svg, Path } from 'react-native-svg';

export function JournalCheckIn() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/(tabs)/journal')} className="bg-[#EEF6EF] rounded-[20px] p-4 flex-row items-center gap-3.5">
      <View className="w-10 h-10 rounded-full bg-white items-center justify-center shrink-0">
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </Svg>
      </View>
      <View className="flex-1">
        <Text className="font-satoshi-bold uppercase text-[9px] tracking-[0.18em] text-forest/45">Daily check-in</Text>
        <Text className="font-erode-medium text-[15px] text-forest leading-snug mt-0.5">
          How are you <Text className="font-erode-medium-italic">feeling</Text> right now?
        </Text>
      </View>
      <View className="w-[30px] h-[30px] rounded-full bg-forest items-center justify-center shrink-0">
        <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 12h14M13 5l7 7-7 7"/>
        </Svg>
      </View>
    </Pressable>
  );
}
