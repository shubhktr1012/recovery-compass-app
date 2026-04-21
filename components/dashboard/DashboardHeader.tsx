import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import { formatInr } from '@/lib/onboarding-metrics';

interface DashboardHeaderProps {
  firstName: string;
  avatarLetter: string;
  currentDayNumber: number;
  percentageComplete: number;
  totalDays: number;
  projectedSavings90Days: number;
}

export function DashboardHeader({
  firstName,
  avatarLetter,
  currentDayNumber,
  percentageComplete,
  totalDays,
  projectedSavings90Days,
}: DashboardHeaderProps) {
  return (
    <SafeAreaView edges={['top']} className="bg-forest">
      <View 
        className="bg-forest px-6 pt-3 pb-[52px] relative overflow-hidden"
        style={{ minHeight: 240 }}
      >
        {/* Header Botanical Watermark */}
        <Svg 
          viewBox="0 0 200 200" 
          fill="none" 
          width={190} 
          height={190} 
          pointerEvents="none"
          style={{ 
            position: 'absolute', 
            right: -10, 
            top: -10, 
            opacity: 0.12 
          }}
        >
          <Path d="M100 10 C100 10 165 55 165 105 C165 148 135 182 100 192 C65 182 35 148 35 105 C35 55 100 10 100 10Z" fill="#E3F3E5"/>
          <Path d="M100 48 C100 48 145 78 145 108 C145 133 125 155 100 162 C75 155 55 133 55 108 C55 78 100 48 100 48Z" fill="#E3F3E5"/>
          <Path d="M100 98 L100 192" stroke="#E3F3E5" strokeWidth="1.5"/>
          <Path d="M75 132 Q100 122 125 132" stroke="#E3F3E5" strokeWidth="1.2" fill="none"/>
          <Path d="M85 148 Q100 140 115 148" stroke="#E3F3E5" strokeWidth="1" fill="none"/>
        </Svg>

        <View className="flex-row justify-between items-center mb-5 relative z-10">
          <View className="w-[38px] h-[38px] rounded-full bg-sage/20 border-[1.5px] border-sage/30 items-center justify-center">
            <Text className="font-erode-medium text-base text-sage">{avatarLetter}</Text>
          </View>
          <View className="w-[38px] h-[38px] rounded-full bg-sage/10 items-center justify-center">
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(227,243,229,0.65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <Path d="M13.73 21a2 2 0 01-3.46 0"/>
            </Svg>
          </View>
        </View>

        <Text className="font-satoshi text-[11px] font-medium tracking-[0.12em] uppercase text-sage/55 relative z-10">Good morning</Text>
        <Text className="font-erode-medium text-[36px] text-white leading-tight tracking-[-0.02em] relative z-10 mt-0.5">
          Welcome back, <Text className="font-erode-medium-italic">{firstName}.</Text>
        </Text>

        {/* STREAK PILLS */}
        <View className="flex-row items-center gap-2 mt-4 relative z-10">
          <View className="flex-row items-center gap-1.5 bg-sage/10 border border-sage/20 rounded-full px-3 py-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_0_3px_rgba(93,207,122,0.22)]" />
            <Text className="font-satoshi text-[11px] font-medium text-sage/90 tracking-[0.03em]">Day {currentDayNumber} in motion</Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-sage/5 border border-sage/15 rounded-full px-3 py-1.5">
            <Text className="font-satoshi text-[11px] font-medium text-sage/90 tracking-[0.03em]">
              {formatInr(projectedSavings90Days > 0 ? projectedSavings90Days : 1820)} saved
            </Text>
          </View>
        </View>

        {/* PROGRESS BAR */}
        <View className="mt-3.5 relative z-10">
          <View className="h-[3px] bg-sage/20 rounded-full overflow-hidden">
            <View className="h-[3px] bg-sage rounded-full" style={{ width: `${percentageComplete}%` }} />
          </View>
          <View className="flex-row justify-between mt-1.5">
            <Text className="font-satoshi text-[10px] text-sage/45 tracking-[0.08em] uppercase">Day {currentDayNumber} of {totalDays}</Text>
            <Text className="font-satoshi text-[10px] text-sage/45 tracking-[0.08em] uppercase">{percentageComplete}% complete</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
