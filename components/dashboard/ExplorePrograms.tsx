import { View, Text } from 'react-native';
import { Svg, Path } from 'react-native-svg';

export function ExplorePrograms() {
  return (
    <View className="mt-2">
      <View className="flex-row justify-between items-baseline px-0.5 mb-3">
        <Text className="font-erode-medium text-[20px] text-forest tracking-[-0.01em]">Explore</Text>
        <Text className="font-satoshi-medium text-[11px] text-forest/45 tracking-[0.04em]">Browse all</Text>
      </View>

      <View className="bg-white rounded-[20px] p-4 shadow-sm shadow-forest/5 flex-row gap-3.5 mb-2.5 items-start">
        <View className="w-[44px] h-[44px] rounded-2xl bg-[#EEF6EF] items-center justify-center shrink-0">
          <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round">
            <Path d="M12 3C8 8 6 11 6 15a6 6 0 0012 0c0-4-2-7-6-12z"/>
          </Svg>
        </View>
        <View className="flex-1">
          <Text className="font-erode-medium text-[16px] text-forest leading-snug">90-Day Quit Smoking</Text>
          <Text className="font-satoshi text-[11px] text-forest/50 mt-1 leading-relaxed">Lasting change through awareness, resilience, and consistency.</Text>
          <Text className="font-satoshi-bold text-xs text-forest mt-2">
            ₹6,549 <Text className="font-satoshi text-[11px] font-normal text-forest/40 line-through ml-1">₹15,000</Text>
          </Text>
        </View>
      </View>

      <View className="bg-white rounded-[20px] p-4 shadow-sm shadow-forest/5 flex-row gap-3.5 items-start">
        <View className="w-[44px] h-[44px] rounded-2xl bg-[#EEF6EF] items-center justify-center shrink-0">
          <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06290C" strokeWidth="1.6" strokeLinecap="round">
            <Path d="M20 14A8 8 0 1110 4a7 7 0 0010 10z"/>
          </Svg>
        </View>
        <View className="flex-1">
          <Text className="font-erode-medium text-[16px] text-forest leading-snug">21-Day Sleep Reset</Text>
          <Text className="font-satoshi text-[11px] text-forest/50 mt-1 leading-relaxed">Restore your natural sleep rhythm through targeted protocols.</Text>
          <View className="flex-row items-center mt-2">
            <Text className="font-satoshi-bold text-xs text-forest">₹4,999</Text>
            <Text className="font-satoshi text-[11px] font-normal text-forest/40 line-through ml-1.5 mr-2">₹12,000</Text>
            <View className="bg-[#EEF6EF] px-2 py-0.5 rounded-full">
              <Text className="font-satoshi-bold uppercase text-[8px] tracking-[0.08em] text-forest">Coming soon</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
