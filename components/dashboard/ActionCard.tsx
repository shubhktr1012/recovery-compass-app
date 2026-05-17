import { View, Text, Pressable } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Svg, Path, Circle, Polygon } from 'react-native-svg';
import { AppTypography } from '@/constants/typography';

interface ActionCardProps {
  dayTitle: React.ReactNode;
  dayPreview: string;
  estimatedMinutes: number;
  activeProgram: string;
  resolvedDayNumber: number;
  availabilityLabel?: string | null;
  isLocked?: boolean;
}

function formatCardAvailabilityLabel(availabilityLabel: string | null) {
  if (!availabilityLabel) return 'Opens soon';
  return availabilityLabel.replace(/^Your next step unlocks\s+/i, 'Opens ');
}

export function ActionCard({
  dayTitle,
  dayPreview,
  estimatedMinutes,
  activeProgram,
  resolvedDayNumber,
  availabilityLabel = null,
  isLocked = false,
}: ActionCardProps) {
  const router = useRouter();
  const compactAvailabilityLabel = formatCardAvailabilityLabel(availabilityLabel);

  return (
    <Pressable
      onPress={
        isLocked
          ? undefined
          : () => router.push(`/day-detail?programSlug=${activeProgram}&dayNumber=${resolvedDayNumber}` as Href)
      }
      disabled={isLocked}
      className="bg-white rounded-3xl overflow-hidden shadow-sm shadow-forest/5"
      style={isLocked ? { opacity: 0.88 } : undefined}
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
        <Text className="text-sage/70 uppercase mb-1.5 relative z-10" style={[AppTypography.metaMedium, { letterSpacing: 1.44 }]}>
          Today&apos;s Session
        </Text>
        <Text className="text-white tracking-[-0.01em] relative z-10" style={AppTypography.displayMetric}>
          {dayTitle}
        </Text>
        <Text
          className="text-white/60 mt-1.5 relative z-10"
          style={AppTypography.body}
        >
          {dayPreview}
        </Text>
      </View>
      <View className="p-4 px-5">
        {isLocked ? (
          <View className="flex-row items-center gap-1.5">
            <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.42)" strokeWidth="1.8" strokeLinecap="round">
              <Circle cx="12" cy="12" r="9" /><Path d="M12 7v5l3 2" />
            </Svg>
            <Text className="text-forest/45 flex-1" numberOfLines={1} style={AppTypography.label}>
              {compactAvailabilityLabel}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-1.5 flex-1 min-w-0">
              <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(6,41,12,0.42)" strokeWidth="1.8" strokeLinecap="round">
                <Circle cx="12" cy="12" r="9" /><Path d="M12 7v5l3 2" />
              </Svg>
              <Text className="text-forest/45 flex-1" numberOfLines={1} style={AppTypography.label}>
                {`${estimatedMinutes} min session`}
              </Text>
            </View>
            <View className="flex-row items-center gap-2 rounded-full px-4 py-2.5 bg-forest shadow-sm shadow-forest/20">
              <Svg width="11" height="11" viewBox="0 0 24 24" fill="#fff" stroke="none">
                <Polygon points="5,3 19,12 5,21" />
              </Svg>
              <Text
                className="text-white"
                style={[AppTypography.buttonMd, { letterSpacing: -0.075 }]}
              >
                Open Today
              </Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}
