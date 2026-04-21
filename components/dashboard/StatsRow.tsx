import { View, Text } from 'react-native';

interface StatsRowProps {
  currentDayNumber: number;
  monthlySpend: number;
}

export function StatsRow({ currentDayNumber, monthlySpend }: StatsRowProps) {
  return (
    <View className="flex-row justify-between gap-2.5">
      <View className="flex-1 bg-white rounded-[18px] p-3 py-3.5 text-center shadow-sm shadow-forest/5 flex-col items-center">
        <Text className="font-erode-medium text-2xl text-forest tracking-[-0.02em] leading-none mb-1">{currentDayNumber}</Text>
        <Text className="font-satoshi-bold uppercase text-[9px] tracking-[0.16em] text-forest/40">Days</Text>
        <Text className="font-satoshi text-[10px] text-forest/40 mt-0.5">on rhythm</Text>
      </View>
      <View className="flex-1 bg-white rounded-[18px] p-3 py-3.5 text-center shadow-sm shadow-forest/5 flex-col items-center">
        <Text className="font-erode-medium text-2xl text-forest tracking-[-0.02em] leading-none mb-1">
          {monthlySpend > 0 ? `₹${(monthlySpend / 1000).toFixed(1)}k` : '₹1.8k'}
        </Text>
        <Text className="font-satoshi-bold uppercase text-[9px] tracking-[0.16em] text-forest/40">Saved</Text>
        <Text className="font-satoshi text-[10px] text-forest/40 mt-0.5">this month</Text>
      </View>
      <View className="flex-1 bg-white rounded-[18px] p-3 py-3.5 text-center shadow-sm shadow-forest/5 flex-col items-center">
        <Text className="font-erode-medium text-2xl text-forest tracking-[-0.02em] leading-none mb-1">0d 8h</Text>
        <Text className="font-satoshi-bold uppercase text-[9px] tracking-[0.16em] text-forest/40">In Motion</Text>
        <Text className="font-satoshi text-[10px] text-forest/40 mt-0.5">total time</Text>
      </View>
    </View>
  );
}
