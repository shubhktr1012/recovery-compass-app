import { View, Text, Pressable } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Svg, Path, Circle, Polygon } from 'react-native-svg';

interface ActionCardProps {
  dayTitle: React.ReactNode;
  dayPreview: string;
  estimatedMinutes: number;
  activeProgram: string;
  resolvedDayNumber: number;
}

export function ActionCard({
  dayTitle,
  dayPreview,
  estimatedMinutes,
  activeProgram,
  resolvedDayNumber,
}: ActionCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/day-detail?programSlug=${activeProgram}&dayNumber=${resolvedDayNumber}` as Href)}
      className="bg-white rounded-3xl overflow-hidden shadow-sm shadow-forest/5"
    >
      <View className="bg-forest px-5 pt-5 pb-4 relative overflow-hidden">
        <Svg 
          width={110} 
          height={110} 
          viewBox="0 0 120 120" 
          fill="none" 
          pointerEvents="none"
          style={{ position: 'absolute', right: -6, bottom: -6, opacity: 0.12 }}
        >
          <Path d="M60 5 C60 5 110 40 110 72 C110 97 87 117 60 117 C33 117 10 97 10 72 C10 40 60 5 60 5Z" fill="#E3F3E5"/>
          <Path d="M60 62 L60 117" stroke="#E3F3E5" strokeWidth="1.5"/>
        </Svg>
        <Text className="font-satoshi-bold text-[11px] text-sage/70 tracking-[0.14em] uppercase mb-1.5 relative z-10">
          Today&apos;s Session
        </Text>
        <Text className="font-erode-medium text-[22px] text-white leading-tight tracking-[-0.01em] relative z-10">
          {dayTitle}
        </Text>
        <Text className="font-satoshi text-[14px] text-white/60 mt-1.5 leading-relaxed relative z-10">
          {dayPreview}
        </Text>
      </View>
      <View className="p-4 px-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.42)" strokeWidth="1.8" strokeLinecap="round">
              <Circle cx="12" cy="12" r="9" /><Path d="M12 7v5l3 2" />
            </Svg>
            <Text className="font-satoshi text-[13px] text-forest/45">{estimatedMinutes} min session</Text>
          </View>
          <View className="flex-row items-center gap-2 bg-forest rounded-full px-4 py-2.5 shadow-sm shadow-forest/20">
            <Svg width="11" height="11" viewBox="0 0 24 24" fill="#fff" stroke="none">
              <Polygon points="5,3 19,12 5,21" />
            </Svg>
            <Text className="font-satoshi-medium text-[15px] text-white tracking-[-0.005em]">Open Today</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
